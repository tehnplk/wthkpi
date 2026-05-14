import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { hashPassword } from "@/lib/password";

const USER_SELECT = [
  "users.id",
  "users.provider_id",
  "users.fullname",
  "users.username",
  "users.role",
  "users.department_id",
  "users.is_active",
  "users.last_login",
  "department.name as department_name",
];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await db("users")
      .leftJoin("department", "users.department_id", "department.id")
      .select(USER_SELECT)
      .where("users.id", id)
      .first();
    if (!user) {
      return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updateData: Record<string, unknown> = {};
    if (body.provider_id !== undefined) updateData.provider_id = body.provider_id;
    if (body.fullname !== undefined) updateData.fullname = body.fullname;
    if (body.username !== undefined) updateData.username = body.username;
    if (body.role !== undefined) updateData.role = body.role === "admin" ? "admin" : "user";
    if (body.department_id !== undefined) updateData.department_id = body.department_id;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    if (body.password) {
      updateData.password_hash = await hashPassword(body.password);
    }

    const updated = await db("users").where({ id }).update(updateData);
    if (!updated) {
      return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
    }
    const user = await db("users")
      .leftJoin("department", "users.department_id", "department.id")
      .select(USER_SELECT)
      .where("users.id", id)
      .first();
    return NextResponse.json(user);
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ error: "รหัส Provider นี้มีอยู่แล้ว" }, { status: 409 });
    }
    return NextResponse.json({ error: err.message || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await db("users").where({ id }).delete();
    if (!deleted) {
      return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
