import { NextRequest, NextResponse } from "next/server";
import type { Knex } from "knex";
import type { CountRow, StatusCountRow as StatusRow } from "@/app/models/common";
import type { KpiTypeSummaryRow } from "@/app/models/dashboard";
import db from "@/lib/db";

function thaiBudgetYear(): number {
  const now = new Date();
  const y = now.getFullYear() + 543;
  return now.getMonth() >= 9 ? y + 1 : y;
}

function aggSub() {
  const by = thaiBudgetYear();
  return db("kpi_result_mon")
    .select("kpi_id", "budget_year")
    .max("target as target")
    .sum("result as sum_result")
    .where("budget_year", by)
    .groupBy("kpi_id", "budget_year")
    .as("agg");
}

const STATUS_EXPR = "COALESCE(kpi_topic.status, 'pending')";
const REPORTING_FILTER = { "kpi_topic.flag_reporting": "yes" };

function applyDepartmentFilter<TRecord extends object, TResult>(
  query: Knex.QueryBuilder<TRecord, TResult>,
  departmentId: string | null
) {
  if (!departmentId) return query;

  return query.whereExists(function () {
    this.select(db.raw("1"))
      .from("kpi_topic_department")
      .whereRaw("kpi_topic_department.kpi_id = kpi_topic.id")
      .where("kpi_topic_department.department_id", departmentId);
  });
}

export async function GET(request: NextRequest) {
  try {
    const departmentId = request.nextUrl.searchParams.get("department_id");
    const by = thaiBudgetYear();

    const [totalTopics, totalResults, statusCounts, kpiTypeSummary, recentResults] = await Promise.all([
      applyDepartmentFilter(
        db("kpi_topic")
          .count("* as count")
          .where(REPORTING_FILTER),
        departmentId
      ).first(),

      applyDepartmentFilter(
        db("kpi_topic")
          .count("* as count")
          .where(REPORTING_FILTER)
          .whereIn("kpi_topic.status", ["pass", "fail"]),
        departmentId
      ).first(),

      applyDepartmentFilter(
        db("kpi_topic")
          .select(db.raw(`${STATUS_EXPR} as status`))
          .count("* as count")
          .where(REPORTING_FILTER)
          .groupByRaw(STATUS_EXPR),
        departmentId
      ) as unknown as Promise<StatusRow[]>,

      applyDepartmentFilter(
        db("kpi_type")
          .leftJoin("kpi_topic", function () {
            this.on("kpi_type.id", "=", "kpi_topic.kpi_type_id")
              .andOn("kpi_topic.flag_reporting", "=", db.raw("?", ["yes"]));
          })
          .select("kpi_type.id", "kpi_type.type")
          .countDistinct("kpi_topic.id as total_topics")
          .sum({
            total_results: db.raw(`CASE WHEN ${STATUS_EXPR} IN ('pass', 'fail') THEN 1 ELSE 0 END`),
          })
          .sum({
            pass_count: db.raw(`CASE WHEN kpi_topic.id IS NOT NULL AND ${STATUS_EXPR} = 'pass' THEN 1 ELSE 0 END`),
            fail_count: db.raw(`CASE WHEN kpi_topic.id IS NOT NULL AND ${STATUS_EXPR} = 'fail' THEN 1 ELSE 0 END`),
            pending_count: db.raw(`CASE WHEN kpi_topic.id IS NOT NULL AND ${STATUS_EXPR} = 'pending' THEN 1 ELSE 0 END`),
          })
          .groupBy("kpi_type.id", "kpi_type.type")
          .orderBy("kpi_type.id", "asc"),
        departmentId
      ) as unknown as Promise<KpiTypeSummaryRow[]>,

      applyDepartmentFilter(
        db("kpi_topic")
          .leftJoin(aggSub(), function () {
            this.on("kpi_topic.id", "=", "agg.kpi_id");
          })
          .leftJoin("kpi_type", "kpi_topic.kpi_type_id", "kpi_type.id")
          .select(
            db.raw("NULL as id"),
            "agg.target",
            "agg.sum_result as result",
            db.raw("ROUND(agg.sum_result / NULLIF(agg.target, 0) * kpi_topic.rate_cal_value, 2) as percent"),
            db.raw(`${STATUS_EXPR} as status`),
            db.raw(`'${by}' as report_date`),
            "kpi_topic.id as kpi_id",
            "kpi_topic.name as kpi_name",
            "kpi_topic.kpi_type_id",
            "kpi_type.type as kpi_type",
            "kpi_topic.kpi_number",
            "kpi_topic.note as topic_note"
          )
          .where(REPORTING_FILTER)
          .whereNotNull("agg.kpi_id")
          .orderByRaw("agg.sum_result / NULLIF(agg.target, 0) DESC")
          .limit(20),
        departmentId
      ),
    ]);

    const counts: Record<string, number> = { pass: 0, fail: 0, pending: 0 };
    statusCounts.forEach((row: StatusRow) => {
      counts[row.status] = Number(row.count);
    });

    return NextResponse.json({
      totalTopics: Number((totalTopics as unknown as CountRow).count),
      totalResults: Number((totalResults as unknown as CountRow).count),
      passCount: counts.pass,
      failCount: counts.fail,
      pendingCount: counts.pending,
      kpiTypeSummary: kpiTypeSummary.map((row) => ({
        id: row.id,
        type: row.type,
        totalTopics: Number(row.total_topics),
        totalResults: Number(row.total_results),
        passCount: Number(row.pass_count),
        failCount: Number(row.fail_count),
        pendingCount: Number(row.pending_count),
      })),
      recentResults,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
