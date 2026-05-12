import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

function unauthorized() {
  return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const kpiId = searchParams.get("kpi_id");
    const status = searchParams.get("status");
    const topic = searchParams.get("topic")?.trim();
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let query = db("kpi_topic")
      .leftJoin("kpi_result", "kpi_topic.id", "kpi_result.kpi_id")
      .select(
        "kpi_result.*",
        db.raw("DATE_FORMAT(kpi_result.report_date, '%Y-%m-%d') as report_date"),
        "kpi_topic.id as kpi_id",
        "kpi_topic.name as kpi_name",
        "kpi_topic.kpi_number",
        "kpi_topic.note as topic_note"
      );

    if (kpiId) query = query.where("kpi_topic.id", kpiId);
    if (topic) query = query.where("kpi_topic.name", "like", `%${topic}%`);
    if (status) query = query.where("kpi_result.status", status);
    if (from) query = query.where("kpi_result.report_date", ">=", from);
    if (to) query = query.where("kpi_result.report_date", "<=", to);

    const results = await query.orderBy("kpi_topic.name", "asc");
    return NextResponse.json(results);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const body = await request.json();
    const insertData: Record<string, unknown> = {
      kpi_id: body.kpi_id,
      target: body.target ?? null,
      result: body.result ?? null,
      percent: body.percent ?? null,
      status: body.status || "pending",
      note: body.note || null,
      report_date: body.report_date || null,
    };
    const [id] = await db("kpi_result").insert(insertData);
    const result = await db("kpi_result")
      .join("kpi_topic", "kpi_result.kpi_id", "kpi_topic.id")
      .select(
        "kpi_result.*",
        db.raw("DATE_FORMAT(kpi_result.report_date, '%Y-%m-%d') as report_date"),
        "kpi_topic.name as kpi_name",
        "kpi_topic.kpi_number",
        "kpi_topic.note as topic_note"
      )
      .where("kpi_result.id", id)
      .first();
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
