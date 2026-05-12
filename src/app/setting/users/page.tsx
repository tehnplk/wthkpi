"use client";

import { Pencil, Save, Trash2, UserPlus, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/Modal";
import { confirmAction, notifyError, notifySuccess } from "@/lib/notice";
import { applySort, SortDir, toggleSort } from "@/lib/sort";

interface User {
  id: number;
  provider_id: string;
  fullname: string;
  username: string | null;
  department_id: number | null;
  department_name: string | null;
  is_active: boolean;
  last_login: string | null;
}

interface Department {
  id: number;
  name: string;
}

function formatThaiDateTime(value: string | null) {
  if (!value) return "-";

  const normalized = /[zZ]|[+-]\d{2}:\d{2}$/.test(value)
    ? value
    : value.replace(" ", "T") + "Z";
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir | null>(null);

  const [providerId, setProviderId] = useState("");
  const [fullname, setFullname] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchData = () => {
    Promise.all([
      fetch("/api/users").then((res) => res.json()),
      fetch("/api/departments").then((res) => res.json()),
    ]).then(([usersData, deptsData]) => {
      if (Array.isArray(usersData)) setUsers(usersData);
      if (Array.isArray(deptsData)) setDepartments(deptsData);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setProviderId("");
    setFullname("");
    setUsername("");
    setPassword("");
    setDepartmentId("");
    setIsActive(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    resetForm();
  };

  const openCreate = () => {
    setEditingId(null);
    resetForm();
    setError("");
    setIsFormOpen(true);
  };

  const startEdit = (user: User) => {
    setEditingId(user.id);
    setProviderId(user.provider_id);
    setFullname(user.fullname);
    setUsername(user.username || "");
    setPassword("");
    setDepartmentId(user.department_id ? String(user.department_id) : "");
    setIsActive(user.is_active);
    setError("");
    setIsFormOpen(true);
  };

  const buildPayload = () => {
    const body: Record<string, unknown> = {
      provider_id: providerId.trim(),
      fullname: fullname.trim(),
      department_id: departmentId ? Number(departmentId) : null,
      is_active: isActive,
    };

    if (username.trim()) body.username = username.trim();
    if (password.trim()) body.password = password.trim();

    return body;
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!providerId.trim() || !fullname.trim()) return;
    setError("");

    const res = await fetch(editingId ? `/api/users/${editingId}` : "/api/users", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload()),
    });

    if (res.ok) {
      closeForm();
      fetchData();
      notifySuccess(editingId ? "บันทึกผู้ใช้สำเร็จ" : "เพิ่มผู้ใช้สำเร็จ");
    } else {
      const data = await res.json();
      const message = data.error || "บันทึกข้อมูลไม่สำเร็จ";
      setError(message);
      notifyError(message);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmAction("ลบผู้ใช้นี้หรือไม่?");
    if (!confirmed) return;

    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchData();
      notifySuccess("ลบผู้ใช้สำเร็จ");
    } else {
      const data = await res.json();
      notifyError(data.error || "ลบข้อมูลไม่สำเร็จ");
    }
  };

  const handleSort = (col: string) => {
    const next = toggleSort(sortDir, col, sortBy);
    setSortBy(next.sortBy);
    setSortDir(next.sortDir);
  };

  const sortedUsers = useMemo(
    () => applySort(users, sortBy, sortDir),
    [users, sortBy, sortDir]
  );

  const SortField = ({ field }: { field: string }) => (
    <span className={`sort-icon${sortBy === field ? " active" : ""}`}>
      <span className="sort-icon-up" data-active={sortBy === field && sortDir === "asc" ? "true" : undefined}>&#9650;</span>
      <span className="sort-icon-down" data-active={sortBy === field && sortDir === "desc" ? "true" : undefined}>&#9660;</span>
    </span>
  );

  if (loading) {
    return <div className="loading-state">กำลังโหลดผู้ใช้...</div>;
  }

  return (
    <div>
      <header className="page-heading">
        <div>
          <div className="flex items-center gap-3">
            <span className="icon-badge">
              <UsersRound size={18} aria-hidden="true" />
            </span>
            <h2 className="page-title">ผู้ใช้</h2>
          </div>
          <p className="page-subtitle">จัดการผู้ใช้ แผนก และสถานะการใช้งานของระบบรายงาน</p>
        </div>
      </header>

      {error && <div className="alert">{error}</div>}

      <div className="table-toolbar">
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <UserPlus size={16} aria-hidden="true" />
          เพิ่มผู้ใช้
        </button>
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        size="lg"
        title={editingId ? "แก้ไขผู้ใช้" : "เพิ่มผู้ใช้"}
      >
        <form onSubmit={handleSave} className="login-form">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="form-group">
              <label htmlFor="provider-id">รหัส Provider</label>
              <input
                id="provider-id"
                type="text"
                value={providerId}
                onChange={(event) => setProviderId(event.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="fullname">ชื่อ-นามสกุล</label>
              <input
                id="fullname"
                type="text"
                value={fullname}
                onChange={(event) => setFullname(event.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="username">ชื่อผู้ใช้</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">{editingId ? "รหัสผ่านใหม่" : "รหัสผ่าน"}</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={editingId ? "เว้นว่างถ้าไม่เปลี่ยน" : ""}
              />
            </div>
            <div className="form-group">
              <label htmlFor="department">แผนก</label>
              <select id="department" value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}>
                <option value="">ไม่มีแผนก</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>{department.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="is-active">สถานะ</label>
              <select id="is-active" value={isActive ? "1" : "0"} onChange={(event) => setIsActive(event.target.value === "1")}>
                <option value="1">ใช้งาน</option>
                <option value="0">ปิดใช้งาน</option>
              </select>
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
              <th className="w-16 sortable-th" onClick={() => handleSort("id")}>ID<SortField field="id" /></th>
              <th className="sortable-th" onClick={() => handleSort("provider_id")}>รหัส Provider<SortField field="provider_id" /></th>
              <th className="sortable-th" onClick={() => handleSort("username")}>ชื่อผู้ใช้<SortField field="username" /></th>
              <th className="sortable-th" onClick={() => handleSort("fullname")}>ชื่อ-นามสกุล<SortField field="fullname" /></th>
              <th className="sortable-th" onClick={() => handleSort("department_name")}>แผนก<SortField field="department_name" /></th>
              <th>รหัสผ่าน</th>
              <th className="sortable-th" onClick={() => handleSort("is_active")}>สถานะ<SortField field="is_active" /></th>
              <th className="sortable-th" onClick={() => handleSort("last_login")}>เข้าสู่ระบบล่าสุด<SortField field="last_login" /></th>
              <th className="w-36">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={9} className="empty-cell">ยังไม่มีผู้ใช้</td>
              </tr>
            ) : (
              sortedUsers.map((user) => (
                <tr key={user.id}>
                  <td data-label="ID" className="text-[#64746d]">{user.id}</td>
                  <td data-label="รหัส Provider" className="font-semibold text-[#17211d]">{user.provider_id}</td>
                  <td data-label="ชื่อผู้ใช้">{user.username || "-"}</td>
                  <td data-label="ชื่อ-นามสกุล" className="font-semibold text-[#17211d]">{user.fullname}</td>
                  <td data-label="แผนก">{user.department_name || "-"}</td>
                  <td data-label="รหัสผ่าน">
                    <span className="text-[#8b9a94]">••••••</span>
                  </td>
                  <td data-label="สถานะ">
                    <span className={`pill ${user.is_active ? "pill-pass" : "pill-muted"}`}>
                      {user.is_active ? "ใช้งาน" : "ปิดใช้งาน"}
                    </span>
                  </td>
                  <td data-label="เข้าสู่ระบบล่าสุด" className="text-[#64746d] whitespace-nowrap">{formatThaiDateTime(user.last_login)}</td>
                  <td data-label="จัดการ">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(user)}
                        className="btn btn-soft min-h-8 px-3 py-1 text-xs"
                      >
                        <Pencil size={13} aria-hidden="true" />
                        แก้ไข
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(user.id)}
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
