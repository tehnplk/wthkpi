"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, User } from "lucide-react";

interface UserInfo {
  id: number;
  fullname: string;
  username: string | null;
  department_id: number | null;
  department_name: string | null;
  role: string;
}

export function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setUser(data))
      .catch(() => {});
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const roleLabel = user?.role === "admin" ? "admin" : "user";

  if (!user) {
    return (
      <div className="user-menu">
        <a href="/login" className="btn btn-primary btn-login text-sm w-full" aria-label="เข้าสู่ระบบ">
          <LogIn size={14} aria-hidden="true" />
          <span className="login-label">เข้าสู่ระบบ</span>
        </a>
      </div>
    );
  }

  return (
    <div className="user-menu">
      <div className="user-info">
        <User size={15} />
        <div className="user-profile-text">
          <span className="user-name">{user.fullname}</span>
          <span className="user-meta">
            <span>{user.department_name || "ไม่ระบุแผนก"}</span>
            <span className="user-role-badge">{roleLabel}</span>
          </span>
        </div>
      </div>
      <button
        className="btn btn-soft btn-logout"
        onClick={handleLogout}
        disabled={loggingOut}
      >
        <LogOut size={14} />
        <span className="logout-label">ออกจากระบบ</span>
      </button>
    </div>
  );
}
