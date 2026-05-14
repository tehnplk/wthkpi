import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

const STATUS_EXPR = "COALESCE(kpi_topic.status, 'pending')";

function thaiBudgetYear(): number {
  const now = new Date();
  const y = now.getFullYear() + 543;
  return now.getMonth() >= 9 ? y + 1 : y;
}

export async function GET(request: NextRequest) {
  try {
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
        db.raw("NULL as id"),
        "agg.target",
        "agg.sum_result as result",
        db.raw("ROUND(agg.sum_result / NULLIF(agg.target, 0) * kpi_topic.rate_cal_value, 2) as percent"),
        db.raw(`${STATUS_EXPR} as status`),
        db.raw("NULL as note"),
        db.raw(`'${budgetYear}' as report_date`),
        "kpi_topic.id as kpi_id",
        "kpi_topic.name as kpi_name",
        "kpi_topic.kpi_type_id",
        "kpi_type.type as kpi_type",
        "kpi_topic.kpi_number",
        "kpi_topic.criteria as topic_criteria",
        "kpi_topic.note as topic_note"
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
    if (status) {
      query = query.whereRaw(
        `${STATUS_EXPR} = ?`,
        [status]
      );
    }

    const results = await query.orderBy("kpi_topic.name", "asc");
    return NextResponse.json(results);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
