import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const users = await db("users")
      .leftJoin("department", "users.department_id", "department.id")
      .select("users.*", "department.name as department_name")
      .orderBy("users.fullname");
    return NextResponse.json(users);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const [id] = await db("users").insert({
      provider_id: body.provider_id,
      fullname: body.fullname,
      department_id: body.department_id || null,
      is_active: body.is_active ?? true,
    });
    const user = await db("users")
      .leftJoin("department", "users.department_id", "department.id")
      .select("users.*", "department.name as department_name")
      .where("users.id", id)
      .first();
    return NextResponse.json(user, { status: 201 });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ error: "Provider ID already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: err.message || "Unknown error" }, { status: 500 });
  }
}
