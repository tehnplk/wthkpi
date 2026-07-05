"use client";

import { Flag, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/Modal";
import type { Mission } from "@/app/models/common";
import { confirmAction, notifyError, notifySuccess } from "@/lib/notice";
import { applySort, SortDir, toggleSort } from "@/lib/sort";

export default function MissionPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [editName, setEditName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState<string | null>("id");
  const [sortDir, setSortDir] = useState<SortDir | null>("asc");

  const fetchMissions = () => {
    fetch("/api/missions")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMissions(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchMissions();
  }, []);

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setEditName("");
    setError("");
  };

  const openCreate = () => {
    setEditingId(null);
    setName("");
    setError("");
    setIsFormOpen(true);
  };

  const startEdit = (mission: Mission) => {
    setEditingId(mission.id);
    setEditName(mission.name);
    setError("");
    setIsFormOpen(true);
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setError("");

    const res = await fetch("/api/missions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.replace(/\r?\n|\r/g, "").trim() }),
    });

    if (res.ok) {
      closeForm();
      fetchMissions();
      notifySuccess("เพิ่มพันธกิจสำเร็จ");
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

    const res = await fetch(`/api/missions/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.replace(/\r?\n|\r/g, "").trim() }),
    });

    if (res.ok) {
      closeForm();
      fetchMissions();
      notifySuccess("บันทึกพันธกิจสำเร็จ");
    } else {
      const data = await res.json();
      const message = data.error || "อัปเดตข้อมูลไม่สำเร็จ";
      setError(message);
      notifyError(message);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmAction(
      "ลบพันธกิจนี้หรือไม่?",
      "ข้อมูลจะถูกลบออกจากระบบ"
    );
    if (!confirmed) return;

    const res = await fetch(`/api/missions/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchMissions();
      notifySuccess("ลบพันธกิจสำเร็จ");
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

  const sortedMissions = useMemo(
    () => applySort(missions, sortBy, sortDir),
    [missions, sortBy, sortDir]
  );

  const isEditing = editingId !== null;

  if (loading) {
    return <div className="loading-state">กำลังโหลดพันธกิจ...</div>;
  }

  return (
    <div>
      <header className="page-heading">
        <div>
          <div className="flex items-center gap-3">
            <span className="icon-badge">
              <Flag size={18} aria-hidden="true" />
            </span>
            <h2 className="page-title">พันธกิจ</h2>
          </div>
        </div>
      </header>

      {error && <div className="alert">{error}</div>}

      <div className="table-toolbar">
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} aria-hidden="true" />
          เพิ่มพันธกิจ
        </button>
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        size="xl"
        title={isEditing ? "แก้ไขพันธกิจ" : "เพิ่มพันธกิจ"}
      >
        <form onSubmit={isEditing ? handleUpdate : handleCreate} className="login-form">
          <div className="form-group">
            <label htmlFor="mission-name">ชื่อพันธกิจ</label>
            <textarea
              id="mission-name"
              autoComplete="off"
              rows={3}
              value={isEditing ? editName : name}
              onChange={(event) => isEditing ? setEditName(event.target.value) : setName(event.target.value)}
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
              <th className="sortable-th" onClick={() => handleSort("name")}>ชื่อพันธกิจ</th>
              <th className="w-36">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {sortedMissions.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={3} className="empty-cell">ยังไม่มีพันธกิจ</td>
              </tr>
            ) : (
              sortedMissions.map((mission) => (
                <tr key={mission.id}>
                  <td data-label="ID" className="text-[#64746d]">{mission.id}</td>
                  <td data-label="ชื่อพันธกิจ" className="font-semibold text-[#17211d]">
                    {mission.name}
                  </td>
                  <td data-label="จัดการ">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(mission)}
                        className="btn btn-soft icon-action-btn"
                        aria-label={`แก้ไข ${mission.name}`}
                        title="แก้ไข"
                      >
                        <Pencil size={13} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(mission.id)}
                        className="btn btn-danger icon-action-btn"
                        aria-label={`ลบ ${mission.name}`}
                        title="ลบ"
                      >
                        <Trash2 size={13} aria-hidden="true" />
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
