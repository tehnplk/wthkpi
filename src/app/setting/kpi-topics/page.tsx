"use client";

import { ChevronLeft, ChevronRight, MinusCircle, Pencil, Plus, Save, Search, Target, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/Modal";
import type { Department, KpiType } from "@/app/models/common";
import type { KpiTopic as Topic, KpiTopicUser as User } from "@/app/models/kpi-topic";
import { confirmAction, notifyError, notifySuccess } from "@/lib/notice";
import { applySort, SortDir, toggleSort } from "@/lib/sort";

interface Assignment {
  deptId: number;
  userId: number;
}

const emptyAssignment = (): Assignment => ({ deptId: 0, userId: 0 });

const kpiTypeBadgeClass = (kpiTypeId: number | null) => {
  if (kpiTypeId == null) return "pill-kpi-type";
  return `pill-kpi-t${kpiTypeId % 6}`;
};

const integerInputValue = (value: string) => value.replace(/\D/g, "");

const integerDisplayValue = (value: string | number | null) => (
  value == null ? "" : String(Math.trunc(Number(value)))
);

export default function KpiTopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [kpiTypeId, setKpiTypeId] = useState("");
  const [kpiNumber, setKpiNumber] = useState("");
  const [note, setNote] = useState("");
  const [criteria, setCriteria] = useState("");
  const [rateCalValue, setRateCalValue] = useState("");
  const [flagReporting, setFlagReporting] = useState(true);
  const [flagShowGuest, setFlagShowGuest] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([emptyAssignment()]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editKpiTypeId, setEditKpiTypeId] = useState("");
  const [editKpiNumber, setEditKpiNumber] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editCriteria, setEditCriteria] = useState("");
  const [editRateCalValue, setEditRateCalValue] = useState("");
  const [editFlagReporting, setEditFlagReporting] = useState(true);
  const [editFlagShowGuest, setEditFlagShowGuest] = useState(true);
  const [editAssignments, setEditAssignments] = useState<Assignment[]>([emptyAssignment()]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [parentTopic, setParentTopic] = useState<Topic | null>(null);
  const [error, setError] = useState("");
  const [kpiTypes, setKpiTypes] = useState<KpiType[]>([]);
  const [filterKpiTypeId, setFilterKpiTypeId] = useState("");
  const [filterDepartmentId, setFilterDepartmentId] = useState("");
  const [filterTopic, setFilterTopic] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sortBy, setSortBy] = useState<string | null>("id");
  const [sortDir, setSortDir] = useState<SortDir | null>("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = () => {
    fetch("/api/kpi-topics")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTopics(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    fetch("/api/departments")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setDepartments(data); })
      .catch(() => {});
    fetch("/api/kpi-types")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setKpiTypes(data); })
      .catch(() => {});
    fetch("/api/users")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setUsers(data); })
      .catch(() => {});
  }, []);

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setEditName("");
    setEditKpiTypeId("");
    setEditKpiNumber("");
    setEditNote("");
    setEditCriteria("");
    setEditRateCalValue("");
    setEditFlagReporting(true);
    setEditFlagShowGuest(true);
    setEditAssignments([emptyAssignment()]);
    setParentTopic(null);
  };

  const openCreate = () => {
    setEditingId(null);
    setParentTopic(null);
    setName("");
    setKpiTypeId("");
    setKpiNumber("");
    setNote("");
    setCriteria("");
    setRateCalValue("");
    setFlagReporting(true);
    setFlagShowGuest(true);
    setAssignments([emptyAssignment()]);
    setError("");
    setIsFormOpen(true);
  };

  const openCreateSubTopic = (topic: Topic) => {
    setEditingId(null);
    setParentTopic(topic);
    setName("");
    setKpiTypeId(topic.kpi_type_id ? String(topic.kpi_type_id) : "");
    setKpiNumber(topic.kpi_number ? `${topic.kpi_number}.` : "");
    setNote("");
    setCriteria("");
    setRateCalValue(integerDisplayValue(topic.rate_cal_value));
    setFlagReporting(true);
    setFlagShowGuest(topic.flag_show_guest !== "no");
    setAssignments(
      (topic.departments || []).length > 0
        ? topic.departments.map((d) => ({ deptId: d.id, userId: d.user_id || 0 }))
        : [emptyAssignment()]
    );
    setError("");
    setIsFormOpen(true);
  };

  const startEdit = (topic: Topic) => {
    setEditingId(topic.id);
    setEditName(topic.name);
    setEditKpiTypeId(topic.kpi_type_id ? String(topic.kpi_type_id) : "");
    setEditKpiNumber(topic.kpi_number || "");
    setEditNote(topic.note || "");
    setEditCriteria(topic.criteria || "");
    setEditRateCalValue(integerDisplayValue(topic.rate_cal_value));
    setEditFlagReporting(topic.flag_reporting !== "no");
    setEditFlagShowGuest(topic.flag_show_guest !== "no");
    const depts = topic.departments || [];
    setEditAssignments(
      depts.length > 0
        ? depts.map((d) => ({ deptId: d.id, userId: d.user_id || 0 }))
        : [emptyAssignment()]
    );
    setError("");
    setIsFormOpen(true);
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setError("");

    const valid = assignments.filter((a) => a.deptId > 0);

    const res = await fetch("/api/kpi-topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        kpi_type_id: kpiTypeId ? Number(kpiTypeId) : null,
        status: "pending",
        kpi_number: kpiNumber.trim() || null,
        note: note.trim() || null,
        criteria: criteria.trim() || null,
        rate_cal_value: rateCalValue ? Number.parseInt(rateCalValue, 10) : null,
        flag_parent_or_child: parentTopic ? "child" : "parent",
        parent_kpi: parentTopic?.id ?? null,
        flag_reporting: flagReporting ? "yes" : "no",
        flag_show_guest: flagShowGuest ? "yes" : "no",
        assignments: valid.map((a) => ({
          department_id: a.deptId,
          user_id: a.userId || null,
        })),
      }),
    });

    if (res.ok) {
      closeForm();
      fetchData();
      notifySuccess("เพิ่มตัวชี้วัด สำเร็จ");
    } else {
      const data = await res.json();
      const message = data.error || "สร้างข้อมูลไม่สำเร็จ";
      setError(message);
      notifyError(message);
    }
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingId || !editName.trim()) return;
    setError("");

    const valid = editAssignments.filter((a) => a.deptId > 0);

    const res = await fetch(`/api/kpi-topics/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName.trim(),
        kpi_type_id: editKpiTypeId ? Number(editKpiTypeId) : null,
        kpi_number: editKpiNumber.trim() || null,
        note: editNote.trim() || null,
        criteria: editCriteria.trim() || null,
        rate_cal_value: editRateCalValue ? Number.parseInt(editRateCalValue, 10) : null,
        flag_reporting: editFlagReporting ? "yes" : "no",
        flag_show_guest: editFlagShowGuest ? "yes" : "no",
        assignments: valid.map((a) => ({
          department_id: a.deptId,
          user_id: a.userId || null,
        })),
      }),
    });

    if (res.ok) {
      closeForm();
      fetchData();
      notifySuccess("บันทึกตัวชี้วัด สำเร็จ");
    } else {
      const data = await res.json();
      const message = data.error || "อัปเดตข้อมูลไม่สำเร็จ";
      setError(message);
      notifyError(message);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmAction(
      "ลบตัวชี้วัด นี้หรือไม่?",
      "หากมีผลรายงานอ้างอิงอยู่ ระบบอาจลบไม่สำเร็จ"
    );
    if (!confirmed) return;

    const res = await fetch(`/api/kpi-topics/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchData();
      notifySuccess("ลบตัวชี้วัด สำเร็จ");
    } else {
      const data = await res.json();
      notifyError(data.error || "ลบข้อมูลไม่สำเร็จ");
    }
  };

  const isEditing = editingId !== null;
  const displayedTopics = topics.filter((topic) => {
    const matchesType = !filterKpiTypeId || topic.kpi_type_id === Number(filterKpiTypeId);
    const matchesDepartment = !filterDepartmentId || (topic.departments || []).some((dept) => dept.id === Number(filterDepartmentId));
    const matchesTopic = !filterTopic.trim() || topic.name.toLowerCase().includes(filterTopic.trim().toLowerCase());
    return matchesType && matchesDepartment && matchesTopic;
  });

  const handleSort = (col: string) => {
    const next = toggleSort(sortDir, col, sortBy);
    setSortBy(next.sortBy);
    setSortDir(next.sortDir);
  };

  const sortedTopics = useMemo(() => {
    const withLabels = displayedTopics.map((t) => ({
      ...t,
      _deptLabel: (t.departments || []).map((d) => d.name).join(", "),
      _ownerLabel: (t.departments || []).map((d) => d.user_owner || "-").join(", "),
    }));

    const childrenByParent = new Map<number, typeof withLabels>();
    const rootTopics: typeof withLabels = [];
    const subTopics: typeof withLabels = [];

    for (const topic of withLabels) {
      if (topic.flag_parent_or_child === "child") {
        subTopics.push(topic);
      } else {
        rootTopics.push(topic);
      }
    }

    const rootIds = new Set(rootTopics.map((topic) => topic.id));
    const rootIdByNumber = new Map(
      rootTopics
        .filter((topic) => topic.kpi_number)
        .map((topic) => [topic.kpi_number as string, topic.id])
    );

    for (const topic of subTopics) {
      const numberParentId = topic.kpi_number
        ? rootIdByNumber.get(topic.kpi_number.split(".").slice(0, -1).join("."))
        : undefined;
      const parentId = topic.parent_kpi && rootIds.has(topic.parent_kpi)
        ? topic.parent_kpi
        : numberParentId;

      if (parentId) {
        const children = childrenByParent.get(parentId) || [];
        children.push(topic);
        childrenByParent.set(parentId, children);
      } else {
        rootTopics.push(topic);
      }
    }

    const sortedRootTopics = applySort(rootTopics, sortBy, sortDir);
    const groupedTopics: typeof withLabels = [];
    const groupedIds = new Set<number>();

    for (const topic of sortedRootTopics) {
      groupedTopics.push(topic);
      groupedIds.add(topic.id);

      const sortedChildren = applySort(childrenByParent.get(topic.id) || [], "kpi_number", "asc");
      for (const child of sortedChildren) {
        groupedTopics.push(child);
        groupedIds.add(child.id);
      }
    }

    for (const topic of applySort(withLabels, sortBy, sortDir)) {
      if (!groupedIds.has(topic.id)) groupedTopics.push(topic);
    }

    return groupedTopics;
  }, [displayedTopics, sortBy, sortDir]);
  const totalPages = Math.max(1, Math.ceil(sortedTopics.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = sortedTopics.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, sortedTopics.length);
  const pagedTopics = sortedTopics.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const activeFilterCount = [
    filterTopic.trim(),
    filterKpiTypeId,
    filterDepartmentId,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilterTopic("");
    setFilterKpiTypeId("");
    setFilterDepartmentId("");
    setPage(1);
  };

  const currentAssignments = isEditing ? editAssignments : assignments;
  const setAssignmentsFn = isEditing ? setEditAssignments : setAssignments;
  const currentFlagReporting = isEditing ? editFlagReporting : flagReporting;
  const setFlagReportingFn = isEditing ? setEditFlagReporting : setFlagReporting;
  const currentFlagShowGuest = isEditing ? editFlagShowGuest : flagShowGuest;
  const setFlagShowGuestFn = isEditing ? setEditFlagShowGuest : setFlagShowGuest;

  const usersByDept = (deptId: number, assignedUserId: number) => {
    if (!deptId) return users;
    const filtered = users.filter((u) => u.department_id === deptId || u.department_id === null);
    if (assignedUserId && !filtered.some((u) => u.id === assignedUserId)) {
      const assignedUser = users.find((u) => u.id === assignedUserId);
      if (assignedUser) filtered.push(assignedUser);
    }
    return filtered;
  };

  const handleRowDept = (idx: number, deptId: number) => {
    setAssignmentsFn((prev) => {
      const next = [...prev];
      next[idx] = { deptId, userId: 0 };
      return next;
    });
  };

  const handleRowUser = (idx: number, userId: number) => {
    setAssignmentsFn((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], userId };
      return next;
    });
  };

  const addRow = () => {
    setAssignmentsFn((prev) => [...prev, emptyAssignment()]);
  };

  const removeRow = (idx: number) => {
    setAssignmentsFn((prev) => prev.filter((_, i) => i !== idx));
  };

  if (loading) {
    return <div className="loading-state">กำลังโหลดตัวชี้วัด...</div>;
  }

  return (
    <div>
      <header className="page-heading">
        <div>
          <div className="flex items-center gap-3">
            <span className="icon-badge">
              <Target size={18} aria-hidden="true" />
            </span>
            <h2 className="page-title">ตัวชี้วัด</h2>
          </div>
        </div>
      </header>

      {error && <div className="alert">{error}</div>}

      <div className="topic-filter-panel">
        <div className="topic-filter-grid">
          <div className="filter-controls">
            <label className="result-filter-search">
              <Search size={17} aria-hidden="true" />
              <input
                type="search"
                autoComplete="off"
                value={filterTopic}
                onChange={(event) => {
                  setFilterTopic(event.target.value);
                  setPage(1);
                }}
                placeholder="พิมพ์ชื่อตัวชี้วัด..."
              />
            </label>
            <label className="result-filter-field">
              <select
                value={filterKpiTypeId}
                onChange={(event) => {
                  setFilterKpiTypeId(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">ทุกประเภท</option>
                {kpiTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.type}</option>
                ))}
              </select>
            </label>
            <label className="result-filter-field result-filter-department">
              <select
                value={filterDepartmentId}
                onChange={(event) => {
                  setFilterDepartmentId(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">ทุกแผนก/ฝ่าย/กลุ่มงาน</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </label>
            {activeFilterCount > 0 && (
              <button type="button" className="btn btn-soft result-filter-clear" onClick={clearFilters}>
                <X size={14} aria-hidden="true" />
                ล้าง
              </button>
            )}
          </div>
          <div className="filter-actions">
            <button type="button" className="btn btn-primary topic-filter-create" onClick={openCreate}>
              <Plus size={16} aria-hidden="true" />
              เพิ่มตัวชี้วัดหลัก
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        size="xl"
        title={isEditing ? "แก้ไขตัวชี้วัด" : parentTopic ? "เพิ่มตัวชี้วัดย่อย" : "เพิ่มตัวชี้วัด"}
        subtitle={parentTopic ? `ภายใต้: ${parentTopic.kpi_number ? `${parentTopic.kpi_number} ` : ""}${parentTopic.name}` : undefined}
      >
        <form onSubmit={isEditing ? handleUpdate : handleCreate} className="login-form">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_9fr_2fr] gap-3">
            <div className="form-group">
              <label htmlFor="topic-number">ตัวชี้วัดที่</label>
              <input
                id="topic-number"
                type="text"
                autoComplete="off"
                value={isEditing ? editKpiNumber : kpiNumber}
                onChange={(event) => isEditing ? setEditKpiNumber(event.target.value) : setKpiNumber(event.target.value)}
                placeholder="เช่น 1, 1.1, พิเศษ"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="topic-name">ชื่อตัวชี้วัด</label>
              <input
                id="topic-name"
                type="text"
                autoComplete="off"
                value={isEditing ? editName : name}
                onChange={(event) => isEditing ? setEditName(event.target.value) : setName(event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="topic-type">ประเภท</label>
              <select
                id="topic-type"
                value={isEditing ? editKpiTypeId : kpiTypeId}
                onChange={(event) => isEditing ? setEditKpiTypeId(event.target.value) : setKpiTypeId(event.target.value)}
              >
                <option value="">เลือกประเภทตัวชี้วัด</option>
                {kpiTypes.map((type) => (
                  <option key={type.id} value={type.id}>{type.type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] gap-3 items-start">
            <div className="form-group">
              <label htmlFor="topic-criteria">เกณฑ์การวัดผล</label>
              <input
                id="topic-criteria"
                type="text"
                autoComplete="off"
                maxLength={255}
                value={isEditing ? editCriteria : criteria}
                onChange={(event) => isEditing ? setEditCriteria(event.target.value) : setCriteria(event.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="topic-rate-cal-value">การคำนวณอัตรา</label>
              <div className="rate-formula-control">
                <span className="rate-formula-text">(ผลงาน/จำนวนกลุ่มเป้าหมาย) x</span>
                <input
                  id="topic-rate-cal-value"
                  type="number"
                  step="1"
                  min="0"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  value={isEditing ? editRateCalValue : rateCalValue}
                  onChange={(event) => {
                    const nextValue = integerInputValue(event.target.value);
                    return isEditing ? setEditRateCalValue(nextValue) : setRateCalValue(nextValue);
                  }}
                  className="rate-formula-input"
                  aria-label="ตัวเลขสำหรับคำนวณอัตรา"
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="topic-note">หมายเหตุ</label>
            <textarea
              id="topic-note"
              autoComplete="off"
              rows={2}
              value={isEditing ? editNote : note}
              onChange={(event) => isEditing ? setEditNote(event.target.value) : setNote(event.target.value)}
            />
          </div>

          <div className="form-group">
            <label>ผู้รับผิดชอบ</label>
            {currentAssignments.map((row, idx) => (
              <div key={idx} className="assign-row">
                <select
                  value={row.deptId || ""}
                  onChange={(event) => handleRowDept(idx, Number(event.target.value))}
                >
                  <option value="">หน่วยงาน</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
                <select
                  value={row.userId || ""}
                  onChange={(event) => handleRowUser(idx, Number(event.target.value))}
                >
                  <option value="">ผู้รับผิดชอบ</option>
                  {usersByDept(row.deptId, row.userId).map((user) => (
                    <option key={user.id} value={user.id}>{user.fullname}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-soft assign-row-action-btn"
                  onClick={addRow}
                  aria-label="เพิ่มผู้รับผิดชอบ"
                  title="เพิ่มผู้รับผิดชอบ"
                >
                  <Plus size={15} />
                </button>
                {currentAssignments.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-danger assign-row-action-btn"
                    onClick={() => removeRow(idx)}
                    aria-label="ลบผู้รับผิดชอบ"
                    title="ลบผู้รับผิดชอบ"
                  >
                    <MinusCircle size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="modal-actions kpi-topic-modal-actions">
            <button type="button" className="btn btn-soft" onClick={closeForm}>
              ยกเลิก
            </button>
            <fieldset className="report-choice" aria-label="สถานะการรายงานผล">
              <label className={currentFlagReporting ? "report-choice-option report-choice-option-active report-choice-option-reporting" : "report-choice-option"}>
                <input
                  type="radio"
                  name="flag-reporting"
                  checked={currentFlagReporting}
                  onChange={() => setFlagReportingFn(true)}
                />
                รายงานผล
              </label>
              <label className={!currentFlagReporting ? "report-choice-option report-choice-option-active report-choice-option-not-reporting" : "report-choice-option"}>
                <input
                  type="radio"
                  name="flag-reporting"
                  checked={!currentFlagReporting}
                  onChange={() => setFlagReportingFn(false)}
                />
                ไม่รายงานผล
              </label>
            </fieldset>
            <fieldset className="report-choice" aria-label="สถานะการ Login">
              <label className={currentFlagShowGuest ? "report-choice-option report-choice-option-active report-choice-option-reporting" : "report-choice-option"}>
                <input
                  type="radio"
                  name="flag-show-guest"
                  checked={currentFlagShowGuest}
                  onChange={() => setFlagShowGuestFn(true)}
                />
                ไม่ต้อง Login
              </label>
              <label className={!currentFlagShowGuest ? "report-choice-option report-choice-option-active report-choice-option-not-reporting" : "report-choice-option"}>
                <input
                  type="radio"
                  name="flag-show-guest"
                  checked={!currentFlagShowGuest}
                  onChange={() => setFlagShowGuestFn(false)}
                />
                ต้อง Login
              </label>
            </fieldset>
            <button type="submit" className="btn btn-primary">
              <Save size={16} aria-hidden="true" />
              บันทึก
            </button>
          </div>
        </form>
      </Modal>

      <div className="pagination-bar">
        <div className="pagination-summary">
          {sortedTopics.length === 0 ? "0 items" : `${pageStart}-${pageEnd} of ${sortedTopics.length}`}
        </div>
        <div className="pagination-actions">
          <label className="pagination-size">
            Rows
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn btn-soft icon-action-btn"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={currentPage <= 1}
            aria-label="Previous page"
            title="Previous page"
          >
            <ChevronLeft size={15} aria-hidden="true" />
          </button>
          <span className="pagination-page">{currentPage} / {totalPages}</span>
          <button
            type="button"
            className="btn btn-soft icon-action-btn"
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
            title="Next page"
          >
            <ChevronRight size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="panel data-table-wrap">
        <table className="data-table kpi-topics-table text-sm">
          <thead>
            <tr>
              <th className="w-12 sortable-th" onClick={() => handleSort("kpi_number")}>#</th>
              <th className="sortable-th" onClick={() => handleSort("kpi_type")}>ประเภท</th>
              <th className="sortable-th" onClick={() => handleSort("name")}>ตัวชี้วัด</th>
              <th className="sortable-th" onClick={() => handleSort("_deptLabel")}>หน่วยงานรับผิดชอบ</th>
              <th className="sortable-th" onClick={() => handleSort("_ownerLabel")}>ผู้รับผิดชอบ</th>
              <th className="w-36 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {sortedTopics.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={6} className="empty-cell">ยังไม่มีตัวชี้วัด</td>
              </tr>
            ) : (
              pagedTopics.map((topic) => {
                const isSubTopic = topic.flag_parent_or_child === "child";
                const isReporting = topic.flag_reporting !== "no";
                const rowClasses = [
                  isSubTopic ? "kpi-topic-row-sub" : "",
                  !isReporting ? "kpi-topic-row-no-reporting" : "",
                ].filter(Boolean).join(" ");

                return (
                  <tr key={topic.id} className={rowClasses || undefined}>
                    <td
                      data-label="#"
                      className={`kpi-topic-number-cell text-[#64746d] w-12 ${isSubTopic ? "kpi-topic-number-cell-sub" : ""}`}
                    >
                      {isSubTopic && <span className="kpi-topic-sub-marker" aria-hidden="true" />}
                      {topic.kpi_number || "-"}
                    </td>
                    <td data-label="ประเภท">
                      <span className={`pill pill-kpi-type-badge ${kpiTypeBadgeClass(topic.kpi_type_id)}`}>{topic.kpi_type || "-"}</span>
                    </td>
                    <td
                      data-label="ชื่อ"
                      className={`font-semibold text-[#17211d] ${isSubTopic ? "kpi-topic-name-cell-sub" : ""}`}
                    >
                      {topic.name}
                      {topic.criteria && (
                        <div className="text-xs font-normal text-red-500/70 mt-1">
                          <strong>({topic.criteria})</strong>
                        </div>
                      )}
                      {topic.note && (
                        <div className="text-xs font-normal text-gray-500 mt-1">{topic.note}</div>
                      )}
                    </td>
                    <td data-label="หน่วยงานรับผิดชอบ">
                      <div className="topic-department-list">
                        {(topic.departments || []).length === 0
                          ? "-"
                          : topic.departments.map((d) => (
                              <span key={d.id} className="pill pill-muted">{d.name}</span>
                            ))}
                      </div>
                    </td>
                    <td data-label="ผู้รับผิดชอบ">
                      <div className="topic-department-list">
                        {(topic.departments || []).length === 0
                          ? "-"
                          : topic.departments.map((d) => (
                              <span key={d.id}>{d.user_owner || "-"}</span>
                            ))}
                      </div>
                    </td>
                    <td
                      data-label="จัดการ"
                      className={`kpi-topic-action-cell ${isSubTopic ? "kpi-topic-action-cell-sub" : ""}`}
                    >
                      <div className={`flex gap-2 ${isSubTopic ? "justify-start" : "justify-end"}`}>
                        <button
                          type="button"
                          onClick={() => startEdit(topic)}
                          className="btn btn-soft icon-action-btn"
                          aria-label={`แก้ไข ${topic.name}`}
                          title="แก้ไข"
                        >
                          <Pencil size={13} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(topic.id)}
                          className="btn btn-danger icon-action-btn"
                          aria-label={`ลบ ${topic.name}`}
                          title="ลบ"
                        >
                          <Trash2 size={13} aria-hidden="true" />
                        </button>
                        {topic.flag_parent_or_child !== "child" && (
                          <button
                            type="button"
                            onClick={() => openCreateSubTopic(topic)}
                            className="btn btn-primary icon-action-btn"
                            aria-label={`เพิ่มตัวชี้วัดย่อย ${topic.name}`}
                            title="เพิ่มตัวชี้วัดย่อย"
                          >
                            <Plus size={13} aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </td>
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
