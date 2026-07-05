import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const missions = await db("mission").select("id", "name").orderBy("id", "asc");
    return NextResponse.json(missions);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    if (!name) {
      return NextResponse.json({ error: "กรุณาระบุชื่อพันธกิจ" }, { status: 400 });
    }

    const existing = await db("mission").where({ name }).first();
    if (existing) {
      return NextResponse.json({ error: "พันธกิจนี้มีอยู่แล้ว" }, { status: 409 });
    }

    const [id] = await db("mission").insert({ name });
    const mission = await db("mission").where({ id }).first();
    return NextResponse.json(mission, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
