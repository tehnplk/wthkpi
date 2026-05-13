import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BarChart3 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SidebarNav } from "@/components/SidebarNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import "./globals.css";
import "sweetalert2/dist/sweetalert2.min.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sidebar = (
    <aside className="sidebar shrink-0 flex flex-col">
      <div className="px-4 py-4 border-b border-[var(--line)]">
        <div className="flex items-center gap-3">
          <span className="brand-mark">
            <BarChart3 size={20} aria-hidden="true" />
          </span>
          <h1 className="text-lg font-bold text-[var(--foreground)] leading-snug">WTH</h1>
        </div>
      </div>
      <SidebarNav />
      <div className="px-3 pb-4">
        <UserMenu />
      </div>
    </aside>
  );

  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { try { const key = "wthkpi-theme"; const saved = localStorage.getItem(key); const theme = saved === "dark" || saved === "light" ? saved : (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"); document.documentElement.dataset.theme = theme; document.documentElement.style.colorScheme = theme; } catch { document.documentElement.dataset.theme = "light"; } })();`,
          }}
        />
      </head>
      <body>
        <ThemeToggle />
        <AppShell sidebar={sidebar}>{children}</AppShell>
      </body>
    </html>
  );
}
