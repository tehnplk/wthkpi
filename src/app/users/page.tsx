"use client";

import { useEffect, useState } from "react";

interface User {
  id: number;
  provider_id: string;
  fullname: string;
  department_id: number | null;
  department_name: string | null;
  is_active: boolean;
  last_login: string | null;
}

interface Department {
  id: number;
  name: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [providerId, setProviderId] = useState("");
  const [fullname, setFullname] = useState("");
  const [departmentId, setDepartmentId] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editProviderId, setEditProviderId] = useState("");
  const [editFullname, setEditFullname] = useState("");
  const [editDepartmentId, setEditDepartmentId] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);

  const fetchData = () => {
    Promise.all([
      fetch("/api/users").then((r) => r.json()),
      fetch("/api/departments").then((r) => r.json()),
    ]).then(([usersData, deptsData]) => {
      if (Array.isArray(usersData)) setUsers(usersData);
      if (Array.isArray(deptsData)) setDepartments(deptsData);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerId.trim() || !fullname.trim()) return;
    setError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider_id: providerId.trim(),
        fullname: fullname.trim(),
        department_id: departmentId ? Number(departmentId) : null,
        is_active: true,
      }),
    });
    if (res.ok) {
      setProviderId("");
      setFullname("");
      setDepartmentId("");
      fetchData();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to create");
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editProviderId.trim() || !editFullname.trim()) return;
    setError("");
    const res = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider_id: editProviderId.trim(),
        fullname: editFullname.trim(),
        department_id: editDepartmentId ? Number(editDepartmentId) : null,
        is_active: editIsActive,
      }),
    });
    if (res.ok) {
      setEditingId(null);
      fetchData();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to update");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this user?")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) fetchData();
  };

  const startEdit = (u: User) => {
    setEditingId(u.id);
    setEditProviderId(u.provider_id);
    setEditFullname(u.fullname);
    setEditDepartmentId(u.department_id ? String(u.department_id) : "");
    setEditIsActive(u.is_active);
    setError("");
  };

  if (loading) {
    return <div className="loading-state">Loading users...</div>;
  }

  return (
    <div>
      <header className="page-heading">
        <div>
          <p className="eyebrow">Access</p>
          <h2 className="page-title">Users</h2>
          <p className="page-subtitle">Maintain report users, department assignment, and active status.</p>
        </div>
      </header>

      {error && (
        <div className="alert">{error}</div>
      )}

      <form onSubmit={handleCreate} className="form-panel mb-6 space-y-3">
        <h3 className="section-title">Add User</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input type="text" placeholder="Provider ID" value={providerId} onChange={(e) => setProviderId(e.target.value)} required />
          <input type="text" placeholder="Full name" value={fullname} onChange={(e) => setFullname(e.target.value)} required />
        </div>
        <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
          <option value="">No department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary">
          Add User
        </button>
      </form>

      <div className="panel data-table-wrap">
        <table className="data-table text-sm">
          <thead>
            <tr>
              <th className="w-16">ID</th>
              <th>Provider ID</th>
              <th>Full Name</th>
              <th>Department</th>
              <th>Active</th>
              <th>Last Login</th>
              <th className="w-36">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-cell">No users yet</td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td className="text-[#64746d]">{u.id}</td>
                  <td className="font-semibold text-[#17211d]">
                    {editingId === u.id ? (
                      <input value={editProviderId} onChange={(e) => setEditProviderId(e.target.value)} className="max-w-[160px]" autoFocus />
                    ) : u.provider_id}
                  </td>
                  <td className="font-semibold text-[#17211d]">
                    {editingId === u.id ? (
                      <input value={editFullname} onChange={(e) => setEditFullname(e.target.value)} className="max-w-[160px]" />
                    ) : u.fullname}
                  </td>
                  <td>
                    {editingId === u.id ? (
                      <select value={editDepartmentId} onChange={(e) => setEditDepartmentId(e.target.value)} className="max-w-[160px]">
                        <option value="">None</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    ) : (
                      u.department_name || "-"
                    )}
                  </td>
                  <td>
                    {editingId === u.id ? (
                      <select value={editIsActive ? "1" : "0"} onChange={(e) => setEditIsActive(e.target.value === "1")} className="max-w-[90px]">
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                      </select>
                    ) : (
                      <span className={`pill ${u.is_active ? "pill-pass" : "pill-muted"}`}>
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    )}
                  </td>
                  <td className="text-[#64746d] whitespace-nowrap">{u.last_login || "-"}</td>
                  <td>
                    {editingId === u.id ? (
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdate(u.id)} className="btn btn-save min-h-8 px-3 py-1 text-xs">Save</button>
                        <button onClick={() => { setEditingId(null); setError(""); }} className="btn btn-soft min-h-8 px-3 py-1 text-xs">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(u)} className="btn btn-soft min-h-8 px-3 py-1 text-xs">Edit</button>
                        <button onClick={() => handleDelete(u.id)} className="btn btn-danger min-h-8 px-3 py-1 text-xs">Delete</button>
                      </div>
                    )}
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
