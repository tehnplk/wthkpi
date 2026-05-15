import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import * as XLSX from "xlsx";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";

const STATUS_EXPR = "COALESCE(kpi_topic.status, 'pending')";

const statusLabels: Record<string, string> = {
  pass: "ผ่าน",
  fail: "ไม่ผ่าน",
  pending: "รอดำเนินการ",
};

function thaiBudgetYear(): number {
  const now = new Date();
  const y = now.getFullYear() + 543;
  return now.getMonth() >= 9 ? y + 1 : y;
}

function getXmlCount(xml: string, tagName: string): number {
  const match = xml.match(new RegExp(`<${tagName} count="(\\d+)"`));
  return match ? Number(match[1]) : 0;
}

function setCellStyleInRow(rowXml: string, styleIndex: number): string {
  return rowXml.replace(/<c([^>]*?)>/g, (cellTag, attributes: string) => {
    if (/\ss="\d+"/.test(attributes)) {
      return cellTag.replace(/\ss="\d+"/, ` s="${styleIndex}"`);
    }

    return `<c${attributes} s="${styleIndex}">`;
  });
}

async function applyNoReportingRowStyle(buffer: Buffer, rowNumbers: number[]): Promise<Buffer> {
  if (rowNumbers.length === 0) return buffer;

  const zip = await JSZip.loadAsync(buffer);
  const stylesFile = zip.file("xl/styles.xml");
  const sheetFile = zip.file("xl/worksheets/sheet1.xml");

  if (!stylesFile || !sheetFile) return buffer;

  let stylesXml = await stylesFile.async("string");
  const fontId = getXmlCount(stylesXml, "fonts");
  const fillId = getXmlCount(stylesXml, "fills");
  const styleIndex = getXmlCount(stylesXml, "cellXfs");

  stylesXml = stylesXml
    .replace(
      /<fonts count="(\d+)">/,
      (_match, count) => `<fonts count="${Number(count) + 1}">`
    )
    .replace(
      "</fonts>",
      '<font><sz val="12"/><color rgb="FF738079"/><name val="Calibri"/><family val="2"/><scheme val="minor"/></font></fonts>'
    )
    .replace(
      /<fills count="(\d+)">/,
      (_match, count) => `<fills count="${Number(count) + 1}">`
    )
    .replace(
      "</fills>",
      '<fill><patternFill patternType="solid"><fgColor rgb="FFF2F5F4"/><bgColor indexed="64"/></patternFill></fill></fills>'
    )
    .replace(
      /<cellXfs count="(\d+)">/,
      (_match, count) => `<cellXfs count="${Number(count) + 1}">`
    )
    .replace(
      "</cellXfs>",
      `<xf numFmtId="0" fontId="${fontId}" fillId="${fillId}" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs>`
    );

  zip.file("xl/styles.xml", stylesXml);

  const rowSet = new Set(rowNumbers);
  let sheetXml = await sheetFile.async("string");
  sheetXml = sheetXml.replace(/<row\b[^>]*\br="(\d+)"[^>]*>[\s\S]*?<\/row>/g, (rowXml, rowNumber) => {
    if (!rowSet.has(Number(rowNumber))) return rowXml;
    return setCellStyleInRow(rowXml, styleIndex);
  });
  zip.file("xl/worksheets/sheet1.xml", sheetXml);

  const styledBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  return Buffer.from(styledBuffer);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบเพื่อ Export Excel" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const kpiTypeId = searchParams.get("kpi_type_id");
    const departmentId = searchParams.get("department_id");
    const status = searchParams.get("status");
    const topic = searchParams.get("topic")?.trim();
    const budgetYear = searchParams.get("budget_year")
      ? Number(searchParams.get("budget_year"))
      : thaiBudgetYear();

    const aggSub = db("kpi_result_mon")
      .select("kpi_id", "budget_year")
      .max("target as target")
      .sum("result as sum_result")
      .where("budget_year", budgetYear)
      .groupBy("kpi_id", "budget_year")
      .as("agg");

    let query = db("kpi_topic")
      .leftJoin(aggSub, function () {
        this.on("kpi_topic.id", "=", "agg.kpi_id");
      })
      .leftJoin("kpi_type", "kpi_topic.kpi_type_id", "kpi_type.id")
      .select(
        "agg.target",
        "agg.sum_result as result",
        db.raw("ROUND(agg.sum_result / NULLIF(agg.target, 0) * kpi_topic.rate_cal_value, 2) as percent"),
        db.raw(`${STATUS_EXPR} as status`),
        "kpi_topic.id as kpi_id",
        "kpi_topic.name as kpi_name",
        "kpi_topic.criteria as topic_criteria",
        "kpi_topic.note as topic_note",
        "kpi_topic.kpi_type_id",
        "kpi_type.type as kpi_type",
        "kpi_topic.kpi_number",
        "kpi_topic.flag_reporting"
      );

    if (kpiTypeId) query = query.where("kpi_topic.kpi_type_id", kpiTypeId);
    if (departmentId) {
      query = query.whereExists(function () {
        this.select(db.raw("1"))
          .from("kpi_topic_department")
          .whereRaw("kpi_topic_department.kpi_id = kpi_topic.id")
          .where("kpi_topic_department.department_id", departmentId);
      });
    }
    if (topic) query = query.where("kpi_topic.name", "like", `%${topic}%`);
    if (status) query = query.whereRaw(`${STATUS_EXPR} = ?`, [status]);

    const results = await query
      .orderByRaw("kpi_topic.kpi_number IS NULL asc")
      .orderByRaw("CAST(kpi_topic.kpi_number AS UNSIGNED) asc")
      .orderBy("kpi_topic.kpi_number", "asc")
      .orderBy("kpi_topic.name", "asc");
    const topicIds = results.map((row) => row.kpi_id);
    const departmentLinks = topicIds.length
      ? await db("kpi_topic_department")
          .select("kpi_topic_department.kpi_id", "department.name as department_name")
          .join("department", "kpi_topic_department.department_id", "department.id")
          .whereIn("kpi_topic_department.kpi_id", topicIds)
          .orderBy("kpi_topic_department.department_id", "asc")
      : [];

    const departmentsByKpiId: Record<number, string[]> = {};
    for (const link of departmentLinks) {
      if (!departmentsByKpiId[link.kpi_id]) departmentsByKpiId[link.kpi_id] = [];
      departmentsByKpiId[link.kpi_id].push(link.department_name);
    }

    const noReportingRowNumbers: number[] = [];
    const rows = results.map((row, index) => {
      const isReporting = row.flag_reporting !== "no";
      if (!isReporting) noReportingRowNumbers.push(index + 2);

      return {
        "ลำดับ": row.kpi_number || "-",
        "ประเภท": row.kpi_type || "-",
        "ตัวชี้วัด": row.kpi_name,
        "เกณฑ์การวัดผล": row.topic_criteria || "-",
        "หมายเหตุ": row.topic_note || "-",
        "ฝ่าย": (departmentsByKpiId[row.kpi_id] || []).join(", ") || "-",
        "จำนวนกลุ่มเป้าหมาย": isReporting ? row.target ?? "-" : "-",
        "ผลงาน": isReporting ? row.result ?? "-" : "-",
        "อัตรา": isReporting ? row.percent ?? "-" : "-",
        "สถานะ": isReporting ? statusLabels[row.status || "pending"] || row.status || "-" : "-",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows, {
      header: [
        "ลำดับ",
        "ประเภท",
        "ตัวชี้วัด",
        "เกณฑ์การวัดผล",
        "หมายเหตุ",
        "ฝ่าย",
        "จำนวนกลุ่มเป้าหมาย",
        "ผลงาน",
        "อัตรา",
        "สถานะ",
      ],
    });
    worksheet["!cols"] = [
      { wch: 10 },
      { wch: 18 },
      { wch: 48 },
      { wch: 36 },
      { wch: 36 },
      { wch: 32 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 18 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "KPI Results");
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
    const styledBuffer = await applyNoReportingRowStyle(buffer, noReportingRowNumbers);

    return new NextResponse(new Uint8Array(styledBuffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="kpi-results-${budgetYear}.xlsx"`,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
