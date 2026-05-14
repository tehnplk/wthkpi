import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await db("users")
    .leftJoin("department", "users.department_id", "department.id")
    .select(
      "users.id",
      "users.fullname",
      "users.username",
      "users.department_id",
      "users.role",
      "department.name as department_name"
    )
    .where("users.id", session.id)
    .where("users.is_active", true)
    .first();

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    id: user.id,
    fullname: user.fullname,
    username: user.username,
    department_id: user.department_id,
    department_name: user.department_name ?? null,
    role: user.role || "user",
  });
}
