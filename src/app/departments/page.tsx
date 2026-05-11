"use client";

import { Building2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
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
      setError(data.error || "สร้างข้อมูลไม่สำเร็จ");
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
      setError(data.error || "อัปเดตข้อมูลไม่สำเร็จ");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("ลบแผนกนี้หรือไม่?")) return;
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
    return <div className="loading-state">กำลังโหลดแผนก...</div>;
  }

  return (
    <div>
      <header className="page-heading">
        <div>
          <p className="eyebrow">โครงสร้างองค์กร</p>
          <div className="flex items-center gap-3">
            <span className="icon-badge">
              <Building2 size={18} aria-hidden="true" />
            </span>
            <h2 className="page-title">แผนก</h2>
          </div>
          <p className="page-subtitle">จัดการชื่อแผนกสำหรับผู้ใช้และการกำหนดเจ้าของ KPI</p>
        </div>
      </header>

      {error && (
        <div className="alert">{error}</div>
      )}

      <form onSubmit={handleCreate} className="form-panel mb-6 flex flex-col sm:flex-row gap-2 max-w-xl">
        <input
          type="text"
          placeholder="ชื่อแผนก"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1"
          required
        />
        <button
          type="submit"
          className="btn btn-primary shrink-0"
        >
          <Plus size={16} aria-hidden="true" />
          เพิ่ม
        </button>
      </form>

      <div className="panel data-table-wrap">
        <table className="data-table text-sm">
          <thead>
            <tr>
              <th className="w-20">ID</th>
              <th>ชื่อ</th>
              <th className="w-36">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {departments.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={3} className="empty-cell">ยังไม่มีแผนก</td>
              </tr>
            ) : (
              departments.map((dep) => (
                <tr key={dep.id}>
                  <td data-label="ID" className="text-[#64746d]">{dep.id}</td>
                  <td data-label="ชื่อ" className="font-semibold text-[#17211d]">
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
                  <td data-label="จัดการ">
                    {editingId === dep.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdate(dep.id)}
                          className="btn btn-save min-h-8 px-3 py-1 text-xs"
                        >
                          <Save size={13} aria-hidden="true" />
                          บันทึก
                        </button>
                        <button
                          onClick={() => { setEditingId(null); setError(""); }}
                          className="btn btn-soft min-h-8 px-3 py-1 text-xs"
                        >
                          <X size={13} aria-hidden="true" />
                          ยกเลิก
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(dep)}
                          className="btn btn-soft min-h-8 px-3 py-1 text-xs"
                        >
                          <Pencil size={13} aria-hidden="true" />
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(dep.id)}
                          className="btn btn-danger min-h-8 px-3 py-1 text-xs"
                        >
                          <Trash2 size={13} aria-hidden="true" />
                          ลบ
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
