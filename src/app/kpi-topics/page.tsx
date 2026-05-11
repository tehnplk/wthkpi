"use client";

import { useEffect, useState } from "react";

interface Topic {
  id: number;
  name: string;
  department_owner: string | null;
  user_owner: string | null;
}

export default function KpiTopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [departmentOwner, setDepartmentOwner] = useState("");
  const [userOwner, setUserOwner] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDeptOwner, setEditDeptOwner] = useState("");
  const [editUserOwner, setEditUserOwner] = useState("");
  const [error, setError] = useState("");

  const fetchData = () => {
    fetch("/api/kpi-topics")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTopics(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    const res = await fetch("/api/kpi-topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        department_owner: departmentOwner || null,
        user_owner: userOwner || null,
      }),
    });
    if (res.ok) {
      setName("");
      setDepartmentOwner("");
      setUserOwner("");
      fetchData();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to create");
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    setError("");
    const res = await fetch(`/api/kpi-topics/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName.trim(),
        department_owner: editDeptOwner || null,
        user_owner: editUserOwner || null,
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
    if (!confirm("Delete this KPI topic? This will fail if results reference it.")) return;
    const res = await fetch(`/api/kpi-topics/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchData();
    }
  };

  const startEdit = (t: Topic) => {
    setEditingId(t.id);
    setEditName(t.name);
    setEditDeptOwner(t.department_owner || "");
    setEditUserOwner(t.user_owner || "");
    setError("");
  };

  if (loading) {
    return <div className="loading-state">Loading KPI topics...</div>;
  }

  return (
    <div>
      <header className="page-heading">
        <div>
          <p className="eyebrow">Catalog</p>
          <h2 className="page-title">KPI Topics</h2>
          <p className="page-subtitle">Define the indicators, owners, and accountability points for reports.</p>
        </div>
      </header>

      {error && (
        <div className="alert">{error}</div>
      )}

      <form onSubmit={handleCreate} className="form-panel mb-6 space-y-3">
        <h3 className="section-title">Add Topic</h3>
        <input
          type="text"
          placeholder="KPI topic name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Department owner (optional)"
            value={departmentOwner}
            onChange={(e) => setDepartmentOwner(e.target.value)}
          />
          <input
            type="text"
            placeholder="User owner (optional)"
            value={userOwner}
            onChange={(e) => setUserOwner(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
        >
          Add Topic
        </button>
      </form>

      <div className="panel data-table-wrap">
        <table className="data-table text-sm">
          <thead>
            <tr>
              <th className="w-16">ID</th>
              <th>Name</th>
              <th>Dept Owner</th>
              <th>User Owner</th>
              <th className="w-36">Actions</th>
            </tr>
          </thead>
          <tbody>
            {topics.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-cell">No KPI topics yet</td>
              </tr>
            ) : (
              topics.map((t) => (
                <tr key={t.id}>
                  <td className="text-[#64746d]">{t.id}</td>
                  <td className="font-semibold text-[#17211d]">
                    {editingId === t.id ? (
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} className="max-w-xs" autoFocus />
                    ) : (
                      t.name
                    )}
                  </td>
                  <td>
                    {editingId === t.id ? (
                      <input value={editDeptOwner} onChange={(e) => setEditDeptOwner(e.target.value)} className="max-w-xs" />
                    ) : (
                      t.department_owner || "-"
                    )}
                  </td>
                  <td>
                    {editingId === t.id ? (
                      <input value={editUserOwner} onChange={(e) => setEditUserOwner(e.target.value)} className="max-w-xs" />
                    ) : (
                      t.user_owner || "-"
                    )}
                  </td>
                  <td>
                    {editingId === t.id ? (
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdate(t.id)} className="btn btn-save min-h-8 px-3 py-1 text-xs">Save</button>
                        <button onClick={() => { setEditingId(null); setError(""); }} className="btn btn-soft min-h-8 px-3 py-1 text-xs">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(t)} className="btn btn-soft min-h-8 px-3 py-1 text-xs">Edit</button>
                        <button onClick={() => handleDelete(t.id)} className="btn btn-danger min-h-8 px-3 py-1 text-xs">Delete</button>
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
