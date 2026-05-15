import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { canManageKpi } from "@/lib/kpi-access";

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

    const session = await getSession();
    if (!(await canManageKpi(session, id))) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์แก้ไข KPI นี้" }, { status: 403 });
    }

    if (session?.role !== "admin") {
      const restrictedFields = ["name", "kpi_type_id", "kpi_number", "note", "criteria", "assignments", "flag_show_guest"];
      if (restrictedFields.some((field) => body[field] !== undefined)) {
        return NextResponse.json({ error: "ไม่มีสิทธิ์แก้ไขข้อมูลตั้งค่า KPI" }, { status: 403 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.kpi_type_id !== undefined) updateData.kpi_type_id = body.kpi_type_id || null;
    if (body.kpi_number !== undefined) updateData.kpi_number = body.kpi_number || null;
    if (body.note !== undefined) updateData.note = body.note || null;
    if (body.criteria !== undefined) updateData.criteria = body.criteria || null;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.rate_cal_value !== undefined) updateData.rate_cal_value = body.rate_cal_value;
    if (body.flag_parent_or_child !== undefined) updateData.flag_parent_or_child = body.flag_parent_or_child || "parent";
    if (body.parent_kpi !== undefined) updateData.parent_kpi = body.parent_kpi || null;
    if (body.flag_reporting !== undefined) updateData.flag_reporting = body.flag_reporting || "yes";
    if (body.flag_show_guest !== undefined) updateData.flag_show_guest = body.flag_show_guest || "yes";

    const updated = await db("kpi_topic").where({ id }).update(updateData);
    if (!updated) {
      return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
    }

    if (body.kpi_type_id !== undefined) {
      await db("kpi_topic")
        .where({ parent_kpi: id, flag_parent_or_child: "child" })
        .update({ kpi_type_id: updateData.kpi_type_id });
    }

    if (assignments !== undefined) {
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
    const child = await db("kpi_topic")
      .select("id")
      .where({ parent_kpi: id, flag_parent_or_child: "child" })
      .first();

    if (child) {
      return NextResponse.json({ error: "ไม่สามารถลบตัวชี้วัดหลักที่มีตัวชี้วัดย่อยได้" }, { status: 409 });
    }

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
