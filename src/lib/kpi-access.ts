import type { SessionUser } from "@/lib/auth";
import db from "@/lib/db";

export async function canManageKpi(session: SessionUser | null, kpiId: number | string): Promise<boolean> {
  if (!session) return false;

  const user = await db("users")
    .select("role", "department_id")
    .where({ id: session.id })
    .where("is_active", true)
    .first();

  if (!user) return false;
  if ((user.role || "user") === "admin") return true;
  if (!user.department_id) return false;

  const link = await db("kpi_topic_department")
    .where({
      kpi_id: kpiId,
      department_id: user.department_id,
    })
    .first();

  return Boolean(link);
}
