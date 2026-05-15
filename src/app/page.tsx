"use client";

import {
  Activity,
  BarChart3,
  CircleCheck,
  Clock3,
  FileClock,
  ListChecks,
  Target,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Department } from "@/app/models/common";
import type { DashboardData } from "@/app/models/dashboard";
import { applySort, SortDir, toggleSort } from "@/lib/sort";

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

const metricTypeCardClass = (kpiTypeId: number) => `metric-card metric-card-type metric-card-type-${kpiTypeId % 6}`;

const rateBadgeClass = (status: string) => {
  if (status === "pass") return "number-badge-rate-pass";
  if (status === "fail") return "number-badge-rate-fail";
  return "number-badge-rate-pending";
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
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filterDepartmentId, setFilterDepartmentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string | null>("kpi_id");
  const [sortDir, setSortDir] = useState<SortDir | null>("asc");

  useEffect(() => {
    fetch("/api/departments")
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json)) setDepartments(json);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterDepartmentId) params.set("department_id", filterDepartmentId);
    const query = params.toString();

    fetch(`/api/dashboard${query ? `?${query}` : ""}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filterDepartmentId]);

  const handleSort = (col: string) => {
    const next = toggleSort(sortDir, col, sortBy);
    setSortBy(next.sortBy);
    setSortDir(next.sortDir);
  };

  const sortedRecent = useMemo(
    () => applySort(data?.recentResults ?? [], sortBy, sortDir),
    [data?.recentResults, sortBy, sortDir]
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

      <div className="filter-bar mb-6">
        <select
          value={filterDepartmentId}
          onChange={(event) => setFilterDepartmentId(event.target.value)}
          className="max-w-[220px]"
        >
          <option value="">ทุกแผนก/ฝ่าย/กลุ่มงาน</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>{dept.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="metric-card metric-card-topics">
          <div className="metric-head">
            <p className="metric-label">ตัวชี้วัด</p>
            <Target size={18} aria-hidden="true" />
          </div>
          <p className="metric-value">{data.totalTopics}</p>
        </div>
        <div className="metric-card metric-card-results">
          <div className="metric-head">
            <p className="metric-label">รายงานผลแล้ว</p>
            <FileClock size={18} aria-hidden="true" />
          </div>
          <p className="metric-value">{data.totalResults}</p>
        </div>
        <div className="metric-card metric-card-pending">
          <div className="metric-head">
            <p className="metric-label">รอดำเนินการ</p>
            <Clock3 size={18} aria-hidden="true" />
          </div>
          <p className="metric-value text-[#9a6a12]">{data.pendingCount}</p>
        </div>
        <div className="metric-card metric-card-status">
          <div className="metric-head">
            <p className="metric-label">ผ่าน / ไม่ผ่าน</p>
            <ListChecks size={18} aria-hidden="true" />
          </div>
          <p className="metric-value">
            <span className="text-[#14764a]">{data.passCount}</span>
            <span className="text-[#9aa8a2] mx-1">/</span>
            <span className="text-[#c24141]">{data.failCount}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        {(data.kpiTypeSummary || []).map((summary) => (
          <div
            key={summary.id}
            className={`${metricTypeCardClass(summary.id)} ${
              summary.type === "คุณภาพ" ? "metric-card-type-quality" : ""
            } ${summary.type === "ยุทธศาสตร์" ? "metric-card-type-strategy" : ""
            }`}
          >
            <div className="metric-head">
              <p className="metric-label">{summary.type}</p>
              <Target size={18} aria-hidden="true" />
            </div>
            <div className="flex items-end justify-between gap-3 mt-3">
              <div>
                <p className="metric-value">{summary.totalTopics}</p>
                <p className="text-xs text-[#64746d] mt-1">ตัวชี้วัด</p>
              </div>
              <div className="min-w-24 space-y-1">
                <div className="flex items-center justify-between gap-3 rounded border border-[#22a35f] bg-[#d9f5e4] px-2 py-1 text-xs font-bold text-[#0b6f3c]">
                  <span>ผ่าน</span>
                  <span>{summary.passCount}</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded border border-[#e05252] bg-[#ffe0df] px-2 py-1 text-xs font-bold text-[#b42323]">
                  <span>ไม่ผ่าน</span>
                  <span>{summary.failCount}</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded border border-[#d39a12] bg-[#fff0b3] px-2 py-1 text-xs font-bold text-[#8a5700]">
                  <span>รอ</span>
                  <span>{summary.pendingCount}</span>
                </div>
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
              <th className="sortable-th w-12" onClick={() => handleSort("kpi_number")}>#</th>
              <th className="sortable-th" onClick={() => handleSort("kpi_name")}>KPI</th>
              <th className="sortable-th" onClick={() => handleSort("target")}>จำนวนกลุ่มเป้าหมาย</th>
              <th className="sortable-th" onClick={() => handleSort("result")}>ผลงาน</th>
              <th className="sortable-th" onClick={() => handleSort("percent")}>อัตรา</th>
              <th className="sortable-th" onClick={() => handleSort("status")}>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {sortedRecent.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={6} className="empty-cell">ยังไม่มีผลรายงาน</td>
              </tr>
            ) : (
              sortedRecent.map((r) => (
                <tr key={r.kpi_id}>
                  <td data-label="#" className="w-12">
                    {r.kpi_number ? <span className="number-badge kpi-number-badge">{r.kpi_number}</span> : "-"}
                  </td>
                  <td data-label="KPI" className="font-semibold text-[#17211d]">
                    {r.kpi_name}
                    <div className="mt-1">
                      <span className={`pill pill-kpi-type-badge ${kpiTypeBadgeClass(r.kpi_type_id)}`}>{r.kpi_type || "-"}</span>
                    </div>
                  </td>
                  <td data-label="จำนวนกลุ่มเป้าหมาย">
                    {r.target != null ? <span className="number-badge">{r.target}</span> : "-"}
                  </td>
                  <td data-label="ผลงาน">
                    {r.result != null ? <span className="number-badge">{r.result}</span> : "-"}
                  </td>
                  <td data-label="อัตรา">
                    {r.percent != null ? (
                      <span className={`number-badge number-badge-rate ${rateBadgeClass(r.status)}`}>
                        {r.percent}
                      </span>
                    ) : "-"}
                  </td>
                  <td data-label="สถานะ">
                    <span className={`pill ${statusColors[r.status] || "pill-muted"}`}>
                      {(() => {
                        const StatusIcon = statusIcons[r.status as keyof typeof statusIcons] || BarChart3;
                        return <StatusIcon size={13} aria-hidden="true" />;
                      })()}
                      {statusLabels[r.status] || r.status}
                    </span>
                  </td>
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
