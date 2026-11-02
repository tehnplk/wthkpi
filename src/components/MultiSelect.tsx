"use client";

import { Check, ChevronDown, Pencil, Plus, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Option {
  id: number;
  name: string;
}

interface Props {
  options: Option[];
  selected: number[];
  onChange: (ids: number[]) => void;
  placeholder?: string;
  onCreate?: (name: string) => Promise<Option | null>;
  onRename?: (id: number, name: string) => Promise<boolean>;
}

export function MultiSelect({ options, selected, onChange, placeholder = "เลือก...", onCreate, onRename }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: number) => {
    const next = selected.includes(id) ? selected.filter((v) => v !== id) : [...selected, id];
    onChange(options.filter((o) => next.includes(o.id)).map((o) => o.id));
  };

  const remove = (id: number) => {
    onChange(selected.filter((v) => v !== id));
  };

  const selectedOptions = options.filter((o) => selected.includes(o.id));

  const newName = search.trim();
  const canCreate = onCreate && newName && !options.some((o) => o.name === newName);

  const create = async () => {
    const created = await onCreate?.(newName);
    if (!created) return;
    onChange([...selected, created.id]);
    setSearch("");
  };

  const saveRename = async () => {
    const name = editText.trim();
    if (editingId === null || !name) return;
    if (await onRename?.(editingId, name)) setEditingId(null);
  };

  return (
    <div ref={containerRef} className="relative w-full text-left">
      <div
        className="flex flex-wrap items-center gap-1.5 min-h-[38px] px-2.5 py-1.5 border border-[#d5dcd8] rounded bg-white cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        {selectedOptions.length === 0 ? (
          <span className="text-[#8a9891] text-sm">{placeholder}</span>
        ) : (
          selectedOptions.map((o) => (
            <span
              key={o.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-[#e8f5ee] text-[#0b6f3c] border border-[#b4dfc4] font-medium"
            >
              {o.name}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(o.id);
                }}
                className="hover:text-[#c24141] ml-0.5 focus:outline-none"
              >
                <X size={12} />
              </button>
            </span>
          ))
        )}
        <ChevronDown
          size={14}
          className={`ml-auto text-[#8a9891] shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>

      {open && (
        <div className="absolute left-0 z-50 mt-1 w-full bg-white border border-[#d5dcd8] rounded shadow-lg text-left overflow-hidden">
          <div className="flex items-center gap-2 px-2.5 py-1.5 border-b border-[#d5dcd8]">
            <Search size={14} className="text-[#8a9891] shrink-0" />
            <input
              type="text"
              autoComplete="off"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหา..."
              className="flex-1 text-sm border-0 outline-none bg-transparent p-0 shadow-none focus:ring-0 focus:outline-none text-[#17211d]"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                if (canCreate) create();
              }}
              // touch: no autofocus, the soft keyboard eats the next tap (e.g. ยกเลิก)
              autoFocus={window.matchMedia("(pointer: fine)").matches}
            />
          </div>
          <div className="max-h-72 overflow-y-auto p-1">
            {canCreate && (
              <button
                type="button"
                onClick={create}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded hover:bg-[#f0f6f2] text-sm text-left w-full text-[#0b6f3c] font-medium"
              >
                <Plus size={15} className="shrink-0" />
                เพิ่ม &quot;{newName}&quot;
              </button>
            )}
            {filtered.length === 0 && !canCreate ? (
              <div className="px-2.5 py-2 text-sm text-[#8a9891]">ไม่พบรายการ</div>
            ) : (
              filtered.map((o) => editingId === o.id ? (
                <div key={o.id} className="flex items-center gap-1.5 px-1.5 py-1">
                  <input
                    type="text"
                    autoComplete="off"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        saveRename();
                      }
                      if (e.key === "Escape") {
                        e.stopPropagation();
                        setEditingId(null);
                      }
                    }}
                    className="flex-1 min-w-0 text-sm"
                    aria-label="แก้ไขชื่อ"
                    autoFocus
                  />
                  <button type="button" onClick={saveRename} className="btn btn-primary icon-action-btn" aria-label="บันทึกชื่อ" title="บันทึก">
                    <Check size={14} />
                  </button>
                  <button type="button" onClick={() => setEditingId(null)} className="btn btn-soft icon-action-btn" aria-label="ยกเลิกแก้ไขชื่อ" title="ยกเลิก">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div key={o.id} className="flex items-center gap-1 rounded hover:bg-[#f0f6f2]">
                  <label className="flex flex-1 items-center gap-2.5 px-2.5 py-1.5 cursor-pointer text-sm text-left select-none">
                    <input
                      type="checkbox"
                      checked={selected.includes(o.id)}
                      onChange={() => toggle(o.id)}
                      className="w-4 h-4 shrink-0 accent-[#0f8f72] cursor-pointer"
                    />
                    <span className="text-[#17211d] font-normal">{o.name}</span>
                  </label>
                  {onRename && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(o.id);
                        setEditText(o.name);
                      }}
                      className="shrink-0 p-2 text-[#8a9891] hover:text-[#17211d]"
                      aria-label={`แก้ไข ${o.name}`}
                      title="แก้ไขชื่อ"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
