import db from "@/lib/db";

// Current/future budget years: pending until the current month (1 = Oct) has its target and result (or level);
// future years have no current month yet. Yearly targets are stored on every month row.
// Past budget years: pending only when the whole year has no result.
export function statusExpr(budgetYear: number) {
  const year = Math.trunc(budgetYear) || 0;
  const now = new Date();
  const currentYear = now.getFullYear() + 543 + (now.getMonth() >= 9 ? 1 : 0);
  const reported = year < currentYear
    ? "(sr.result IS NOT NULL OR sr.result_level IS NOT NULL)"
    : `sr.mon = ${year > currentYear ? 0 : ((now.getMonth() + 3) % 12) + 1} AND (CASE WHEN kpi_topic.cal_type = 'level' THEN sr.result_level IS NOT NULL ELSE sr.result IS NOT NULL AND sr.target IS NOT NULL END)`;
  return `CASE WHEN EXISTS (SELECT 1 FROM kpi_result_mon sr WHERE sr.kpi_id = kpi_topic.id AND sr.budget_year = ${year} AND ${reported}) THEN COALESCE(kpi_topic.status, 'pending') ELSE 'pending' END`;
}

// Yearly target is stored on every month row, so take MAX; monthly targets add up.
export function resultAggSub(budgetYear: number) {
  return db("kpi_result_mon")
    .join("kpi_topic as agg_topic", "kpi_result_mon.kpi_id", "agg_topic.id")
    .select("kpi_result_mon.kpi_id", "kpi_result_mon.budget_year")
    .select(db.raw(
      "CASE WHEN MAX(agg_topic.target_mode) = 'month' THEN SUM(kpi_result_mon.target) ELSE MAX(kpi_result_mon.target) END as target"
    ))
    .sum("kpi_result_mon.result as sum_result")
    .where("kpi_result_mon.budget_year", budgetYear)
    .groupBy("kpi_result_mon.kpi_id", "kpi_result_mon.budget_year")
    .as("agg");
}
