"use client";

import { ChevronDown, Search, X } from "lucide-react";
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
}

export function MultiSelect({ options, selected, onChange, placeholder = "เลือก..." }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
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
    onChange(
      selected.includes(id) ? selected.filter((v) => v !== id) : [...selected, id]
    );
  };

  const remove = (id: number) => {
    onChange(selected.filter((v) => v !== id));
  };

  const selectedOptions = options.filter((o) => selected.includes(o.id));

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
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="px-2.5 py-2 text-sm text-[#8a9891]">ไม่พบรายการ</div>
            ) : (
              filtered.map((o) => (
                <label
                  key={o.id}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 rounded cursor-pointer hover:bg-[#f0f6f2] text-sm text-left w-full select-none"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(o.id)}
                    onChange={() => toggle(o.id)}
                    className="w-4 h-4 shrink-0 accent-[#0f8f72] cursor-pointer"
                  />
                  <span className="text-[#17211d] font-normal">{o.name}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
