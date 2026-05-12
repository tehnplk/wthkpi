import { NextResponse } from "next/server";
import db from "@/lib/db";

interface CountRow {
  count: number;
}

interface StatusRow {
  status: string;
  count: number;
}

export async function GET() {
  try {
    const [totalTopics, totalResults, statusCounts, recentResults] = await Promise.all([
      db("kpi_topic").count("* as count").first(),
      db("kpi_result").count("* as count").first(),
      db("kpi_result")
        .select("status")
        .count("* as count")
        .groupBy("status") as Promise<StatusRow[]>,
      db("kpi_result")
        .join("kpi_topic", "kpi_result.kpi_id", "kpi_topic.id")
        .select(
          "kpi_result.*",
          db.raw("DATE_FORMAT(kpi_result.report_date, '%Y-%m-%d') as report_date"),
          "kpi_topic.name as kpi_name"
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
      recentResults,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
