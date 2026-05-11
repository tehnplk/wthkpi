"use client";

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
    return <div className="loading-state">Loading dashboard...</div>;
  }

  if (!data) {
    return <div className="alert">Failed to load dashboard data.</div>;
  }

  return (
    <div>
      <header className="page-heading">
        <div>
          <p className="eyebrow">Overview</p>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">Monitor KPI progress, result volume, and recent reporting activity.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="metric-card">
          <p className="metric-label">KPI Topics</p>
          <p className="metric-value">{data.totalTopics}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Total Results</p>
          <p className="metric-value">{data.totalResults}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Pass / Fail</p>
          <p className="metric-value">
            <span className="text-[#14764a]">{data.passCount}</span>
            <span className="text-[#9aa8a2] mx-1">/</span>
            <span className="text-[#c24141]">{data.failCount}</span>
          </p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Pending</p>
          <p className="metric-value text-[#9a6a12]">{data.pendingCount}</p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-pad border-b border-[#dfe8e3]">
          <h3 className="section-title mb-0">Recent Results</h3>
        </div>
        <div className="data-table-wrap">
        <table className="data-table text-sm">
          <thead>
            <tr>
              <th>KPI</th>
              <th>Target</th>
              <th>Result</th>
              <th>%</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {data.recentResults.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-cell">No results yet</td>
              </tr>
            ) : (
              data.recentResults.map((r) => (
                <tr key={r.id}>
                  <td className="font-semibold text-[#17211d]">{r.kpi_name}</td>
                  <td>{r.target ?? "-"}</td>
                  <td>{r.result ?? "-"}</td>
                  <td>{r.percent ? `${r.percent}%` : "-"}</td>
                  <td>
                    <span className={`pill ${statusColors[r.status] || "pill-muted"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="text-[#64746d]">{r.report_date || "-"}</td>
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
