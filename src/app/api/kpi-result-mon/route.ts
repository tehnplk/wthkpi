import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { canManageKpi } from "@/lib/kpi-access";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const kpiId = searchParams.get("kpi_id");
    const budgetYear = searchParams.get("budget_year");

    if (!kpiId || !budgetYear) {
      return NextResponse.json({ error: "ต้องระบุ kpi_id และ budget_year" }, { status: 400 });
    }

    const rows = await db("kpi_result_mon")
      .leftJoin("users", "kpi_result_mon.updated_by", "users.id")
      .select("kpi_result_mon.*", "users.fullname as updated_by_name")
      .where({ "kpi_result_mon.kpi_id": kpiId, "kpi_result_mon.budget_year": budgetYear })
      .orderBy("kpi_result_mon.mon", "asc");

    return NextResponse.json(rows);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { kpi_id, budget_year, months } = body;

    if (!kpi_id || !budget_year || !Array.isArray(months)) {
      return NextResponse.json({ error: "ต้องระบุ kpi_id, budget_year, months" }, { status: 400 });
    }

    const session = await getSession();
    if (!session || !(await canManageKpi(session, kpi_id))) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์แก้ไข KPI นี้" }, { status: 403 });
    }

    await db.transaction(async (trx) => {
      for (const m of months) {
        if (m.mon == null) continue;
        const existing = await trx("kpi_result_mon")
          .where({ kpi_id, budget_year, mon: m.mon })
          .first();

        const data = {
          kpi_id,
          budget_year,
          mon: m.mon,
          target: m.target ?? null,
          result: m.result ?? null,
          updated_at: trx.fn.now(),
          updated_by: session.id,
        };

        if (existing) {
          await trx("kpi_result_mon").where({ id: existing.id }).update(data);
        } else {
          await trx("kpi_result_mon").insert(data);
        }
      }
    });

    const rows = await db("kpi_result_mon")
      .leftJoin("users", "kpi_result_mon.updated_by", "users.id")
      .select("kpi_result_mon.*", "users.fullname as updated_by_name")
      .where({ "kpi_result_mon.kpi_id": kpi_id, "kpi_result_mon.budget_year": budget_year })
      .orderBy("kpi_result_mon.mon", "asc");

    return NextResponse.json(rows);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
