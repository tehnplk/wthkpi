"use client";

import { MinusCircle, Pencil, Plus, Save, Search, Target, Trash2, X } from "lucide-react";
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

export default function KpiTopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [kpiTypeId, setKpiTypeId] = useState("");
  const [kpiNumber, setKpiNumber] = useState("");
  const [note, setNote] = useState("");
  const [criteria, setCriteria] = useState("");
  const [rateCalValue, setRateCalValue] = useState("");
  const [assignments, setAssignments] = useState<Assignment[]>([emptyAssignment()]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editKpiTypeId, setEditKpiTypeId] = useState("");
  const [editKpiNumber, setEditKpiNumber] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editCriteria, setEditCriteria] = useState("");
  const [editRateCalValue, setEditRateCalValue] = useState("");
  const [editAssignments, setEditAssignments] = useState<Assignment[]>([emptyAssignment()]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState("");
  const [kpiTypes, setKpiTypes] = useState<KpiType[]>([]);
  const [filterKpiTypeId, setFilterKpiTypeId] = useState("");
  const [filterDepartmentId, setFilterDepartmentId] = useState("");
  const [filterTopic, setFilterTopic] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sortBy, setSortBy] = useState<string | null>("id");
  const [sortDir, setSortDir] = useState<SortDir | null>("asc");

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
    setEditAssignments([emptyAssignment()]);
  };

  const openCreate = () => {
    setEditingId(null);
    setName("");
    setKpiTypeId("");
    setKpiNumber("");
    setNote("");
    setCriteria("");
    setRateCalValue("");
    setAssignments([emptyAssignment()]);
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
    setEditRateCalValue(topic.rate_cal_value != null ? String(topic.rate_cal_value) : "");
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
        rate_cal_value: rateCalValue ? Number(rateCalValue) : null,
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
        rate_cal_value: editRateCalValue ? Number(editRateCalValue) : null,
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
    return applySort(withLabels, sortBy, sortDir);
  }, [displayedTopics, sortBy, sortDir]);

  const activeFilterCount = [
    filterTopic.trim(),
    filterKpiTypeId,
    filterDepartmentId,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilterTopic("");
    setFilterKpiTypeId("");
    setFilterDepartmentId("");
  };

  const currentAssignments = isEditing ? editAssignments : assignments;
  const setAssignmentsFn = isEditing ? setEditAssignments : setAssignments;

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
                onChange={(event) => setFilterTopic(event.target.value)}
                placeholder="พิมพ์ชื่อตัวชี้วัด..."
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
              เพิ่มตัวชี้วัด
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        size="xl"
        title={isEditing ? "แก้ไขตัวชี้วัด" : "เพิ่มตัวชี้วัด"}
      >
        <form onSubmit={isEditing ? handleUpdate : handleCreate} className="login-form">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_9fr] gap-3">
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
          </div>

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
            <label htmlFor="topic-type">ประเภทตัวชี้วัด</label>
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

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-3 items-start">
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
              <label htmlFor="topic-rate-cal-value">การคำนวณอัตรา</label>
              <div className="rate-formula-control">
                <span className="rate-formula-text">(ผลงาน/เป้าหมาย) x</span>
                <input
                  id="topic-rate-cal-value"
                  type="number"
                  step="0.01"
                  autoComplete="off"
                  value={isEditing ? editRateCalValue : rateCalValue}
                  onChange={(event) => isEditing ? setEditRateCalValue(event.target.value) : setRateCalValue(event.target.value)}
                  className="rate-formula-input"
                  aria-label="ตัวเลขสำหรับคำนวณอัตรา"
                />
              </div>
            </div>
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
                {currentAssignments.length > 1 && (
                  <button type="button" className="btn btn-danger min-h-8 px-2 py-1" onClick={() => removeRow(idx)}>
                    <MinusCircle size={15} />
                  </button>
                )}
              </div>
            ))}
            <div className="flex justify-end mt-1">
              <button type="button" className="btn btn-soft min-h-8 px-2 py-1" onClick={addRow}>
                <Plus size={15} />
              </button>
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

      <div className="panel data-table-wrap">
        <table className="data-table text-sm">
          <thead>
            <tr>
              <th className="w-12 sortable-th" onClick={() => handleSort("kpi_number")}>#</th>
              <th className="sortable-th" onClick={() => handleSort("kpi_type")}>ประเภท</th>
              <th className="sortable-th" onClick={() => handleSort("name")}>ตัวชี้วัด</th>
              <th className="sortable-th" onClick={() => handleSort("_deptLabel")}>หน่วยงานรับผิดชอบ</th>
              <th className="sortable-th" onClick={() => handleSort("_ownerLabel")}>ผู้รับผิดชอบ</th>
              <th className="w-36">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {sortedTopics.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={6} className="empty-cell">ยังไม่มีตัวชี้วัด</td>
              </tr>
            ) : (
              sortedTopics.map((topic) => (
                <tr key={topic.id}>
                  <td data-label="#" className="text-[#64746d] w-12">{topic.kpi_number || "-"}</td>
                  <td data-label="ประเภท">
                    <span className={`pill pill-kpi-type-badge ${kpiTypeBadgeClass(topic.kpi_type_id)}`}>{topic.kpi_type || "-"}</span>
                  </td>
                  <td data-label="ชื่อ" className="font-semibold text-[#17211d]">
                    {topic.name}
                    {topic.criteria && (
                      <div className="text-xs font-normal text-red-500/70 mt-1">{topic.criteria}</div>
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
                  <td data-label="จัดการ">
                    <div className="flex gap-2">
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
                    </div>
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
