"use client";

import {
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Filter,
  Plus,
  Trash2,
  TriangleAlert,
} from "lucide-react";
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

const statusLabels: Record<string, string> = {
  pass: "ผ่าน",
  fail: "ไม่ผ่าน",
  pending: "รอดำเนินการ",
};

const statusIcons = {
  pass: CheckCircle2,
  fail: TriangleAlert,
  pending: Clock3,
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
      setError(data.error || "สร้างข้อมูลไม่สำเร็จ");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("ลบผลรายงานนี้หรือไม่?")) return;
    const res = await fetch(`/api/kpi-results/${id}`, { method: "DELETE" });
    if (res.ok) loadResults();
  };

  if (loading) {
    return <div className="loading-state">กำลังโหลดผล KPI...</div>;
  }

  return (
    <div>
      <header className="page-heading">
        <div>
          <p className="eyebrow">รายงานผล</p>
          <div className="flex items-center gap-3">
            <span className="icon-badge">
              <ClipboardCheck size={18} aria-hidden="true" />
            </span>
            <h2 className="page-title">ผล KPI</h2>
          </div>
          <p className="page-subtitle">บันทึกเป้าหมาย ผลลัพธ์ วันที่รายงาน และสถานะของ KPI</p>
        </div>
      </header>

      {error && (
        <div className="alert">{error}</div>
      )}

      <div className="form-panel mb-6">
        <h3 className="section-title flex items-center gap-2">
          <Plus size={17} aria-hidden="true" />
          เพิ่มผลรายงาน
        </h3>
        <form onSubmit={handleCreate} className="space-y-3 max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#64746d] font-semibold mb-1">หัวข้อ KPI</label>
              <select value={kpiId} onChange={(e) => setKpiId(e.target.value)} required>
                <option value="">เลือกหัวข้อ KPI...</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#64746d] font-semibold mb-1">วันที่รายงาน</label>
              <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-[#64746d] font-semibold mb-1">เป้าหมาย</label>
              <input type="number" step="0.01" placeholder="ค่าเป้าหมาย" value={target} onChange={(e) => setTarget(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-[#64746d] font-semibold mb-1">ผลลัพธ์</label>
              <input type="number" step="0.01" placeholder="ผลลัพธ์จริง" value={resultVal} onChange={(e) => setResultVal(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-[#64746d] font-semibold mb-1">สถานะ</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="pending">รอดำเนินการ</option>
                <option value="pass">ผ่าน</option>
                <option value="fail">ไม่ผ่าน</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#64746d] font-semibold mb-1">หมายเหตุ</label>
              <input type="text" placeholder="หมายเหตุเพิ่มเติม" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-primary"
          >
            <Plus size={16} aria-hidden="true" />
            เพิ่มผลรายงาน
          </button>
        </form>
      </div>

      <div className="filter-bar flex flex-col sm:flex-row gap-3 mb-4">
        <div className="hidden sm:flex items-center text-[#64746d]">
          <Filter size={18} aria-hidden="true" />
        </div>
        <select value={filterKpiId} onChange={(e) => setFilterKpiId(e.target.value)} className="max-w-xs">
          <option value="">KPI ทั้งหมด</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="max-w-[140px]">
          <option value="">ทุกสถานะ</option>
          <option value="pass">ผ่าน</option>
          <option value="fail">ไม่ผ่าน</option>
          <option value="pending">รอดำเนินการ</option>
        </select>
      </div>

      <div className="panel data-table-wrap">
        <table className="data-table text-sm">
          <thead>
            <tr>
              <th>KPI</th>
              <th>เป้าหมาย</th>
              <th>ผลลัพธ์</th>
              <th>%</th>
              <th>สถานะ</th>
              <th>หมายเหตุ</th>
              <th>วันที่</th>
              <th className="w-24">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {results.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={8} className="empty-cell">ไม่พบผลรายงาน</td>
              </tr>
            ) : (
              results.map((r) => (
                <tr key={r.id}>
                  <td data-label="KPI" className="font-semibold text-[#17211d]">{r.kpi_name}</td>
                  <td data-label="เป้าหมาย">{r.target ?? "-"}</td>
                  <td data-label="ผลลัพธ์">{r.result ?? "-"}</td>
                  <td data-label="%">{r.percent != null ? `${r.percent}%` : "-"}</td>
                  <td data-label="สถานะ">
                    <span className={`pill ${statusColors[r.status] || "pill-muted"}`}>
                      {(() => {
                        const StatusIcon = statusIcons[r.status as keyof typeof statusIcons] || Clock3;
                        return <StatusIcon size={13} aria-hidden="true" />;
                      })()}
                      {statusLabels[r.status] || r.status}
                    </span>
                  </td>
                  <td data-label="หมายเหตุ" className="max-w-[220px] truncate text-[#64746d]">{r.note || "-"}</td>
                  <td data-label="วันที่" className="text-[#64746d] whitespace-nowrap">{r.report_date || "-"}</td>
                  <td data-label="จัดการ">
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="btn btn-danger min-h-8 px-3 py-1 text-xs"
                    >
                      <Trash2 size={13} aria-hidden="true" />
                      ลบ
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
