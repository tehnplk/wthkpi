import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "wthkpi_token";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "wthkpi-jwt-secret-change-in-production"
);
const publicPaths = ["/login", "/api/auth"];
const publicExactPaths = ["/", "/dashboard", "/api/dashboard", "/kpi-results"];
const protectedPaths = ["/setting"];

function isPublic(pathname: string, method: string): boolean {
  if (pathname === "/api/kpi-results" && method === "GET") return true;
  if (pathname === "/api/kpi-results/export" && method === "GET") return true;
  if (
    ["/api/departments", "/api/kpi-types", "/api/kpi-topics"].includes(pathname) &&
    method === "GET"
  ) {
    return true;
  }
  return publicExactPaths.includes(pathname) || publicPaths.some((p) => pathname.startsWith(p));
}

function isProtected(pathname: string): boolean {
  return protectedPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function requireLogin(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

function redirectHome(request: NextRequest) {
  return NextResponse.redirect(new URL("/", request.url));
}

async function isAdmin(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (isPublic(pathname, request.method)) {
    return NextResponse.next();
  }

  if (token) {
    if (isProtected(pathname) && !(await isAdmin(token))) {
      return redirectHome(request);
    }
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
