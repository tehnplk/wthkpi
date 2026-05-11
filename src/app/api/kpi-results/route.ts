import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const kpiId = searchParams.get("kpi_id");
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let query = db("kpi_result")
      .join("kpi_topic", "kpi_result.kpi_id", "kpi_topic.id")
      .select(
        "kpi_result.*",
        "kpi_topic.name as kpi_name"
      );

    if (kpiId) query = query.where("kpi_result.kpi_id", kpiId);
    if (status) query = query.where("kpi_result.status", status);
    if (from) query = query.where("kpi_result.report_date", ">=", from);
    if (to) query = query.where("kpi_result.report_date", "<=", to);

    const results = await query.orderBy("kpi_result.report_date", "desc");
    return NextResponse.json(results);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const insertData: Record<string, unknown> = {
      kpi_id: body.kpi_id,
      target: body.target ?? null,
      result: body.result ?? null,
      percent: body.percent ?? null,
      status: body.status || "pending",
      note: body.note || null,
      report_date: body.report_date || null,
    };
    const [id] = await db("kpi_result").insert(insertData);
    const result = await db("kpi_result")
      .join("kpi_topic", "kpi_result.kpi_id", "kpi_topic.id")
      .select("kpi_result.*", "kpi_topic.name as kpi_name")
      .where("kpi_result.id", id)
      .first();
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
