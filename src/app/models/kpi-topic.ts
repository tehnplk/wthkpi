export interface KpiTopicDepartment {
  id: number;
  name: string;
  user_id: number | null;
  user_owner: string | null;
}

export interface KpiTopic {
  id: number;
  name: string;
  kpi_type_id: number | null;
  kpi_type: string | null;
  status: string;
  kpi_number: string | null;
  note: string | null;
  criteria: string | null;
  rate_cal_value: number | null;
  flag_parent_or_child: "parent" | "child" | null;
  parent_kpi: number | null;
  flag_reporting: "yes" | "no";
  flag_show_guest: "yes" | "no";
  departments: KpiTopicDepartment[];
}

export interface KpiTopicUser {
  id: number;
  fullname: string;
  username: string;
  department_id: number | null;
  department_name: string | null;
}
