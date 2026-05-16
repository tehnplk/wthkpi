"use client";

import { usePathname } from "next/navigation";
import { BarChart3, ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    queueMicrotask(() => setMobileMenuOpen(false));
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle("mobile-menu-open", mobileMenuOpen);
    return () => document.body.classList.remove("mobile-menu-open");
  }, [mobileMenuOpen]);

  if (isLogin) {
    return <main>{children}</main>;
  }

  const ToggleIcon = sidebarCollapsed ? ChevronRight : ChevronLeft;

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    const isHorizontalSwipe = Math.abs(deltaX) > 64 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4;

    if (!isHorizontalSwipe) return;
    if (!mobileMenuOpen && start.x <= 32 && deltaX > 0) setMobileMenuOpen(true);
    if (mobileMenuOpen && deltaX < 0) setMobileMenuOpen(false);
  };

  return (
    <div
      className={`app-shell flex ${sidebarCollapsed ? "sidebar-collapsed" : ""} ${mobileMenuOpen ? "mobile-menu-active" : ""}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <header className="mobile-app-bar">
        <div className="mobile-brand">
          <span className="brand-mark">
            <BarChart3 size={19} aria-hidden="true" />
          </span>
          <span>WTH</span>
        </div>
        <button
          type="button"
          className="mobile-menu-button"
          onClick={() => setMobileMenuOpen((value) => !value)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
        >
          {mobileMenuOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
        </button>
      </header>
      <button
        type="button"
        className="mobile-menu-backdrop"
        onClick={() => setMobileMenuOpen(false)}
        aria-label="Close menu"
      />
      <div id="mobile-navigation" className="sidebar-shell">
        <button
          type="button"
          className="mobile-panel-close"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close menu"
        >
          <X size={20} aria-hidden="true" />
        </button>
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
      </div>
      <main className="app-main min-w-0 flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="content-wrap">{children}</div>
      </main>
    </div>
  );
}
