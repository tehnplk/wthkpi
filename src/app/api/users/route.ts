import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { hashPassword } from "@/lib/password";

export async function GET() {
  try {
    const users = await db("users")
      .leftJoin("department", "users.department_id", "department.id")
      .select(
        "users.id",
        "users.provider_id",
        "users.fullname",
        "users.username",
        "users.role",
        "users.department_id",
        "users.is_active",
        db.raw("DATE_FORMAT(users.last_login, '%Y-%m-%d %H:%i:%s') as last_login"),
        "department.name as department_name"
      )
      .orderBy("users.id");
    return NextResponse.json(users);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const insertData: Record<string, unknown> = {
      provider_id: body.provider_id,
      fullname: body.fullname,
      role: body.role === "admin" ? "admin" : "user",
      department_id: body.department_id || null,
      is_active: body.is_active ?? true,
    };

    if (body.username) {
      insertData.username = body.username;
    }

    if (body.password) {
      insertData.password_hash = await hashPassword(body.password);
    }

    const [id] = await db("users").insert(insertData);
    const user = await db("users")
      .leftJoin("department", "users.department_id", "department.id")
      .select(
        "users.id",
        "users.provider_id",
        "users.fullname",
        "users.username",
        "users.role",
        "users.department_id",
        "users.is_active",
        db.raw("DATE_FORMAT(users.last_login, '%Y-%m-%d %H:%i:%s') as last_login"),
        "department.name as department_name"
      )
      .where("users.id", id)
      .first();
    return NextResponse.json(user, { status: 201 });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ error: "รหัส Provider นี้มีอยู่แล้ว" }, { status: 409 });
    }
    return NextResponse.json({ error: err.message || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ" }, { status: 500 });
  }
}
