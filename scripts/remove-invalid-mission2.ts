import db from "../src/lib/db";

async function cleanupMission2() {
  try {
    // 1. Delete ID 2 from mission table
    const deletedCount = await db("mission").where("id", 2).del();
    console.log(`Deleted mission ID 2 ("น้อยกว่า ร้อยละ 5"): ${deletedCount} row(s) deleted.`);

    // 2. Find all kpi_topic records where mission contains 2
    const topics = await db("kpi_topic").select("id", "kpi_number", "name", "mission");
    let updatedCount = 0;

    for (const t of topics) {
      if (!t.mission) continue;
      let missionArr: number[] = [];
      try {
        missionArr = typeof t.mission === "string" ? JSON.parse(t.mission) : (t.mission as number[]);
      } catch {
        continue;
      }

      if (Array.isArray(missionArr) && missionArr.includes(2)) {
        const newArr = missionArr.filter((id) => id !== 2);
        const newMissionVal = newArr.length > 0 ? JSON.stringify(newArr) : null;

        await db("kpi_topic")
          .where("id", t.id)
          .update({ mission: newMissionVal });

        console.log(`Updated KPI #${t.kpi_number || "-"} (ID ${t.id}): mission changed from ${JSON.stringify(missionArr)} to ${newMissionVal}`);
        updatedCount++;
      }
    }

    console.log(`Cleanup completed: ${updatedCount} kpi_topic records updated.`);
  } catch (err) {
    console.error("Cleanup failed:", err);
  } finally {
    process.exit(0);
  }
}

cleanupMission2();
