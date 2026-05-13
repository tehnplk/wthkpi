"use client";

import { Pencil, Plus, Save, Tags, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/Modal";
import { confirmAction, notifyError, notifySuccess } from "@/lib/notice";
import { applySort, SortDir, toggleSort } from "@/lib/sort";

interface KpiType {
  id: number;
  type: string;
}

const kpiTypeBadgeClass = (kpiTypeId: number | null) => {
  if (kpiTypeId == null) return "pill-kpi-type";
  return `pill-kpi-t${kpiTypeId % 6}`;
};

export default function KpiTypePage() {
  const [kpiTypes, setKpiTypes] = useState<KpiType[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("");
  const [editType, setEditType] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir | null>(null);

  const fetchKpiTypes = () => {
    fetch("/api/kpi-types")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setKpiTypes(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchKpiTypes();
  }, []);

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setEditType("");
    setError("");
  };

  const openCreate = () => {
    setEditingId(null);
    setType("");
    setError("");
    setIsFormOpen(true);
  };

  const startEdit = (kpiType: KpiType) => {
    setEditingId(kpiType.id);
    setEditType(kpiType.type);
    setError("");
    setIsFormOpen(true);
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!type.trim()) return;
    setError("");

    const res = await fetch("/api/kpi-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: type.trim() }),
    });

    if (res.ok) {
      closeForm();
      fetchKpiTypes();
      notifySuccess("เพิ่มประเภทตัวชี้วัดสำเร็จ");
    } else {
      const data = await res.json();
      const message = data.error || "สร้างข้อมูลไม่สำเร็จ";
      setError(message);
      notifyError(message);
    }
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingId || !editType.trim()) return;
    setError("");

    const res = await fetch(`/api/kpi-types/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: editType.trim() }),
    });

    if (res.ok) {
      closeForm();
      fetchKpiTypes();
      notifySuccess("บันทึกประเภทตัวชี้วัดสำเร็จ");
    } else {
      const data = await res.json();
      const message = data.error || "อัปเดตข้อมูลไม่สำเร็จ";
      setError(message);
      notifyError(message);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmAction(
      "ลบประเภทตัวชี้วัดนี้หรือไม่?",
      "หากมีตัวชี้วัดใช้งานประเภทนี้อยู่ ระบบจะไม่อนุญาตให้ลบ"
    );
    if (!confirmed) return;

    const res = await fetch(`/api/kpi-types/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchKpiTypes();
      notifySuccess("ลบประเภทตัวชี้วัดสำเร็จ");
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

  const sortedKpiTypes = useMemo(
    () => applySort(kpiTypes, sortBy, sortDir),
    [kpiTypes, sortBy, sortDir]
  );

  const isEditing = editingId !== null;

  if (loading) {
    return <div className="loading-state">กำลังโหลดประเภทตัวชี้วัด...</div>;
  }

  return (
    <div>
      <header className="page-heading">
        <div>
          <div className="flex items-center gap-3">
            <span className="icon-badge">
              <Tags size={18} aria-hidden="true" />
            </span>
            <h2 className="page-title">ประเภทตัวชี้วัด</h2>
          </div>
        </div>
      </header>

      {error && <div className="alert">{error}</div>}

      <div className="table-toolbar">
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} aria-hidden="true" />
          เพิ่มประเภทตัวชี้วัด
        </button>
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        size="sm"
        title={isEditing ? "แก้ไขประเภทตัวชี้วัด" : "เพิ่มประเภทตัวชี้วัด"}
      >
        <form onSubmit={isEditing ? handleUpdate : handleCreate} className="login-form">
          <div className="form-group">
            <label htmlFor="kpi-type-name">ประเภทตัวชี้วัด</label>
            <input
              id="kpi-type-name"
              type="text"
              value={isEditing ? editType : type}
              onChange={(event) => isEditing ? setEditType(event.target.value) : setType(event.target.value)}
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
              <th className="w-20 sortable-th" onClick={() => handleSort("id")}>ID</th>
              <th className="sortable-th" onClick={() => handleSort("type")}>ประเภทตัวชี้วัด</th>
              <th className="w-36">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {sortedKpiTypes.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={3} className="empty-cell">ยังไม่มีประเภทตัวชี้วัด</td>
              </tr>
            ) : (
              sortedKpiTypes.map((kpiType) => (
                <tr key={kpiType.id}>
                  <td data-label="ID" className="text-[#64746d]">{kpiType.id}</td>
                  <td data-label="ประเภทตัวชี้วัด" className="font-semibold text-[#17211d]">
                    <span className={`pill pill-kpi-type-badge ${kpiTypeBadgeClass(kpiType.id)}`}>{kpiType.type}</span>
                  </td>
                  <td data-label="จัดการ">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(kpiType)}
                        className="btn btn-soft min-h-8 px-3 py-1 text-xs"
                      >
                        <Pencil size={13} aria-hidden="true" />
                        แก้ไข
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(kpiType.id)}
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
