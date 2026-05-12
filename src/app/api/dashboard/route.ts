import { NextResponse } from "next/server";
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

interface CountRow {
  count: number;
}

interface StatusRow {
  status: string;
  count: number;
}

interface KpiTypeSummaryRow {
  id: number;
  type: string;
  total_topics: number;
  total_results: number;
  pass_count: number;
  fail_count: number;
  pending_count: number;
}

const STATUS_EXPR = "COALESCE(kpi_topic.status, 'pending')";

export async function GET() {
  try {
    const by = thaiBudgetYear();

    const [totalTopics, totalResults, statusCounts, kpiTypeSummary, recentResults] = await Promise.all([
      db("kpi_topic").count("* as count").first(),

      db(aggSub()).count("* as count").whereNotNull("agg.sum_result").first(),

      db("kpi_topic")
        .leftJoin(aggSub(), function () {
          this.on("kpi_topic.id", "=", "agg.kpi_id");
        })
        .select(db.raw(`${STATUS_EXPR} as status`))
        .count("* as count")
        .groupByRaw(STATUS_EXPR) as unknown as Promise<StatusRow[]>,

      db("kpi_type")
        .leftJoin("kpi_topic", "kpi_type.id", "kpi_topic.kpi_type_id")
        .leftJoin(aggSub(), function () {
          this.on("kpi_topic.id", "=", "agg.kpi_id");
        })
        .select("kpi_type.id", "kpi_type.type")
        .countDistinct("kpi_topic.id as total_topics")
        .count("agg.kpi_id as total_results")
        .sum({
          pass_count: db.raw(`CASE WHEN ${STATUS_EXPR} = 'pass' THEN 1 ELSE 0 END`),
          fail_count: db.raw(`CASE WHEN ${STATUS_EXPR} = 'fail' THEN 1 ELSE 0 END`),
          pending_count: db.raw(`CASE WHEN ${STATUS_EXPR} = 'pending' THEN 1 ELSE 0 END`),
        })
        .groupBy("kpi_type.id", "kpi_type.type")
        .orderBy("kpi_type.id", "asc") as unknown as Promise<KpiTypeSummaryRow[]>,

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
        .whereNotNull("agg.kpi_id")
        .orderByRaw("agg.sum_result / NULLIF(agg.target, 0) DESC")
        .limit(20),
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
