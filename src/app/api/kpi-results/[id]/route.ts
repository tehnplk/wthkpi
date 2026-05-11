import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await db("kpi_result")
      .join("kpi_topic", "kpi_result.kpi_id", "kpi_topic.id")
      .select("kpi_result.*", "kpi_topic.name as kpi_name")
      .where("kpi_result.id", id)
      .first();
    if (!result) {
      return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
    }
    return NextResponse.json(result);
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
    const updateData: Record<string, unknown> = {
      kpi_id: body.kpi_id,
      target: body.target ?? null,
      result: body.result ?? null,
      percent: body.percent ?? null,
      status: body.status,
      note: body.note ?? null,
      report_date: body.report_date ?? null,
    };
    const updated = await db("kpi_result").where({ id }).update(updateData);
    if (!updated) {
      return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
    }
    const result = await db("kpi_result")
      .join("kpi_topic", "kpi_result.kpi_id", "kpi_topic.id")
      .select("kpi_result.*", "kpi_topic.name as kpi_name")
      .where("kpi_result.id", id)
      .first();
    return NextResponse.json(result);
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
    const deleted = await db("kpi_result").where({ id }).delete();
    if (!deleted) {
      return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
