import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const departments = await db("department").select("*").orderBy("name");
    return NextResponse.json(departments);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const [id] = await db("department").insert({ name: body.name });
    const department = await db("department").where({ id }).first();
    return NextResponse.json(department, { status: 201 });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ error: "ชื่อแผนกนี้มีอยู่แล้ว" }, { status: 409 });
    }
    return NextResponse.json({ error: err.message || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ" }, { status: 500 });
  }
}
