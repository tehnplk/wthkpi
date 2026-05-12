import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const types = await db("kpi_type").select("id", "type").orderBy("id", "asc");
    return NextResponse.json(types);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const type = String(body.type || "").trim();
    if (!type) {
      return NextResponse.json({ error: "กรุณาระบุประเภทตัวชี้วัด" }, { status: 400 });
    }

    const existing = await db("kpi_type").where({ type }).first();
    if (existing) {
      return NextResponse.json({ error: "ประเภทตัวชี้วัดนี้มีอยู่แล้ว" }, { status: 409 });
    }

    const latest = await db("kpi_type").max("id as id").first() as { id?: number | string | null } | undefined;
    const id = Number(latest?.id || 0) + 1;
    await db("kpi_type").insert({ id, type });
    const kpiType = await db("kpi_type").where({ id }).first();
    return NextResponse.json(kpiType, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
