import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "KPI Report System",
  description: "KPI Reporting and Management System",
};

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/kpi-topics", label: "KPI Topics" },
  { href: "/kpi-results", label: "KPI Results" },
  { href: "/departments", label: "Departments" },
  { href: "/users", label: "Users" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body>
        <div className="app-shell flex">
          <aside className="sidebar w-64 shrink-0 flex flex-col">
          <div className="px-5 py-5">
            <p className="eyebrow">WTH KPI</p>
            <h1 className="mt-1 text-xl font-bold text-[#17211d]">Report System</h1>
          </div>
          <nav className="flex flex-col gap-1 px-3 pb-4 flex-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link px-3 py-2.5 text-sm font-semibold"
              >
                {link.label}
              </Link>
            ))}
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
