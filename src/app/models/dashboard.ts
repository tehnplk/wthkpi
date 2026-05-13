import type { KpiType } from "./common";

export interface DashboardData {
  totalTopics: number;
  totalResults: number;
  passCount: number;
  failCount: number;
  pendingCount: number;
  kpiTypeSummary: KpiTypeSummary[];
  recentResults: DashboardResultRow[];
}

export interface KpiTypeSummary extends KpiType {
  totalTopics: number;
  totalResults: number;
  passCount: number;
  failCount: number;
  pendingCount: number;
}

export interface DashboardResultRow {
  id: number;
  kpi_id: number;
  kpi_name: string;
  kpi_type_id: number | null;
  kpi_type: string | null;
  kpi_number: string | null;
  target: number | null;
  result: number | null;
  percent: number | null;
  status: string;
  note: string | null;
  report_date: string | null;
}

export interface KpiTypeSummaryRow {
  id: number;
  type: string;
  total_topics: number;
  total_results: number;
  pass_count: number;
  fail_count: number;
  pending_count: number;
}
