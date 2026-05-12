"use client";

import { MinusCircle, Pencil, Plus, Save, Search, Target, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/Modal";
import { confirmAction, notifyError, notifySuccess } from "@/lib/notice";
import { applySort, SortDir, toggleSort } from "@/lib/sort";

interface TopicDepartment {
  id: number;
  name: string;
  user_id: number | null;
  user_owner: string | null;
}

interface Topic {
  id: number;
  name: string;
  kpi_type_id: number | null;
  kpi_type: string | null;
  status: string;
  kpi_number: string | null;
  note: string | null;
  departments: TopicDepartment[];
}

interface KpiType {
  id: number;
  type: string;
}

interface Department {
  id: number;
  name: string;
}

interface User {
  id: number;
  fullname: string;
  username: string;
  department_id: number | null;
  department_name: string | null;
}

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
  const [assignments, setAssignments] = useState<Assignment[]>([emptyAssignment()]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editKpiTypeId, setEditKpiTypeId] = useState("");
  const [editKpiNumber, setEditKpiNumber] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editAssignments, setEditAssignments] = useState<Assignment[]>([emptyAssignment()]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState("");
  const [kpiTypes, setKpiTypes] = useState<KpiType[]>([]);
  const [filterKpiTypeId, setFilterKpiTypeId] = useState("");
  const [filterTopic, setFilterTopic] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir | null>(null);

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
    setEditAssignments([emptyAssignment()]);
  };

  const openCreate = () => {
    setEditingId(null);
    setName("");
    setKpiTypeId("");
    setKpiNumber("");
    setNote("");
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
    const matchesTopic = !filterTopic.trim() || topic.name.toLowerCase().includes(filterTopic.trim().toLowerCase());
    return matchesType && matchesTopic;
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

  const SortField = ({ field }: { field: string }) => (
    <span className={`sort-icon${sortBy === field ? " active" : ""}`}>
      <span className="sort-icon-up" data-active={sortBy === field && sortDir === "asc" ? "true" : undefined}>&#9650;</span>
      <span className="sort-icon-down" data-active={sortBy === field && sortDir === "desc" ? "true" : undefined}>&#9660;</span>
    </span>
  );

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
          <p className="page-subtitle">กำหนดตัวชี้วัด ผู้รับผิดชอบ และหน่วยงานรับผิดชอบรายงาน</p>
        </div>
      </header>

      {error && <div className="alert">{error}</div>}

      <div className="filter-bar topic-filter-bar">
        <div className="filter-icon hidden sm:flex items-center text-[#64746d]">
          <Search size={18} aria-hidden="true" />
        </div>
        <label className="filter-search">
          <input
            type="search"
            value={filterTopic}
            onChange={(event) => setFilterTopic(event.target.value)}
            placeholder="พิมพ์ชื่อตัวชี้วัด..."
          />
        </label>
        <select value={filterKpiTypeId} onChange={(event) => setFilterKpiTypeId(event.target.value)} className="max-w-[160px]">
          <option value="">ทุกประเภท</option>
          {kpiTypes.map((type) => (
            <option key={type.id} value={type.id}>{type.type}</option>
          ))}
        </select>
      </div>

      <div className="table-toolbar">
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} aria-hidden="true" />
          เพิ่มตัวชี้วัด
        </button>
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        size="lg"
        title={isEditing ? "แก้ไขตัวชี้วัด" : "เพิ่มตัวชี้วัด"}
      >
        <form onSubmit={isEditing ? handleUpdate : handleCreate} className="login-form">
          <div className="form-group">
            <label htmlFor="topic-number">ตัวชี้วัดที่</label>
            <input
              id="topic-number"
              type="text"
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
              value={isEditing ? editName : name}
              onChange={(event) => isEditing ? setEditName(event.target.value) : setName(event.target.value)}
              required
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

          <div className="form-group">
            <label htmlFor="topic-note">หมายเหตุ</label>
            <textarea
              id="topic-note"
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
              <th className="w-12 sortable-th" onClick={() => handleSort("kpi_number")}>#<SortField field="kpi_number" /></th>
              <th className="sortable-th" onClick={() => handleSort("name")}>ตัวชี้วัด<SortField field="name" /></th>
              <th className="sortable-th" onClick={() => handleSort("_deptLabel")}>หน่วยงานรับผิดชอบ<SortField field="_deptLabel" /></th>
              <th className="sortable-th" onClick={() => handleSort("_ownerLabel")}>ผู้รับผิดชอบ<SortField field="_ownerLabel" /></th>
              <th className="w-36">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {sortedTopics.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={5} className="empty-cell">ยังไม่มีตัวชี้วัด</td>
              </tr>
            ) : (
              sortedTopics.map((topic) => (
                <tr key={topic.id}>
                  <td data-label="#" className="text-[#64746d] w-12">{topic.kpi_number || "-"}</td>
                  <td data-label="ชื่อ" className="font-semibold text-[#17211d]">
                    {topic.name}
                    <div className="mt-1">
                      <span className={`pill pill-kpi-type-badge ${kpiTypeBadgeClass(topic.kpi_type_id)}`}>{topic.kpi_type || "-"}</span>
                    </div>
                    {topic.note && (
                      <div className="text-xs font-normal text-gray-500 mt-1">{topic.note}</div>
                    )}
                  </td>
                  <td data-label="หน่วยงานรับผิดชอบ">
                    <div className="flex flex-wrap gap-1">
                      {(topic.departments || []).length === 0
                        ? "-"
                        : topic.departments.map((d) => (
                            <span key={d.id} className="pill pill-muted">{d.name}</span>
                          ))}
                    </div>
                  </td>
                  <td data-label="ผู้รับผิดชอบ">
                    {(topic.departments || []).length === 0
                      ? "-"
                      : topic.departments.map((d) => d.user_owner || "-").join(", ")}
                  </td>
                  <td data-label="จัดการ">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(topic)}
                        className="btn btn-soft min-h-8 px-3 py-1 text-xs"
                      >
                        <Pencil size={13} aria-hidden="true" />
                        แก้ไข
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(topic.id)}
                        className="btn btn-danger min-h-8 px-3 py-1 text-xs"
                      >
                        <Trash2 size={13} aria-hidden="true" />
                        ลบ
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
