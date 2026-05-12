import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({
    id: session.id,
    fullname: session.fullname,
    username: session.username,
    department_id: session.department_id,
    role: session.role,
  });
}
