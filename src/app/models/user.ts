export interface User {
  id: number;
  provider_id: string;
  fullname: string;
  username: string | null;
  role: string;
  department_id: number | null;
  department_name: string | null;
  is_active: boolean;
  last_login: string | null;
}
