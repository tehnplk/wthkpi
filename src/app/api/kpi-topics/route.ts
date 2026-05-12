import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const topics = await db("kpi_topic").select("*").orderBy("name");

    const topicIds = topics.map((t) => t.id);
    const links = topicIds.length
      ? await db("kpi_topic_department")
          .select("kpi_id", "department_id", "department.name as department_name", "user_owner")
          .join("department", "kpi_topic_department.department_id", "department.id")
          .whereIn("kpi_id", topicIds)
      : [];

    const deptByTopic: Record<number, { id: number; name: string; user_owner: string | null }[]> = {};
    for (const link of links) {
      if (!deptByTopic[link.kpi_id]) deptByTopic[link.kpi_id] = [];
      deptByTopic[link.kpi_id].push({
        id: link.department_id,
        name: link.department_name,
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

    const [id] = await db("kpi_topic").insert({
      name: body.name,
      kpi_number: body.kpi_number || null,
      note: body.note || null,
    });

    if (Array.isArray(assignments) && assignments.length > 0) {
      await db("kpi_topic_department").insert(
        assignments.map((a: { department_id: number; user_owner?: string }) => ({
          kpi_id: id,
          department_id: a.department_id,
          user_owner: a.user_owner || null,
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
