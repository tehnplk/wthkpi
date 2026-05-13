export interface KpiResultTopic {
  id: number;
  name: string;
  kpi_type_id: number | null;
  kpi_type: string | null;
  rate_cal_value: number | null;
}

export interface KpiResultRow {
  id: number | null;
  kpi_id: number;
  kpi_name: string;
  kpi_type_id: number | null;
  kpi_type: string | null;
  kpi_number: string | null;
  topic_note: string | null;
  target: number | null;
  result: number | null;
  percent: number | null;
  status: string | null;
  note: string | null;
  report_date: string | null;
}
