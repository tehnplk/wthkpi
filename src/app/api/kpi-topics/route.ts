import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const topics = await db("kpi_topic").select("*").orderBy("name");
    return NextResponse.json(topics);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const [id] = await db("kpi_topic").insert({
      name: body.name,
      department_owner: body.department_owner || null,
      user_owner: body.user_owner || null,
    });
    const topic = await db("kpi_topic").where({ id }).first();
    return NextResponse.json(topic, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
