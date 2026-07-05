import fs from "node:fs";
import db from "../src/lib/db";

async function dumpData() {
  try {
    const kpiTopics = await db("kpi_topic").select("*");
    const kpiTopicDepartments = await db("kpi_topic_department").select("*");
    const missions = await db("mission").select("*");

    const payload = {
      kpi_topic: kpiTopics,
      kpi_topic_department: kpiTopicDepartments,
      mission: missions,
    };

    fs.writeFileSync("/tmp/prod_dump.json", JSON.stringify(payload, null, 2), "utf8");
    console.log(`Successfully dumped:
      kpi_topic: ${kpiTopics.length} rows
      kpi_topic_department: ${kpiTopicDepartments.length} rows
      mission: ${missions.length} rows
    to /tmp/prod_dump.json`);
  } catch (err) {
    console.error("Dump failed:", err);
  } finally {
    process.exit(0);
  }
}

dumpData();
