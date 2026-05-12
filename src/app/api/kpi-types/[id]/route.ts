import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const kpiType = await db("kpi_type").where({ id }).first();
    if (!kpiType) {
      return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
    }
    return NextResponse.json(kpiType);
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
    const type = String(body.type || "").trim();
    if (!type) {
      return NextResponse.json({ error: "กรุณาระบุประเภทตัวชี้วัด" }, { status: 400 });
    }

    const duplicate = await db("kpi_type").where({ type }).whereNot({ id }).first();
    if (duplicate) {
      return NextResponse.json({ error: "ประเภทตัวชี้วัดนี้มีอยู่แล้ว" }, { status: 409 });
    }

    const updated = await db("kpi_type").where({ id }).update({ type });
    if (!updated) {
      return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
    }

    const kpiType = await db("kpi_type").where({ id }).first();
    return NextResponse.json(kpiType);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const used = await db("kpi_topic").where({ kpi_type_id: id }).first();
    if (used) {
      return NextResponse.json({ error: "มีตัวชี้วัดใช้งานประเภทนี้อยู่ ไม่สามารถลบได้" }, { status: 409 });
    }

    const deleted = await db("kpi_type").where({ id }).delete();
    if (!deleted) {
      return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
