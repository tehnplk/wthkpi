export interface Department {
  id: number;
  name: string;
}

export interface KpiType {
  id: number;
  type: string;
}

export interface CountRow {
  count: number;
}

export interface StatusCountRow {
  status: string;
  count: number;
}
