"use client";

import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export function AppShell({
  children,
  sidebar,
}: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (isLogin) {
    return <main>{children}</main>;
  }

  const ToggleIcon = sidebarCollapsed ? ChevronRight : ChevronLeft;

  return (
    <div className={`app-shell flex ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <button
        type="button"
        className="sidebar-toggle"
        onClick={() => setSidebarCollapsed((value) => !value)}
        aria-label={sidebarCollapsed ? "Expand menu" : "Collapse menu"}
        aria-expanded={!sidebarCollapsed}
        title={sidebarCollapsed ? "Expand menu" : "Collapse menu"}
      >
        <ToggleIcon size={18} aria-hidden="true" />
      </button>
      {sidebar}
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="content-wrap">{children}</div>
      </main>
    </div>
  );
}
