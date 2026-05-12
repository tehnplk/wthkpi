import { NextResponse } from "next/server";
import db from "@/lib/db";

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

export async function GET() {
  try {
    const [totalTopics, totalResults, statusCounts, kpiTypeSummary, recentResults] = await Promise.all([
      db("kpi_topic").count("* as count").first(),
      db("kpi_result").count("* as count").first(),
      db("kpi_topic")
        .leftJoin("kpi_result", "kpi_topic.id", "kpi_result.kpi_id")
        .select(db.raw("COALESCE(kpi_result.status, kpi_topic.status, 'pending') as status"))
        .count("* as count")
        .groupByRaw("COALESCE(kpi_result.status, kpi_topic.status, 'pending')") as Promise<StatusRow[]>,
      db("kpi_type")
        .leftJoin("kpi_topic", "kpi_type.id", "kpi_topic.kpi_type_id")
        .leftJoin("kpi_result", "kpi_topic.id", "kpi_result.kpi_id")
        .select("kpi_type.id", "kpi_type.type")
        .countDistinct("kpi_topic.id as total_topics")
        .count("kpi_result.id as total_results")
        .sum({
          pass_count: db.raw("CASE WHEN COALESCE(kpi_result.status, kpi_topic.status, 'pending') = 'pass' THEN 1 ELSE 0 END"),
          fail_count: db.raw("CASE WHEN COALESCE(kpi_result.status, kpi_topic.status, 'pending') = 'fail' THEN 1 ELSE 0 END"),
          pending_count: db.raw("CASE WHEN COALESCE(kpi_result.status, kpi_topic.status, 'pending') = 'pending' THEN 1 ELSE 0 END"),
        })
        .groupBy("kpi_type.id", "kpi_type.type")
        .orderBy("kpi_type.id", "asc") as unknown as Promise<KpiTypeSummaryRow[]>,
      db("kpi_result")
        .join("kpi_topic", "kpi_result.kpi_id", "kpi_topic.id")
        .leftJoin("kpi_type", "kpi_topic.kpi_type_id", "kpi_type.id")
        .select(
          "kpi_result.*",
          db.raw("DATE_FORMAT(kpi_result.report_date, '%Y-%m-%d') as report_date"),
          "kpi_topic.name as kpi_name",
          "kpi_topic.kpi_type_id",
          "kpi_type.type as kpi_type"
        )
        .orderBy("kpi_result.created_at", "desc")
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
