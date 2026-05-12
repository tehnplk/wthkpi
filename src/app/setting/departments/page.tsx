"use client";

import { Building2, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/Modal";
import { confirmAction, notifyError, notifySuccess } from "@/lib/notice";
import { applySort, SortDir, toggleSort } from "@/lib/sort";

interface Department {
  id: number;
  name: string;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir | null>(null);

  const fetchDepartments = () => {
    fetch("/api/departments")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setDepartments(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setEditName("");
  };

  const openCreate = () => {
    setEditingId(null);
    setName("");
    setError("");
    setIsFormOpen(true);
  };

  const startEdit = (department: Department) => {
    setEditingId(department.id);
    setEditName(department.name);
    setError("");
    setIsFormOpen(true);
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setError("");

    const res = await fetch("/api/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });

    if (res.ok) {
      setName("");
      closeForm();
      fetchDepartments();
      notifySuccess("เพิ่มแผนกสำเร็จ");
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

    const res = await fetch(`/api/departments/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    });

    if (res.ok) {
      closeForm();
      fetchDepartments();
      notifySuccess("บันทึกแผนกสำเร็จ");
    } else {
      const data = await res.json();
      const message = data.error || "อัปเดตข้อมูลไม่สำเร็จ";
      setError(message);
      notifyError(message);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmAction("ลบแผนกนี้หรือไม่?");
    if (!confirmed) return;

    const res = await fetch(`/api/departments/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchDepartments();
      notifySuccess("ลบแผนกสำเร็จ");
    } else {
      const data = await res.json();
      notifyError(data.error || "ลบข้อมูลไม่สำเร็จ");
    }
  };

  if (loading) {
    return <div className="loading-state">กำลังโหลดแผนก...</div>;
  }

  const handleSort = (col: string) => {
    const next = toggleSort(sortDir, col, sortBy);
    setSortBy(next.sortBy);
    setSortDir(next.sortDir);
  };

  const sortedDepartments = useMemo(
    () => applySort(departments, sortBy, sortDir),
    [departments, sortBy, sortDir]
  );

  const SortField = ({ field }: { field: string }) => (
    <span className={`sort-icon${sortBy === field ? " active" : ""}`}>
      <span className="sort-icon-up" data-active={sortBy === field && sortDir === "asc" ? "true" : undefined}>&#9650;</span>
      <span className="sort-icon-down" data-active={sortBy === field && sortDir === "desc" ? "true" : undefined}>&#9660;</span>
    </span>
  );

  return (
    <div>
      <header className="page-heading">
        <div>
          <div className="flex items-center gap-3">
            <span className="icon-badge">
              <Building2 size={18} aria-hidden="true" />
            </span>
            <h2 className="page-title">แผนก</h2>
          </div>
          <p className="page-subtitle">จัดการชื่อแผนกสำหรับผู้ใช้และการกำหนดเจ้าของ KPI</p>
        </div>
      </header>

      {error && <div className="alert">{error}</div>}

      <div className="table-toolbar">
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} aria-hidden="true" />
          เพิ่มแผนก
        </button>
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        size="sm"
        title={editingId ? "แก้ไขแผนก" : "เพิ่มแผนก"}
      >
        <form onSubmit={editingId ? handleUpdate : handleCreate} className="login-form">
          <div className="form-group">
            <label htmlFor="department-name">ชื่อแผนก</label>
            <input
              id="department-name"
              type="text"
              value={editingId ? editName : name}
              onChange={(event) => editingId ? setEditName(event.target.value) : setName(event.target.value)}
              autoFocus
              required
            />
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
              <th className="w-20 sortable-th" onClick={() => handleSort("id")}>ID<SortField field="id" /></th>
              <th className="sortable-th" onClick={() => handleSort("name")}>ชื่อ<SortField field="name" /></th>
              <th className="w-36">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {sortedDepartments.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={3} className="empty-cell">ยังไม่มีแผนก</td>
              </tr>
            ) : (
              sortedDepartments.map((department) => (
                <tr key={department.id}>
                  <td data-label="ID" className="text-[#64746d]">{department.id}</td>
                  <td data-label="ชื่อ" className="font-semibold text-[#17211d]">{department.name}</td>
                  <td data-label="จัดการ">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(department)}
                        className="btn btn-soft min-h-8 px-3 py-1 text-xs"
                      >
                        <Pencil size={13} aria-hidden="true" />
                        แก้ไข
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(department.id)}
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
