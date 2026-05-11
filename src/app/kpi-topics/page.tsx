"use client";

import {
  Pencil,
  Plus,
  Save,
  Target,
  Trash2,
  X,
} from "lucide-react";
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
      setError(data.error || "สร้างข้อมูลไม่สำเร็จ");
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
      setError(data.error || "อัปเดตข้อมูลไม่สำเร็จ");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("ลบหัวข้อ KPI นี้หรือไม่? หากมีผลรายงานอ้างอิงอยู่ ระบบอาจลบไม่สำเร็จ")) return;
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
    return <div className="loading-state">กำลังโหลดหัวข้อ KPI...</div>;
  }

  return (
    <div>
      <header className="page-heading">
        <div>
          <p className="eyebrow">รายการตัวชี้วัด</p>
          <div className="flex items-center gap-3">
            <span className="icon-badge">
              <Target size={18} aria-hidden="true" />
            </span>
            <h2 className="page-title">หัวข้อ KPI</h2>
          </div>
          <p className="page-subtitle">กำหนดตัวชี้วัด ผู้รับผิดชอบ และหน่วยงานเจ้าของรายงาน</p>
        </div>
      </header>

      {error && (
        <div className="alert">{error}</div>
      )}

      <form onSubmit={handleCreate} className="form-panel mb-6 space-y-3">
        <h3 className="section-title flex items-center gap-2">
          <Plus size={17} aria-hidden="true" />
          เพิ่มหัวข้อ
        </h3>
        <input
          type="text"
          placeholder="ชื่อหัวข้อ KPI"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="หน่วยงานเจ้าของ (ไม่บังคับ)"
            value={departmentOwner}
            onChange={(e) => setDepartmentOwner(e.target.value)}
          />
          <input
            type="text"
            placeholder="ผู้รับผิดชอบ (ไม่บังคับ)"
            value={userOwner}
            onChange={(e) => setUserOwner(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
        >
          <Plus size={16} aria-hidden="true" />
          เพิ่มหัวข้อ
        </button>
      </form>

      <div className="panel data-table-wrap">
        <table className="data-table text-sm">
          <thead>
            <tr>
              <th className="w-16">ID</th>
              <th>ชื่อ</th>
              <th>หน่วยงานเจ้าของ</th>
              <th>ผู้รับผิดชอบ</th>
              <th className="w-36">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {topics.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={5} className="empty-cell">ยังไม่มีหัวข้อ KPI</td>
              </tr>
            ) : (
              topics.map((t) => (
                <tr key={t.id}>
                  <td data-label="ID" className="text-[#64746d]">{t.id}</td>
                  <td data-label="ชื่อ" className="font-semibold text-[#17211d]">
                    {editingId === t.id ? (
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} className="max-w-xs" autoFocus />
                    ) : (
                      t.name
                    )}
                  </td>
                  <td data-label="หน่วยงานเจ้าของ">
                    {editingId === t.id ? (
                      <input value={editDeptOwner} onChange={(e) => setEditDeptOwner(e.target.value)} className="max-w-xs" />
                    ) : (
                      t.department_owner || "-"
                    )}
                  </td>
                  <td data-label="ผู้รับผิดชอบ">
                    {editingId === t.id ? (
                      <input value={editUserOwner} onChange={(e) => setEditUserOwner(e.target.value)} className="max-w-xs" />
                    ) : (
                      t.user_owner || "-"
                    )}
                  </td>
                  <td data-label="จัดการ">
                    {editingId === t.id ? (
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdate(t.id)} className="btn btn-save min-h-8 px-3 py-1 text-xs"><Save size={13} aria-hidden="true" />บันทึก</button>
                        <button onClick={() => { setEditingId(null); setError(""); }} className="btn btn-soft min-h-8 px-3 py-1 text-xs"><X size={13} aria-hidden="true" />ยกเลิก</button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(t)} className="btn btn-soft min-h-8 px-3 py-1 text-xs"><Pencil size={13} aria-hidden="true" />แก้ไข</button>
                        <button onClick={() => handleDelete(t.id)} className="btn btn-danger min-h-8 px-3 py-1 text-xs"><Trash2 size={13} aria-hidden="true" />ลบ</button>
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
