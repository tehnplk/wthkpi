"use client";

import {
  CalendarPlus,
  CircleCheck,
  ClipboardCheck,
  Clock3,
  Save,
  Search,
  TriangleAlert,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/Modal";
import type { Department, KpiType } from "@/app/models/common";
import type { KpiTopic as Topic } from "@/app/models/kpi-topic";
import type { KpiResultRow as Result } from "@/app/models/kpi-result";
import { confirmAction, notifyError, notifySuccess } from "@/lib/notice";
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

const rateBadgeClass = (status: string | null) => {
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

function formatDecimal(value: string | number | null) {
  if (value === null || value === "") return "-";
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) return "-";
  return numberValue.toFixed(2);
}

const MONTHS = ["ต.ค.", "พ.ย.", "ธ.ค.", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย."];

interface CurrentUser {
  id: number;
  fullname: string;
  username: string | null;
  department_id: number | null;
  role: string;
}

function thaiBudgetYear(): number {
  const now = new Date();
  const y = now.getFullYear() + 543;
  return now.getMonth() >= 9 ? y + 1 : y;
}

export default function KpiResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [kpiTypes, setKpiTypes] = useState<KpiType[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [error, setError] = useState("");

  const [filterKpiTypeId, setFilterKpiTypeId] = useState("");
  const [filterDepartmentId, setFilterDepartmentId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTopic, setFilterTopic] = useState("");
  const [sortBy, setSortBy] = useState<string | null>("kpi_id");
  const [sortDir, setSortDir] = useState<SortDir | null>("asc");

  const [isMonFormOpen, setIsMonFormOpen] = useState(false);
  const [monKpiId, setMonKpiId] = useState<number>(0);
  const [monKpiName, setMonKpiName] = useState("");
  const [monKpiNumber, setMonKpiNumber] = useState("");
  const [monKpiCriteria, setMonKpiCriteria] = useState("");
  const [monKpiNote, setMonKpiNote] = useState("");
  const [monBudgetYear, setMonBudgetYear] = useState(thaiBudgetYear);
  const [monTarget, setMonTarget] = useState("");
  const [monRateCalValue, setMonRateCalValue] = useState("");
  const [monValues, setMonValues] = useState<(string)[]>(Array(12).fill(""));
  const [monLoading, setMonLoading] = useState(false);
  const [monError, setMonError] = useState("");
  const [editCell, setEditCell] = useState<number | null>(null);
  const [monTopicStatus, setMonTopicStatus] = useState("pending");

  const loadResults = () => {
    const params = new URLSearchParams();
    params.set("budget_year", String(monBudgetYear));
    if (filterKpiTypeId) params.set("kpi_type_id", filterKpiTypeId);
    if (filterDepartmentId) params.set("department_id", filterDepartmentId);
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
    const params = new URLSearchParams();
    params.set("budget_year", String(thaiBudgetYear()));
    fetch(`/api/kpi-results?${params}`)
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
    fetch("/api/departments")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setDepartments(data);
      });
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setCurrentUser(data);
      })
      .catch(() => setCurrentUser(null));
  }, []);

  useEffect(() => {
    if (!loading) loadResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKpiTypeId, filterDepartmentId, filterStatus, filterTopic, monBudgetYear]);

  const departmentLabelByKpiId = useMemo(() => {
    const labels: Record<number, string[]> = {};
    for (const topic of topics) {
      labels[topic.id] = (topic.departments || []).map((dept) => dept.name);
    }
    return labels;
  }, [topics]);

  const departmentLabels = (kpiId: number) => {
    return departmentLabelByKpiId[kpiId] || [];
  };

  const canEditKpi = (kpiId: number) => {
    if (!currentUser) return false;
    if (currentUser.role === "admin") return true;
    if (!currentUser.department_id) return false;

    const topic = topics.find((item) => item.id === kpiId);
    return Boolean(topic?.departments?.some((dept) => dept.id === currentUser.department_id));
  };

  const openMonForm = async (kpiId: number, kpiName: string, kpiNumber: string | null) => {
    if (!canEditKpi(kpiId)) {
      notifyError("แก้ไขได้เฉพาะ KPI ที่แผนกของคุณรับผิดชอบ");
      return;
    }

    setMonKpiId(kpiId);
    setMonKpiName(kpiName);
    setMonKpiNumber(kpiNumber || "");
    const topic = topics.find((item) => item.id === kpiId);
    setMonKpiCriteria(topic?.criteria || "");
    setMonKpiNote(topic?.note || "");
    setMonError("");
    setMonLoading(true);
    setMonTopicStatus("pending");
    setIsMonFormOpen(true);

    try {
      const [resMon, resTopic] = await Promise.all([
        fetch(`/api/kpi-result-mon?kpi_id=${kpiId}&budget_year=${monBudgetYear}`),
        fetch(`/api/kpi-topics/${kpiId}`),
      ]);
      const rows = await resMon.json();
      const topicData = resTopic.ok ? await resTopic.json() : null;
      const vals = Array(12).fill("");
      let tg = "";
      if (Array.isArray(rows)) {
        for (const r of rows) {
          const idx = r.mon - 1;
          if (idx >= 0 && idx < 12) {
            vals[idx] = r.result != null ? String(r.result) : "";
            if (!tg && r.target != null) tg = String(r.target);
          }
        }
      }
      setMonValues(vals);
      setMonTarget(tg);
      setMonRateCalValue(topicData?.rate_cal_value != null ? String(topicData.rate_cal_value) : "");
      setMonKpiCriteria(topicData?.criteria || "");
      setMonKpiNote(topicData?.note || "");
      if (topicData?.status) setMonTopicStatus(topicData.status);
    } catch { /* ignore */ }
    setMonLoading(false);
  };

  const closeMonForm = () => {
    setIsMonFormOpen(false);
    setMonKpiId(0);
    setMonKpiName("");
    setMonKpiNumber("");
    setMonKpiCriteria("");
    setMonKpiNote("");
    setMonTarget("");
    setMonRateCalValue("");
    setMonValues(Array(12).fill(""));
    setMonError("");
    setEditCell(null);
  };

  const clearMonResults = async () => {
    const confirmed = await confirmAction(
      "ล้างผลงานรายเดือนหรือไม่?",
      "ระบบจะล้างเฉพาะผลงานรายเดือน กดบันทึกเพื่อยืนยันการเปลี่ยนแปลง",
      "ยืนยัน"
    );
    if (!confirmed) return;

    setMonValues(Array(12).fill(""));
    setMonTopicStatus("pending");
    setEditCell(null);
    notifySuccess("ล้างผลงานแล้ว");
  };

  const monSum = monValues.reduce((acc, v) => acc + (Number(v) || 0), 0);
  const monRate = monTarget && Number(monTarget) && monRateCalValue ? ((monSum / Number(monTarget)) * Number(monRateCalValue)).toFixed(2) : null;

  const handleMonSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setMonError("");
    const months = monValues.map((v, i) => ({
      mon: i + 1,
      target: monTarget ? Number(monTarget) : null,
      result: v ? Number(v) : null,
    }));

    try {
      const [resMon, resTopic] = await Promise.all([
        fetch("/api/kpi-result-mon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kpi_id: monKpiId, budget_year: monBudgetYear, months }),
        }),
        fetch(`/api/kpi-topics/${monKpiId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: monTopicStatus,
            rate_cal_value: monRateCalValue ? Number(monRateCalValue) : null,
          }),
        }),
      ]);
      if (!resMon.ok) {
        const data = await resMon.json();
        setMonError(data.error || "บันทึกไม่สำเร็จ");
        return;
      }

      if (!resTopic.ok) {
        const data = await resTopic.json();
        setMonError(data.error || "บันทึกตัวคิดอัตราไม่สำเร็จ");
        return;
      }

      closeMonForm();
      loadResults();
      notifySuccess("บันทึกผลรายเดือนสำเร็จ");
    } catch {
      setMonError("เกิดข้อผิดพลาด");
    }
  };

  const handleSort = (col: string) => {
    const next = toggleSort(sortDir, col, sortBy);
    setSortBy(next.sortBy);
    setSortDir(next.sortDir);
  };

  const sortedResults = useMemo(
    () => applySort(results, sortBy, sortDir),
    [results, sortBy, sortDir]
  );
  const showManageColumn = sortedResults.some((row) => canEditKpi(row.kpi_id));
  const activeFilterCount = [
    filterTopic.trim(),
    filterKpiTypeId,
    filterDepartmentId,
    filterStatus,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilterTopic("");
    setFilterKpiTypeId("");
    setFilterDepartmentId("");
    setFilterStatus("");
  };

  if (loading) {
    return <div className="loading-state">กำลังโหลดผลงาน...</div>;
  }

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
        </div>
      </header>

      {error && <div className="alert">{error}</div>}

      <Modal
        isOpen={isMonFormOpen}
        onClose={closeMonForm}
        size="xl"
        title={`ตัวชี้วัดที่ ${monKpiNumber || "-"} - ${monKpiName}`}
        subtitle={
          monKpiCriteria || monKpiNote ? (
            <div className="space-y-0.5">
              {monKpiCriteria && <div>เกณฑ์การวัดผล : {monKpiCriteria}</div>}
              {monKpiNote && <div className="text-xs font-normal text-[var(--muted)] opacity-75">หมายเหตุ : {monKpiNote}</div>}
            </div>
          ) : undefined
        }
      >
        {monLoading ? (
          <div className="loading-state">กำลังโหลดข้อมูลรายเดือน...</div>
        ) : (
          <form onSubmit={handleMonSave} className="login-form">
            {monError && <div className="alert">{monError}</div>}
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="form-group mb-0">
                  <label htmlFor="mon-budget-year">ปีงบประมาณ</label>
                  <input
                    id="mon-budget-year"
                    type="number"
                    autoComplete="off"
                    value={monBudgetYear}
                    onChange={(e) => setMonBudgetYear(Number(e.target.value))}
                    className="w-32"
                  />
                </div>
                <div className="form-group mb-0">
                  <label htmlFor="mon-rate-cal-value">การคำนวณอัตรา</label>
                  <div className="rate-formula-control">
                    <span className="rate-formula-text">(ผลงาน/เป้าหมาย) x</span>
                    <input
                      id="mon-rate-cal-value"
                      type="number"
                      step="0.01"
                      autoComplete="off"
                      value={monRateCalValue}
                      onChange={(e) => setMonRateCalValue(e.target.value)}
                      className="rate-formula-input"
                      aria-label="ตัวเลขสำหรับคำนวณอัตรา"
                    />
                  </div>
                </div>
              </div>
              <div className="toggle-group">
                {[
                  { key: "pending", label: "รอดำเนินการ" },
                  { key: "fail", label: "ไม่ผ่าน" },
                  { key: "pass", label: "ผ่าน" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMonTopicStatus(key)}
                    className={`toggle-btn ${monTopicStatus === key ? `toggle-active toggle-${key}` : ""}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="data-table-wrap">
              <table className="data-table text-sm">
                <thead>
                  <tr>
                    <th className="w-20 kpi-mon-header-center" rowSpan={2}>
                      จำนวน
                      <br />
                      เป้าหมาย
                    </th>
                    <th colSpan={MONTHS.length} className="kpi-mon-header-center">ผลงาน</th>
                    <th className="w-24 kpi-mon-header-center" rowSpan={2}>รวม</th>
                    <th className="w-20 kpi-mon-header-center" rowSpan={2}>อัตรา</th>
                  </tr>
                  <tr>
                    {MONTHS.map((m) => (
                      <th key={m} className="w-16 kpi-mon-header-center">{m}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      data-label="เป้าหมาย"
                      className="text-center cursor-pointer hover:bg-[#f0f6f2] min-w-[80px]"
                      onClick={() => setEditCell(-1)}
                    >
                      {editCell === -1 ? (
                        <input
                          type="number"
                          step="0.01"
                          autoComplete="off"
                          value={monTarget}
                          autoFocus
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => setMonTarget(e.target.value)}
                          onBlur={() => setEditCell(null)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") setEditCell(null);
                            if (e.key === "Escape") setEditCell(null);
                          }}
                          className="w-full text-center px-0.5 py-1 border border-[#71c99a] rounded outline-none"
                          style={{ minWidth: "96px", fontSize: "10px" }}
                        />
                      ) : (
                        formatDecimal(monTarget)
                      )}
                    </td>
                    {monValues.map((v, i) => (
                      <td
                        key={i}
                        data-label={MONTHS[i]}
                        className="text-center cursor-pointer hover:bg-[#f0f6f2] min-w-[80px]"
                        onClick={() => setEditCell(i)}
                      >
                        {editCell === i ? (
                          <input
                            type="number"
                            step="0.01"
                            autoComplete="off"
                            value={v}
                            autoFocus
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const next = [...monValues];
                              next[i] = e.target.value;
                              setMonValues(next);
                            }}
                            onBlur={() => setEditCell(null)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") setEditCell(null);
                              if (e.key === "Escape") setEditCell(null);
                            }}
                            className="w-full text-center px-0.5 py-1 border border-[#71c99a] rounded outline-none" style={{ minWidth: "96px", fontSize: "10px" }}
                          />
                        ) : (
                          formatDecimal(v)
                        )}
                      </td>
                    ))}
                    <td data-label="รวม" className="text-center text-[#17211d]">
                      {formatDecimal(monSum)}
                    </td>
                    <td data-label="อัตรา" className="text-center">
                      {formatDecimal(monRate)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="modal-actions modal-actions-center mt-4">
              <div className="flex items-center gap-2">
                <button type="button" className="btn btn-danger" onClick={clearMonResults}>
                  ล้างผลงาน
                </button>
                <button type="button" className="btn btn-soft" onClick={closeMonForm}>
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} aria-hidden="true" />
                  บันทึก
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>

      <div className="result-filter-panel">
        <div className="result-filter-grid">
          <label className="result-filter-search">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              autoComplete="off"
              value={filterTopic}
              onChange={(event) => setFilterTopic(event.target.value)}
              placeholder="พิมพ์ชื่อหัวข้อ KPI..."
            />
          </label>
          <label className="result-filter-field">
            <select value={filterKpiTypeId} onChange={(event) => setFilterKpiTypeId(event.target.value)}>
              <option value="">ทุกประเภท</option>
              {kpiTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.type}</option>
              ))}
            </select>
          </label>
          <label className="result-filter-field result-filter-department">
            <select value={filterDepartmentId} onChange={(event) => setFilterDepartmentId(event.target.value)}>
              <option value="">ทุกแผนก/ฝ่าย/กลุ่มงาน</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </label>
          <label className="result-filter-field">
            <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
              <option value="">ทุกสถานะ</option>
              <option value="pass">ผ่าน</option>
              <option value="fail">ไม่ผ่าน</option>
              <option value="pending">รอดำเนินการ</option>
            </select>
          </label>
          {activeFilterCount > 0 && (
            <button type="button" className="btn btn-soft result-filter-clear" onClick={clearFilters}>
              <X size={14} aria-hidden="true" />
              ล้าง
            </button>
          )}
        </div>
      </div>

      <div className="panel data-table-wrap">
        <table className="data-table kpi-results-table text-sm">
          <thead>
            <tr>
              <th className="w-12 sortable-th" onClick={() => handleSort("kpi_number")}>#</th>
              <th className="w-32 sortable-th" onClick={() => handleSort("kpi_type")}>ประเภท</th>
              <th className="sortable-th" onClick={() => handleSort("kpi_name")}>ตัวชี้วัด</th>
              <th className="sortable-th" onClick={() => handleSort("target")}>เป้าหมาย</th>
              <th className="sortable-th" onClick={() => handleSort("result")}>ผลงาน</th>
              <th className="sortable-th" onClick={() => handleSort("percent")}>อัตรา</th>
              <th className="sortable-th" onClick={() => handleSort("status")}>สถานะ</th>
              {showManageColumn && <th className="w-28">จัดการ</th>}
            </tr>
          </thead>
          <tbody>
            {sortedResults.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={showManageColumn ? 8 : 7} className="empty-cell">ไม่พบผลงาน</td>
              </tr>
            ) : (
              sortedResults.map((row) => (
                <tr key={`topic-${row.kpi_id}`}>
                  <td data-label="#" className="result-number-cell text-[#64746d] w-12">
                    {row.kpi_number ? <span className="number-badge kpi-number-badge">{row.kpi_number}</span> : "-"}
                  </td>
                  <td data-label="ประเภท" className="result-type-cell">
                    <span className={`pill pill-kpi-type-badge ${kpiTypeBadgeClass(row.kpi_type_id)}`}>{row.kpi_type || "-"}</span>
                  </td>
                  <td data-label="ตัวชี้วัด" className="result-topic-cell font-semibold text-[#17211d]">
                    {row.kpi_name}
                    {row.topic_criteria && (
                      <div className="text-xs font-normal text-red-500/70 mt-0.5">
                        <strong>({row.topic_criteria})</strong>
                      </div>
                    )}
                    {departmentLabels(row.kpi_id).length > 0 && (
                      <div className="result-topic-departments">
                        {departmentLabels(row.kpi_id).map((department) => (
                          <span key={department} className="result-department-badge">{department}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td data-label="เป้าหมาย" className="result-value-cell">
                    {row.target != null ? <span className="number-badge">{row.target}</span> : "-"}
                  </td>
                  <td data-label="ผลงาน" className="result-value-cell">
                    {row.result != null ? <span className="number-badge">{row.result}</span> : "-"}
                  </td>
                  <td data-label="อัตรา" className="result-value-cell">
                    {row.percent != null ? (
                      <span className={`number-badge number-badge-rate ${rateBadgeClass(row.status)}`}>
                        {row.percent}
                      </span>
                    ) : "-"}
                  </td>
                  <td data-label="สถานะ" className="result-status-cell">
                    <span className={`pill ${statusColors[row.status || "pending"] || "pill-muted"}`}>
                      {(() => {
                        const rowStatus = row.status || "pending";
                        const StatusIcon = statusIcons[rowStatus as keyof typeof statusIcons] || Clock3;
                        return <StatusIcon size={13} aria-hidden="true" />;
                      })()}
                      {statusLabels[row.status || "pending"] || row.status}
                    </span>
                  </td>
                  {showManageColumn && (
                    <td data-label="จัดการ">
                      {canEditKpi(row.kpi_id) ? (
                        <button
                          type="button"
                          onClick={() => openMonForm(row.kpi_id, row.kpi_name, row.kpi_number)}
                          className="btn btn-primary icon-action-btn"
                          aria-label={`เพิ่มผล ${row.kpi_name}`}
                          title="เพิ่มผล"
                        >
                          <CalendarPlus size={13} aria-hidden="true" />
                        </button>
                      ) : (
                        <span className="text-xs text-[#8a9891]">-</span>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
