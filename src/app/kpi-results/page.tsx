"use client";

import { useEffect, useState } from "react";

interface Topic {
  id: number;
  name: string;
}

interface Result {
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

export default function KpiResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [kpiId, setKpiId] = useState("");
  const [target, setTarget] = useState("");
  const [resultVal, setResultVal] = useState("");
  const [status, setStatus] = useState("pending");
  const [note, setNote] = useState("");
  const [reportDate, setReportDate] = useState("");

  const [filterStatus, setFilterStatus] = useState("");
  const [filterKpiId, setFilterKpiId] = useState("");

  const loadResults = () => {
    const params = new URLSearchParams();
    if (filterKpiId) params.set("kpi_id", filterKpiId);
    if (filterStatus) params.set("status", filterStatus);
    fetch(`/api/kpi-results?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setResults(data);
      });
  };

  useEffect(() => {
    fetch("/api/kpi-results")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setResults(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    fetch("/api/kpi-topics")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTopics(data);
      });
  }, []);

  useEffect(() => {
    if (!loading) loadResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterKpiId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kpiId) return;
    setError("");
    const res = await fetch("/api/kpi-results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kpi_id: Number(kpiId),
        target: target ? Number(target) : null,
        result: resultVal ? Number(resultVal) : null,
        percent: target && resultVal ? ((Number(resultVal) / Number(target)) * 100).toFixed(2) : null,
        status,
        note: note || null,
        report_date: reportDate || null,
      }),
    });
    if (res.ok) {
      setKpiId("");
      setTarget("");
      setResultVal("");
      setStatus("pending");
      setNote("");
      setReportDate("");
      loadResults();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to create");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this result?")) return;
    const res = await fetch(`/api/kpi-results/${id}`, { method: "DELETE" });
    if (res.ok) loadResults();
  };

  if (loading) {
    return <div className="loading-state">Loading KPI results...</div>;
  }

  return (
    <div>
      <header className="page-heading">
        <div>
          <p className="eyebrow">Reporting</p>
          <h2 className="page-title">KPI Results</h2>
          <p className="page-subtitle">Record target achievement, report dates, and current KPI status.</p>
        </div>
      </header>

      {error && (
        <div className="alert">{error}</div>
      )}

      <div className="form-panel mb-6">
        <h3 className="section-title">Add Result</h3>
        <form onSubmit={handleCreate} className="space-y-3 max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#64746d] font-semibold mb-1">KPI Topic</label>
              <select value={kpiId} onChange={(e) => setKpiId(e.target.value)} required>
                <option value="">Select KPI topic...</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#64746d] font-semibold mb-1">Report Date</label>
              <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-[#64746d] font-semibold mb-1">Target</label>
              <input type="number" step="0.01" placeholder="Target value" value={target} onChange={(e) => setTarget(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-[#64746d] font-semibold mb-1">Result</label>
              <input type="number" step="0.01" placeholder="Actual result" value={resultVal} onChange={(e) => setResultVal(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-[#64746d] font-semibold mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="pending">Pending</option>
                <option value="pass">Pass</option>
                <option value="fail">Fail</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#64746d] font-semibold mb-1">Note</label>
              <input type="text" placeholder="Optional note" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-primary"
          >
            Add Result
          </button>
        </form>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <select value={filterKpiId} onChange={(e) => setFilterKpiId(e.target.value)} className="max-w-xs">
          <option value="">All KPIs</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="max-w-[140px]">
          <option value="">All status</option>
          <option value="pass">Pass</option>
          <option value="fail">Fail</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <div className="panel data-table-wrap">
        <table className="data-table text-sm">
          <thead>
            <tr>
              <th>KPI</th>
              <th>Target</th>
              <th>Result</th>
              <th>%</th>
              <th>Status</th>
              <th>Note</th>
              <th>Date</th>
              <th className="w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {results.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-cell">No results found</td>
              </tr>
            ) : (
              results.map((r) => (
                <tr key={r.id}>
                  <td className="font-semibold text-[#17211d]">{r.kpi_name}</td>
                  <td>{r.target ?? "-"}</td>
                  <td>{r.result ?? "-"}</td>
                  <td>{r.percent != null ? `${r.percent}%` : "-"}</td>
                  <td>
                    <span className={`pill ${statusColors[r.status] || "pill-muted"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="max-w-[220px] truncate text-[#64746d]">{r.note || "-"}</td>
                  <td className="text-[#64746d] whitespace-nowrap">{r.report_date || "-"}</td>
                  <td>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="btn btn-danger min-h-8 px-3 py-1 text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
