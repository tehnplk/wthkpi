"use client";

import {
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { confirmAction, notifyError, notifySuccess } from "@/lib/notice";

interface Topic {
  id: number;
  name: string;
  kpi_type_id: number | null;
  kpi_type: string | null;
}

interface KpiType {
  id: number;
  type: string;
}

interface Result {
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

const kpiTypeBadgeClass = (type: string | null) => {
  if (type === "ยุทธศาสตร์") return "pill-kpi-type-strategy";
  if (type === "คุณภาพ") return "pill-kpi-type-quality";
  return "pill-kpi-type";
};

function toDateInput(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

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

export default function KpiResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [kpiTypes, setKpiTypes] = useState<KpiType[]>([]);
  const [loading, setLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const [error, setError] = useState("");

  const [kpiId, setKpiId] = useState("");
  const [target, setTarget] = useState("");
  const [resultVal, setResultVal] = useState("");
  const [status, setStatus] = useState("pending");
  const [note, setNote] = useState("");
  const [reportDate, setReportDate] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [filterKpiTypeId, setFilterKpiTypeId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTopic, setFilterTopic] = useState("");

  const loadResults = () => {
    const params = new URLSearchParams();
    if (filterKpiTypeId) params.set("kpi_type_id", filterKpiTypeId);
    if (filterStatus) params.set("status", filterStatus);
    if (filterTopic.trim()) params.set("topic", filterTopic.trim());
    fetch(`/api/kpi-results?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setResults(data);
      })
      .catch(() => setResults([]));
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
    fetch("/api/kpi-types")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setKpiTypes(data);
      });
    fetch("/api/auth/me")
      .then((res) => {
        setCanManage(res.ok);
      })
      .catch(() => setCanManage(false));
  }, []);

  useEffect(() => {
    if (!loading) loadResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKpiTypeId, filterStatus, filterTopic]);

  const resetForm = () => {
    setKpiId("");
    setTarget("");
    setResultVal("");
    setStatus("pending");
    setNote("");
    setReportDate("");
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    resetForm();
  };

  const openCreateForTopic = (topicId: number) => {
    setEditingId(null);
    resetForm();
    setKpiId(String(topicId));
    setError("");
    setIsFormOpen(true);
  };

  const startEdit = (result: Result & { id: number }) => {
    setEditingId(result.id);
    setKpiId(String(result.kpi_id));
    setTarget(result.target == null ? "" : String(result.target));
    setResultVal(result.result == null ? "" : String(result.result));
    setStatus(result.status || "pending");
    setNote(result.note || "");
    setReportDate(toDateInput(result.report_date));
    setError("");
    setIsFormOpen(true);
  };

  const buildPayload = () => ({
    kpi_id: Number(kpiId),
    target: target ? Number(target) : null,
    result: resultVal ? Number(resultVal) : null,
    percent: target && resultVal ? ((Number(resultVal) / Number(target)) * 100).toFixed(2) : null,
    status,
    note: note || null,
    report_date: reportDate || null,
  });

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!kpiId) return;
    setError("");

    const res = await fetch(editingId ? `/api/kpi-results/${editingId}` : "/api/kpi-results", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload()),
    });

    if (res.ok) {
      closeForm();
      loadResults();
      notifySuccess(editingId ? "บันทึกผลงาน สำเร็จ" : "เพิ่มผลงาน สำเร็จ");
    } else {
      const data = await res.json();
      const message = data.error || "บันทึกข้อมูลไม่สำเร็จ";
      setError(message);
      notifyError(message);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmAction("ลบผลงานนี้หรือไม่?");
    if (!confirmed) return;

    const res = await fetch(`/api/kpi-results/${id}`, { method: "DELETE" });
    if (res.ok) {
      loadResults();
      notifySuccess("ลบผลงาน สำเร็จ");
    } else {
      const data = await res.json();
      notifyError(data.error || "ลบข้อมูลไม่สำเร็จ");
    }
  };

  if (loading) {
    return <div className="loading-state">กำลังโหลดผลงาน...</div>;
  }

  const topicName = topics.find((t) => t.id === Number(kpiId))?.name || "";

  return (
    <div>
      <header className="page-heading">
        <div>
          <div className="flex items-center gap-3">
            <span className="icon-badge">
              <ClipboardCheck size={18} aria-hidden="true" />
            </span>
            <h2 className="page-title">ผลงานตัวชี้วัด</h2>
          </div>
          <p className="page-subtitle">บันทึกเป้าหมาย ผลงาน วันที่รายงาน และสถานะ</p>
        </div>
      </header>

      {error && <div className="alert">{error}</div>}


      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        size="lg"
        title={topicName}
      >
        <form onSubmit={handleSave} className="login-form">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="form-group">
              <label htmlFor="result-date">วันที่รายงาน</label>
              <input id="result-date" type="date" value={reportDate} onChange={(event) => setReportDate(event.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="result-target">เป้าหมาย</label>
              <input id="result-target" type="number" step="0.01" value={target} onChange={(event) => setTarget(event.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="result-value">ผลงาน</label>
              <input id="result-value" type="number" step="0.01" value={resultVal} onChange={(event) => setResultVal(event.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="result-status">สถานะ</label>
              <select id="result-status" value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="pending">รอดำเนินการ</option>
                <option value="pass">ผ่าน</option>
                <option value="fail">ไม่ผ่าน</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="result-note">หมายเหตุ</label>
              <input id="result-note" type="text" value={note} onChange={(event) => setNote(event.target.value)} />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-soft" onClick={closeForm}>
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} aria-hidden="true" />
              บันทึก
            </button>
          </div>
        </form>
      </Modal>

      <div className="filter-bar result-filter-bar">
        <div className="filter-icon hidden sm:flex items-center text-[#64746d]">
          <Search size={18} aria-hidden="true" />
        </div>
        <label className="filter-search">
          <input
            type="search"
            value={filterTopic}
            onChange={(event) => setFilterTopic(event.target.value)}
            placeholder="พิมพ์ชื่อหัวข้อ KPI..."
          />
        </label>
        <select value={filterKpiTypeId} onChange={(event) => setFilterKpiTypeId(event.target.value)} className="max-w-[160px]">
          <option value="">ทุกประเภท</option>
          {kpiTypes.map((type) => (
            <option key={type.id} value={type.id}>{type.type}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)} className="max-w-[140px]">
          <option value="">ทุกสถานะ</option>
          <option value="pass">ผ่าน</option>
          <option value="fail">ไม่ผ่าน</option>
          <option value="pending">รอดำเนินการ</option>
        </select>
      </div>

      <div className="panel data-table-wrap">
        <table className="data-table kpi-results-table text-sm">
          <thead>
            <tr>
              <th className="w-12">#</th>
              <th>ตัวชี้วัด</th>
              <th>เป้าหมาย</th>
              <th>ผลงาน</th>
              <th>%</th>
              <th>สถานะ</th>
              <th>วันที่</th>
              {canManage && <th className="w-36">จัดการ</th>}
            </tr>
          </thead>
          <tbody>
            {results.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={canManage ? 8 : 7} className="empty-cell">ไม่พบผลงาน</td>
              </tr>
            ) : (
              results.map((result) => {
                const resultStatus = result.status || "pending";
                const StatusIcon = statusIcons[resultStatus as keyof typeof statusIcons] || Clock3;

                return (
                  <tr key={`topic-${result.kpi_id}`}>
                    <td data-label="#" className="result-number-cell text-[#64746d] w-12">{result.kpi_number || "-"}</td>
                    <td data-label="ตัวชี้วัด" className="result-topic-cell font-semibold text-[#17211d]">
                      {result.kpi_name}
                      <div className="mt-1">
                        <span className={`pill pill-kpi-type-badge ${kpiTypeBadgeClass(result.kpi_type)}`}>{result.kpi_type || "-"}</span>
                      </div>
                      {result.topic_note && (
                        <div className="result-topic-note text-xs font-normal text-gray-500 mt-0.5">{result.topic_note}</div>
                      )}
                    </td>
                    <td data-label="เป้าหมาย" className="result-value-cell">{result.target ?? "-"}</td>
                    <td data-label="ผลงาน" className="result-value-cell">{result.result ?? "-"}</td>
                    <td data-label="%" className="result-value-cell">{result.percent != null ? `${result.percent}%` : "-"}</td>
                    <td data-label="สถานะ" className="result-status-cell">
                      <span className={`pill ${statusColors[resultStatus] || "pill-muted"}`}>
                        <StatusIcon size={13} aria-hidden="true" />
                        {statusLabels[resultStatus] || resultStatus}
                      </span>
                    </td>
                    <td data-label="วันที่" className="result-date-cell text-[#64746d] whitespace-nowrap">{formatThaiShortDate(result.report_date)}</td>
                    {canManage && (
                      <td data-label="จัดการ" className="result-action-cell">
                        {result.id != null ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(result as Result & { id: number })}
                              className="btn btn-soft min-h-8 px-3 py-1 text-xs"
                            >
                              <Pencil size={13} aria-hidden="true" />
                              แก้ไข
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(result.id!)}
                              className="btn btn-danger min-h-8 px-3 py-1 text-xs"
                            >
                              <Trash2 size={13} aria-hidden="true" />
                              ลบ
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openCreateForTopic(result.kpi_id)}
                            className="btn btn-primary min-h-8 px-3 py-1 text-xs"
                          >
                            <Plus size={13} aria-hidden="true" />
                            เพิ่ม
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
