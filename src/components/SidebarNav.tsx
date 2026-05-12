"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Target,
  ClipboardCheck,
  Building2,
  Users,
  Settings,
  ChevronDown,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "จัดการระบบ",
    icon: Settings,
    items: [
      { href: "/setting/departments", label: "แผนก", icon: Building2 },
      { href: "/setting/users", label: "ผู้ใช้", icon: Users },
      { href: "/setting/kpi-topics", label: "ตัวชี้วัด", icon: Target },
    ],
  },
];

export function SidebarNav() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const toggleGroup = (label: string) => {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <nav className="flex flex-col gap-0 px-3 pb-4 flex-1">
      <Link
        href="/"
        className={`nav-link flex items-center gap-2.5 px-3 py-2 text-sm font-medium ${
          isActive("/") ? "nav-link-active" : ""
        }`}
      >
        <LayoutDashboard size={18} strokeWidth={2} aria-hidden="true" />
        <span className="nav-label">แดชบอร์ด</span>
      </Link>

      <Link
        href="/kpi-results"
        className={`nav-link flex items-center gap-2.5 px-3 py-2 text-sm font-medium ${
          isActive("/kpi-results") ? "nav-link-active" : ""
        }`}
      >
        <ClipboardCheck size={18} strokeWidth={2} aria-hidden="true" />
        <span className="nav-label">ผลงานตัวชี้วัด</span>
      </Link>

      {navGroups.map((group) => {
        const GroupIcon = group.icon;
        const isGroupActive = group.items.some((item) => isActive(item.href));
        const isGroupExpanded = expanded[group.label] ?? isGroupActive;
        return (
          <div key={group.label}>
            <button
              type="button"
              className="nav-group-header flex items-center gap-2.5 px-3 py-2 text-sm font-medium"
              onClick={() => toggleGroup(group.label)}
            >
              <GroupIcon size={16} strokeWidth={2} aria-hidden="true" />
              <span className="nav-label flex items-center gap-1.5 flex-1 min-w-0">
                <span>{group.label}</span>
                <ChevronDown
                  size={13}
                  strokeWidth={2}
                  className={`nav-group-chevron ${isGroupExpanded ? "nav-group-chevron-open" : ""}`}
                />
              </span>
            </button>
            {expanded[group.label] && (
              <div className="nav-group-items">
                {group.items.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`nav-link nav-sub-link flex items-center gap-2.5 px-3 py-1.5 text-sm font-medium ${
                        isActive(item.href) ? "nav-link-active" : ""
                      }`}
                    >
                      <ItemIcon size={15} strokeWidth={2} aria-hidden="true" />
                      <span className="nav-label">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
