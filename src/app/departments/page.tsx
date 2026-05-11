"use client";

import { useEffect, useState } from "react";

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
  const [error, setError] = useState("");

  const fetchDepartments = () => {
    fetch("/api/departments")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDepartments(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    const res = await fetch("/api/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (res.ok) {
      setName("");
      fetchDepartments();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to create");
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    setError("");
    const res = await fetch(`/api/departments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    });
    if (res.ok) {
      setEditingId(null);
      setEditName("");
      fetchDepartments();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to update");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this department?")) return;
    const res = await fetch(`/api/departments/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchDepartments();
    }
  };

  const startEdit = (dep: Department) => {
    setEditingId(dep.id);
    setEditName(dep.name);
    setError("");
  };

  if (loading) {
    return <div className="loading-state">Loading departments...</div>;
  }

  return (
    <div>
      <header className="page-heading">
        <div>
          <p className="eyebrow">Organization</p>
          <h2 className="page-title">Departments</h2>
          <p className="page-subtitle">Manage department names used by users and KPI ownership.</p>
        </div>
      </header>

      {error && (
        <div className="alert">{error}</div>
      )}

      <form onSubmit={handleCreate} className="form-panel mb-6 flex flex-col sm:flex-row gap-2 max-w-xl">
        <input
          type="text"
          placeholder="Department name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1"
          required
        />
        <button
          type="submit"
          className="btn btn-primary shrink-0"
        >
          Add
        </button>
      </form>

      <div className="panel data-table-wrap">
        <table className="data-table text-sm">
          <thead>
            <tr>
              <th className="w-20">ID</th>
              <th>Name</th>
              <th className="w-36">Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.length === 0 ? (
              <tr>
                <td colSpan={3} className="empty-cell">No departments yet</td>
              </tr>
            ) : (
              departments.map((dep) => (
                <tr key={dep.id}>
                  <td className="text-[#64746d]">{dep.id}</td>
                  <td className="font-semibold text-[#17211d]">
                    {editingId === dep.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="max-w-xs"
                        autoFocus
                      />
                    ) : (
                      dep.name
                    )}
                  </td>
                  <td>
                    {editingId === dep.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdate(dep.id)}
                          className="btn btn-save min-h-8 px-3 py-1 text-xs"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => { setEditingId(null); setError(""); }}
                          className="btn btn-soft min-h-8 px-3 py-1 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(dep)}
                          className="btn btn-soft min-h-8 px-3 py-1 text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(dep.id)}
                          className="btn btn-danger min-h-8 px-3 py-1 text-xs"
                        >
                          Delete
                        </button>
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
