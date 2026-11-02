import db from "@/lib/db";

// A topic with no monthly result (number or level) in the budget year is always pending.
export function statusExpr(budgetYear: number) {
  const year = Math.trunc(budgetYear) || 0;
  return `CASE WHEN EXISTS (SELECT 1 FROM kpi_result_mon sr WHERE sr.kpi_id = kpi_topic.id AND sr.budget_year = ${year} AND (sr.result IS NOT NULL OR sr.result_level IS NOT NULL)) THEN COALESCE(kpi_topic.status, 'pending') ELSE 'pending' END`;
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
