import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const topic = await db("kpi_topic").where({ id }).first();
    if (!topic) {
      return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
    }

    const links = await db("kpi_topic_department")
      .select("department_id", "department.name as department_name", "user_owner")
      .join("department", "kpi_topic_department.department_id", "department.id")
      .where("kpi_id", id);

    return NextResponse.json({
      ...topic,
      departments: links.map((l) => ({
        id: l.department_id,
        name: l.department_name,
        user_owner: l.user_owner || null,
      })),
    });
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
    const { assignments } = body;

    const updated = await db("kpi_topic").where({ id }).update({
      name: body.name,
      kpi_number: body.kpi_number || null,
      note: body.note || null,
    });
    if (!updated) {
      return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
    }

    await db("kpi_topic_department").where({ kpi_id: id }).delete();

    if (Array.isArray(assignments) && assignments.length > 0) {
      await db("kpi_topic_department").insert(
        assignments.map((a: { department_id: number; user_owner?: string }) => ({
          kpi_id: id,
          department_id: a.department_id,
          user_owner: a.user_owner || null,
        }))
      );
    }

    const topic = await db("kpi_topic").where({ id }).first();
    return NextResponse.json(topic);
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
    const deleted = await db("kpi_topic").where({ id }).delete();
    if (!deleted) {
      return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
