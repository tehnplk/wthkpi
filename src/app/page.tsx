"use client";

import {
  Activity,
  BarChart3,
  CircleCheck,
  Clock3,
  FileClock,
  Gauge,
  Target,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { applySort, SortDir, toggleSort } from "@/lib/sort";

interface DashboardData {
  totalTopics: number;
  totalResults: number;
  passCount: number;
  failCount: number;
  pendingCount: number;
  kpiTypeSummary: KpiTypeSummary[];
  recentResults: ResultRow[];
}

interface KpiTypeSummary {
  id: number;
  type: string;
  totalTopics: number;
  totalResults: number;
  passCount: number;
  failCount: number;
  pendingCount: number;
}

interface ResultRow {
  id: number;
  kpi_id: number;
  kpi_name: string;
  kpi_type_id: number | null;
  kpi_type: string | null;
  target: number | null;
  result: number | null;
  percent: number | null;
  status: string;
  note: string | null;
  report_date: string | null;
}

const statusColors: Record<string, string> = {
  pass: "pill-pass",
  fail: "pill-fail",
  pending: "pill-pending",
};

const statusLabels: Record<string, string> = {
  pass: "ผ่าน",
  fail: "ไม่ผ่าน",
  pending: "รอดำเนินการ",
};

const statusIcons = {
  pass: CircleCheck,
  fail: TriangleAlert,
  pending: Clock3,
};

const kpiTypeBadgeClass = (kpiTypeId: number | null) => {
  if (kpiTypeId == null) return "pill-kpi-type";
  return `pill-kpi-t${kpiTypeId % 6}`;
};

function formatThaiShortDate(value: string | null) {
  if (!value) return "-";

  const [yearText, monthText, dayText] = value.slice(0, 10).split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  }).format(date);
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSort = (col: string) => {
    const next = toggleSort(sortDir, col, sortBy);
    setSortBy(next.sortBy);
    setSortDir(next.sortDir);
  };

  const sortedRecent = useMemo(
    () => applySort(data?.recentResults ?? [], sortBy, sortDir),
    [data?.recentResults, sortBy, sortDir]
  );

  const SortField = ({ field }: { field: string }) => (
    <span className={`sort-icon${sortBy === field ? " active" : ""}`}>
      <span className="sort-icon-up" data-active={sortBy === field && sortDir === "asc" ? "true" : undefined}>&#9650;</span>
      <span className="sort-icon-down" data-active={sortBy === field && sortDir === "desc" ? "true" : undefined}>&#9660;</span>
    </span>
  );

  if (loading) {
    return <div className="loading-state">กำลังโหลดแดชบอร์ด...</div>;
  }

  if (!data) {
    return <div className="alert">โหลดข้อมูลแดชบอร์ดไม่สำเร็จ</div>;
  }

  return (
    <div>
      <header className="page-heading">
        <div>
          <div className="flex items-center gap-3">
            <span className="icon-badge">
              <LayoutDashboardIcon />
            </span>
            <h2 className="page-title">ผลการดำเนินงานตามตัวชี้วัด โรงพยาบาลวังทอง</h2>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="metric-card">
          <div className="metric-head">
            <p className="metric-label">หัวข้อ KPI</p>
            <Target size={18} aria-hidden="true" />
          </div>
          <p className="metric-value">{data.totalTopics}</p>
        </div>
        <div className="metric-card">
          <div className="metric-head">
            <p className="metric-label">ผลรายงานทั้งหมด</p>
            <FileClock size={18} aria-hidden="true" />
          </div>
          <p className="metric-value">{data.totalResults}</p>
        </div>
        <div className="metric-card">
          <div className="metric-head">
            <p className="metric-label">ผ่าน / ไม่ผ่าน</p>
            <Gauge size={18} aria-hidden="true" />
          </div>
          <p className="metric-value">
            <span className="text-[#14764a]">{data.passCount}</span>
            <span className="text-[#9aa8a2] mx-1">/</span>
            <span className="text-[#c24141]">{data.failCount}</span>
          </p>
        </div>
        <div className="metric-card">
          <div className="metric-head">
            <p className="metric-label">รอดำเนินการ</p>
            <Clock3 size={18} aria-hidden="true" />
          </div>
          <p className="metric-value text-[#9a6a12]">{data.pendingCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {data.kpiTypeSummary.map((summary) => (
          <div key={summary.id} className="metric-card">
            <div className="metric-head">
              <p className="metric-label">{summary.type}</p>
              <Target size={18} aria-hidden="true" />
            </div>
            <div className="flex items-end justify-between gap-3 mt-3">
              <div>
                <p className="metric-value">{summary.totalTopics}</p>
                <p className="text-xs text-[#64746d] mt-1">หัวข้อ KPI</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-[#17211d]">{summary.totalResults} ผลรายงาน</p>
                <p className="text-xs text-[#64746d] mt-1">
                  ผ่าน {summary.passCount} / ไม่ผ่าน {summary.failCount} / รอ {summary.pendingCount}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="panel-pad border-b border-[#dfe8e3]">
          <h3 className="section-title mb-0 flex items-center gap-2">
            <Activity size={17} aria-hidden="true" />
            ผลรายงานล่าสุด
          </h3>
        </div>
        <div className="data-table-wrap">
        <table className="data-table text-sm">
          <thead>
            <tr>
              <th className="sortable-th" onClick={() => handleSort("kpi_name")}>KPI<SortField field="kpi_name" /></th>
              <th className="sortable-th" onClick={() => handleSort("target")}>เป้าหมาย<SortField field="target" /></th>
              <th className="sortable-th" onClick={() => handleSort("result")}>ผลลัพธ์<SortField field="result" /></th>
              <th className="sortable-th" onClick={() => handleSort("percent")}>%<SortField field="percent" /></th>
              <th className="sortable-th" onClick={() => handleSort("status")}>สถานะ<SortField field="status" /></th>
              <th className="sortable-th" onClick={() => handleSort("report_date")}>วันที่<SortField field="report_date" /></th>
            </tr>
          </thead>
          <tbody>
            {sortedRecent.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={6} className="empty-cell">ยังไม่มีผลรายงาน</td>
              </tr>
            ) : (
              sortedRecent.map((r) => (
                <tr key={r.id}>
                  <td data-label="KPI" className="font-semibold text-[#17211d]">
                    {r.kpi_name}
                    <div className="mt-1">
                      <span className={`pill pill-kpi-type-badge ${kpiTypeBadgeClass(r.kpi_type_id)}`}>{r.kpi_type || "-"}</span>
                    </div>
                  </td>
                  <td data-label="เป้าหมาย">{r.target ?? "-"}</td>
                  <td data-label="ผลลัพธ์">{r.result ?? "-"}</td>
                  <td data-label="%">{r.percent ? `${r.percent}%` : "-"}</td>
                  <td data-label="สถานะ">
                    <span className={`pill ${statusColors[r.status] || "pill-muted"}`}>
                      {(() => {
                        const StatusIcon = statusIcons[r.status as keyof typeof statusIcons] || BarChart3;
                        return <StatusIcon size={13} aria-hidden="true" />;
                      })()}
                      {statusLabels[r.status] || r.status}
                    </span>
                  </td>
                  <td data-label="วันที่" className="text-[#64746d]">{formatThaiShortDate(r.report_date)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

function LayoutDashboardIcon() {
  return <BarChart3 size={18} aria-hidden="true" />;
}
