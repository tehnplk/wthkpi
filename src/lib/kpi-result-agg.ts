import db from "@/lib/db";

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
