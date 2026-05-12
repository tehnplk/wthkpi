"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";

interface UserInfo {
  id: number;
  fullname: string;
  username: string;
  department_id: number | null;
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

  if (!user) {
    return (
      <div className="user-menu">
        <a href="/login" className="btn btn-primary text-sm w-full">
          เข้าสู่ระบบ
        </a>
      </div>
    );
  }

  return (
    <div className="user-menu">
      <div className="user-info">
        <User size={15} />
        <span className="user-name">{user.fullname}</span>
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
