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
import { useEffect, useState } from "react";

interface DashboardData {
  totalTopics: number;
  totalResults: number;
  passCount: number;
  failCount: number;
  pendingCount: number;
  recentResults: ResultRow[];
}

interface ResultRow {
  id: number;
  kpi_id: number;
  kpi_name: string;
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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
          <p className="eyebrow">ภาพรวม</p>
          <div className="flex items-center gap-3">
            <span className="icon-badge">
              <LayoutDashboardIcon />
            </span>
            <h2 className="page-title">แดชบอร์ด</h2>
          </div>
          <p className="page-subtitle">ติดตามความคืบหน้า KPI จำนวนผลรายงาน และกิจกรรมล่าสุด</p>
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
              <th>KPI</th>
              <th>เป้าหมาย</th>
              <th>ผลลัพธ์</th>
              <th>%</th>
              <th>สถานะ</th>
              <th>วันที่</th>
            </tr>
          </thead>
          <tbody>
            {data.recentResults.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={6} className="empty-cell">ยังไม่มีผลรายงาน</td>
              </tr>
            ) : (
              data.recentResults.map((r) => (
                <tr key={r.id}>
                  <td data-label="KPI" className="font-semibold text-[#17211d]">{r.kpi_name}</td>
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
                  <td data-label="วันที่" className="text-[#64746d]">{r.report_date || "-"}</td>
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
