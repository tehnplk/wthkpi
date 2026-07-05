import fs from "node:fs";
import path from "node:path";
import db from "../src/lib/db";

async function importData() {
  try {
    const dumpPath = path.join(process.cwd(), "scripts", "prod_dump.json");
    if (!fs.existsSync(dumpPath)) {
      console.error(`File not found: ${dumpPath}`);
      process.exit(1);
    }

    const content = fs.readFileSync(dumpPath, "utf8");
    const payload = JSON.parse(content);

    const kpiTopics = payload.kpi_topic || [];
    const kpiTopicDepartments = payload.kpi_topic_department || [];
    const missions = payload.mission || [];

    console.log(`Importing to local DB:
      kpi_topic: ${kpiTopics.length} rows
      kpi_topic_department: ${kpiTopicDepartments.length} rows
      mission: ${missions.length} rows
    `);

    await db.transaction(async (trx) => {
      // Disable foreign key checks temporarily
      await trx.raw("SET FOREIGN_KEY_CHECKS = 0;");

      await trx("kpi_topic_department").truncate();
      await trx("kpi_topic").truncate();
      await trx("mission").truncate();

      if (missions.length > 0) {
        await trx("mission").insert(missions);
      }

      if (kpiTopics.length > 0) {
        // Ensure mission column is properly formatted for DB insertion
        const formattedTopics = kpiTopics.map((t: Record<string, unknown>) => ({
          ...t,
          mission: typeof t.mission === "object" && t.mission !== null ? JSON.stringify(t.mission) : t.mission,
        }));
        await trx("kpi_topic").insert(formattedTopics);
      }

      if (kpiTopicDepartments.length > 0) {
        await trx("kpi_topic_department").insert(kpiTopicDepartments);
      }

      await trx.raw("SET FOREIGN_KEY_CHECKS = 1;");
    });

    console.log("Local database import completed successfully!");
  } catch (err) {
    console.error("Local import failed:", err);
  } finally {
    process.exit(0);
  }
}

importData();
