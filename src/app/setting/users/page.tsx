"use client";

import { Check, Pencil, Trash2, UserPlus, UsersRound, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Department } from "@/app/models/common";
import type { User } from "@/app/models/user";
import { confirmAction, notifyError, notifySuccess } from "@/lib/notice";
import { applySort, SortDir, toggleSort } from "@/lib/sort";

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
  const [sortBy, setSortBy] = useState<string | null>("id");
  const [sortDir, setSortDir] = useState<SortDir | null>("asc");
  const [filterDepartmentId, setFilterDepartmentId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRole, setFilterRole] = useState("");

  const [providerId, setProviderId] = useState("");
  const [fullname, setFullname] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [departmentId, setDepartmentId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);

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
    setRole("user");
    setDepartmentId("");
    setIsActive(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  const openCreate = () => {
    setEditingId(null);
    resetForm();
    setError("");
    setIsAdding(true);
  };

  const cancelAdd = () => {
    setIsAdding(false);
    resetForm();
  };

  const startEdit = (user: User) => {
    setIsAdding(false);
    setEditingId(user.id);
    setProviderId(user.provider_id);
    setFullname(user.fullname);
    setUsername(user.username || "");
    setPassword("");
    setRole(user.role || "user");
    setDepartmentId(user.department_id ? String(user.department_id) : "");
    setIsActive(user.is_active);
    setError("");
  };

  const buildPayload = () => {
    const body: Record<string, unknown> = {
      provider_id: providerId.trim(),
      fullname: fullname.trim(),
      role,
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
      if (editingId) {
        cancelEdit();
      } else {
        setIsAdding(false);
        resetForm();
      }
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

  const displayedUsers = users.filter((user) => {
    const matchesDepartment = !filterDepartmentId || user.department_id === Number(filterDepartmentId);
    const matchesStatus = !filterStatus || user.is_active === (filterStatus === "active");
    const matchesRole = !filterRole || (user.role || "user") === filterRole;
    return matchesDepartment && matchesStatus && matchesRole;
  });

  const sortedUsers = useMemo(
    () => applySort(displayedUsers, sortBy, sortDir),
    [displayedUsers, sortBy, sortDir]
  );

  const clearFilters = () => {
    setFilterDepartmentId("");
    setFilterStatus("");
    setFilterRole("");
  };

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
        </div>
      </header>

      {error && <div className="alert">{error}</div>}

      <div className="user-filter-panel">
        <div className="user-filter-grid">
          <div className="filter-controls">
            <label className="result-filter-field">
              <select value={filterDepartmentId} onChange={(event) => setFilterDepartmentId(event.target.value)}>
                <option value="">ทุกแผนก/ฝ่าย/กลุ่มงาน</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>{department.name}</option>
                ))}
              </select>
            </label>
            <label className="result-filter-field">
              <select value={filterRole} onChange={(event) => setFilterRole(event.target.value)}>
                <option value="">สิทธิใช้งาน</option>
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </label>
            <label className="result-filter-field">
              <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
                <option value="">ทุกสถานะ</option>
                <option value="active">ใช้งาน</option>
                <option value="inactive">ปิดใช้งาน</option>
              </select>
            </label>
            {(filterDepartmentId || filterStatus || filterRole) && (
              <button type="button" className="btn btn-soft result-filter-clear" onClick={clearFilters}>
                <X size={14} aria-hidden="true" />
                ล้าง
              </button>
            )}
          </div>
          <div className="filter-actions">
            <button type="button" className="btn btn-primary topic-filter-create" onClick={openCreate}>
              <UserPlus size={16} aria-hidden="true" />
              เพิ่มผู้ใช้
            </button>
          </div>
        </div>
      </div>

      <form id="user-form" onSubmit={handleSave} />

      <div className="panel data-table-wrap">
        <table className="data-table text-sm">
          <thead>
            <tr>
              <th className="w-16 sortable-th" onClick={() => handleSort("id")}>ID</th>
              <th className="sortable-th" onClick={() => handleSort("fullname")}>ชื่อ-นามสกุล</th>
              <th className="sortable-th" onClick={() => handleSort("department_name")}>แผนก</th>
              <th className="sortable-th" onClick={() => handleSort("provider_id")}>รหัส Provider</th>
              <th className="sortable-th" onClick={() => handleSort("username")}>ชื่อผู้ใช้</th>
              <th>รหัสผ่าน</th>
              <th className="sortable-th" onClick={() => handleSort("role")}>สิทธิใช้งาน</th>
              <th className="sortable-th" onClick={() => handleSort("is_active")}>สถานะ</th>
              <th className="sortable-th" onClick={() => handleSort("last_login")}>เข้าสู่ระบบล่าสุด</th>
              <th className="w-20">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {isAdding && (
                <tr className="inline-edit-row">
                  <td className="text-[#64746d]"></td>
                  <td>
                    <input type="text" form="user-form" value={fullname} onChange={(e) => setFullname(e.target.value)} autoFocus required />
                  </td>
                  <td>
                    <select form="user-form" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                      <option value="">ไม่มีแผนก</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input type="text" form="user-form" value={providerId} onChange={(e) => setProviderId(e.target.value)} required />
                  </td>
                  <td>
                    <input type="text" form="user-form" value={username} onChange={(e) => setUsername(e.target.value)} />
                  </td>
                  <td>
                    <input type="password" form="user-form" placeholder="รหัสผ่าน" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </td>
                  <td>
                    <select form="user-form" value={role} onChange={(e) => setRole(e.target.value)}>
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td>
                    <select form="user-form" value={isActive ? "1" : "0"} onChange={(e) => setIsActive(e.target.value === "1")}>
                      <option value="1">ใช้งาน</option>
                      <option value="0">ปิดใช้งาน</option>
                    </select>
                  </td>
                  <td></td>
                  <td>
                    <div className="flex gap-2">
                      <button type="submit" form="user-form" className="btn btn-primary icon-action-btn" title="บันทึก">
                        <Check size={13} aria-hidden="true" />
                      </button>
                      <button type="button" className="btn btn-soft icon-action-btn" onClick={cancelAdd} title="ยกเลิก">
                        <X size={13} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
            )}
            {sortedUsers.length === 0 && !isAdding ? (
              <tr className="empty-row">
                <td colSpan={10} className="empty-cell">ยังไม่มีผู้ใช้</td>
              </tr>
            ) : (
              sortedUsers.map((user) =>
                user.id === editingId ? (
                    <tr key={user.id} className="inline-edit-row">
                      <td className="text-[#64746d]">{user.id}</td>
                      <td>
                        <input type="text" form="user-form" value={fullname} onChange={(e) => setFullname(e.target.value)} autoFocus required />
                      </td>
                      <td>
                        <select form="user-form" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                          <option value="">ไม่มีแผนก</option>
                          {departments.map((d) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input type="text" form="user-form" value={providerId} onChange={(e) => setProviderId(e.target.value)} required />
                      </td>
                      <td>
                        <input type="text" form="user-form" value={username} onChange={(e) => setUsername(e.target.value)} />
                      </td>
                      <td>
                        <input type="password" form="user-form" placeholder="เว้นว่างถ้าไม่เปลี่ยน" value={password} onChange={(e) => setPassword(e.target.value)} />
                      </td>
                      <td>
                        <select form="user-form" value={role} onChange={(e) => setRole(e.target.value)}>
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td>
                        <select form="user-form" value={isActive ? "1" : "0"} onChange={(e) => setIsActive(e.target.value === "1")}>
                          <option value="1">ใช้งาน</option>
                          <option value="0">ปิดใช้งาน</option>
                        </select>
                      </td>
                      <td className="text-[#64746d] whitespace-nowrap">{formatThaiDateTime(user.last_login)}</td>
                      <td>
                        <div className="flex gap-2">
                          <button type="submit" form="user-form" className="btn btn-primary icon-action-btn" title="บันทึก">
                            <Check size={13} aria-hidden="true" />
                          </button>
                          <button type="button" className="btn btn-soft icon-action-btn" onClick={cancelEdit} title="ยกเลิก">
                            <X size={13} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                ) : (
                  <tr key={user.id} onClick={() => startEdit(user)} className="cursor-pointer">
                    <td data-label="ID" className="text-[#64746d]">{user.id}</td>
                    <td data-label="ชื่อ-นามสกุล" className="font-semibold text-[#17211d]">{user.fullname}</td>
                    <td data-label="แผนก">{user.department_name || "-"}</td>
                    <td data-label="รหัส Provider" className="font-semibold text-[#17211d]">{user.provider_id}</td>
                    <td data-label="ชื่อผู้ใช้">{user.username || "-"}</td>
                    <td data-label="รหัสผ่าน">
                      <span className="text-[#8b9a94]">••••••</span>
                    </td>
                    <td data-label="Role">
                      <span className={`pill ${user.role === "admin" ? "pill-kpi-t1" : "pill-muted"}`}>
                        {user.role || "user"}
                      </span>
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
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            startEdit(user);
                          }}
                          className="btn btn-soft icon-action-btn"
                          aria-label={`แก้ไข ${user.fullname}`}
                          title="แก้ไข"
                        >
                          <Pencil size={13} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleDelete(user.id); }}
                          className="btn btn-danger icon-action-btn"
                          aria-label={`ลบ ${user.fullname}`}
                          title="ลบ"
                        >
                          <Trash2 size={13} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
