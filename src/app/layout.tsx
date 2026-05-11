import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  BarChart3,
  Building2,
  ClipboardCheck,
  LayoutDashboard,
  Target,
  Users,
} from "lucide-react";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ระบบรายงาน KPI",
  description: "ระบบรายงานและจัดการ KPI",
};

const navLinks = [
  { href: "/", label: "แดชบอร์ด", icon: LayoutDashboard },
  { href: "/kpi-topics", label: "หัวข้อ KPI", icon: Target },
  { href: "/kpi-results", label: "ผล KPI", icon: ClipboardCheck },
  { href: "/departments", label: "แผนก", icon: Building2 },
  { href: "/users", label: "ผู้ใช้", icon: Users },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body>
        <div className="app-shell flex">
          <aside className="sidebar w-64 shrink-0 flex flex-col">
          <div className="px-5 py-5">
            <div className="flex items-center gap-3">
              <span className="brand-mark">
                <BarChart3 size={20} aria-hidden="true" />
              </span>
              <div>
                <p className="eyebrow">WTH KPI</p>
                <h1 className="mt-1 text-xl font-bold text-[#17211d]">ระบบรายงาน</h1>
              </div>
            </div>
          </div>
          <nav className="flex flex-col gap-1 px-3 pb-4 flex-1">
            {navLinks.map((link) => {
              const Icon = link.icon;

              return (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold"
              >
                <Icon size={17} strokeWidth={2.1} aria-hidden="true" />
                {link.label}
              </Link>
              );
            })}
          </nav>
        </aside>
          <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
            <div className="content-wrap">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
