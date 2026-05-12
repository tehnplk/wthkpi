import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "wthkpi_token";
const publicPaths = ["/login", "/api/auth"];
const publicExactPaths = ["/", "/api/dashboard", "/kpi-results"];
const protectedPaths = ["/setting"];

function isPublic(pathname: string, method: string): boolean {
  if (pathname === "/api/kpi-results" && method === "GET") return true;
  return publicExactPaths.includes(pathname) || publicPaths.some((p) => pathname.startsWith(p));
}

function isProtected(pathname: string): boolean {
  return protectedPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function requireLogin(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (isPublic(pathname, request.method)) {
    return NextResponse.next();
  }

  if (token) {
    return NextResponse.next();
  }

  if (isProtected(pathname)) {
    return requireLogin(request);
  }

  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  return requireLogin(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|file.svg|globe.svg|next.svg|vercel.svg|window.svg).*)",
  ],
};
