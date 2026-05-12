import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const topic = await db("kpi_topic")
      .leftJoin("kpi_type", "kpi_topic.kpi_type_id", "kpi_type.id")
      .select("kpi_topic.*", "kpi_type.type as kpi_type")
      .where("kpi_topic.id", id)
      .first();
    if (!topic) {
      return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
    }

    const links = await db("kpi_topic_department")
      .select(
        "kpi_topic_department.department_id as department_id",
        "department.name as department_name",
        "kpi_topic_department.user_id",
        "users.fullname as user_owner"
      )
      .join("department", "kpi_topic_department.department_id", "department.id")
      .leftJoin("users", "kpi_topic_department.user_id", "users.id")
      .where("kpi_id", id)
      .orderBy("kpi_topic_department.department_id", "asc");

    return NextResponse.json({
      ...topic,
      departments: links.map((l) => ({
        id: l.department_id,
        name: l.department_name,
        user_id: l.user_id || null,
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
      kpi_type_id: body.kpi_type_id || null,
      kpi_number: body.kpi_number || null,
      note: body.note || null,
    });
    if (!updated) {
      return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
    }

    await db("kpi_topic_department").where({ kpi_id: id }).delete();

    if (Array.isArray(assignments) && assignments.length > 0) {
      await db("kpi_topic_department").insert(
        assignments.map((a: { department_id: number; user_id?: number }) => ({
          kpi_id: id,
          department_id: a.department_id,
          user_id: a.user_id || null,
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
