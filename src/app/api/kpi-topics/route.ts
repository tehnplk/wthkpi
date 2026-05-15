import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const departmentId = request.nextUrl.searchParams.get("department_id");

    let query = db("kpi_topic")
      .leftJoin("kpi_type", "kpi_topic.kpi_type_id", "kpi_type.id")
      .select("kpi_topic.*", "kpi_type.type as kpi_type");

    if (departmentId) {
      query = query.whereExists(function () {
        this.select(db.raw("1"))
          .from("kpi_topic_department")
          .whereRaw("kpi_topic_department.kpi_id = kpi_topic.id")
          .where("kpi_topic_department.department_id", departmentId);
      });
    }

    const topics = await query.orderBy("kpi_topic.name");

    const topicIds = topics.map((t) => t.id);
    const links = topicIds.length
      ? await db("kpi_topic_department")
          .select(
            "kpi_id",
            "kpi_topic_department.department_id as department_id",
            "department.name as department_name",
            "kpi_topic_department.user_id",
            "users.fullname as user_owner"
          )
          .join("department", "kpi_topic_department.department_id", "department.id")
          .leftJoin("users", "kpi_topic_department.user_id", "users.id")
          .whereIn("kpi_id", topicIds)
          .orderBy("kpi_topic_department.department_id", "asc")
      : [];

    const deptByTopic: Record<number, { id: number; name: string; user_id: number | null; user_owner: string | null }[]> = {};
    for (const link of links) {
      if (!deptByTopic[link.kpi_id]) deptByTopic[link.kpi_id] = [];
      deptByTopic[link.kpi_id].push({
        id: link.department_id,
        name: link.department_name,
        user_id: link.user_id || null,
        user_owner: link.user_owner || null,
      });
    }

    const result = topics.map((topic) => ({
      ...topic,
      departments: deptByTopic[topic.id] || [],
    }));

    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assignments } = body;
    const isChildTopic = body.flag_parent_or_child === "child";

    const [id] = await db("kpi_topic").insert({
      name: body.name,
      kpi_type_id: body.kpi_type_id || null,
      status: body.status || "pending",
      kpi_number: body.kpi_number || null,
      note: body.note || null,
      criteria: body.criteria || null,
      rate_cal_value: body.rate_cal_value ?? null,
      flag_parent_or_child: isChildTopic ? "child" : "parent",
      parent_kpi: isChildTopic ? body.parent_kpi || null : null,
      flag_reporting: body.flag_reporting || "yes",
      flag_show_guest: body.flag_show_guest || "yes",
    });

    if (Array.isArray(assignments) && assignments.length > 0) {
      await db("kpi_topic_department").insert(
        assignments.map((a: { department_id: number; user_id?: number }) => ({
          kpi_id: id,
          department_id: a.department_id,
          user_id: a.user_id || null,
        }))
      );
    }

    const topic = await db("kpi_topic").where({ id: id as number }).first();
    return NextResponse.json(topic, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
