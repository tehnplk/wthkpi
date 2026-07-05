import db from "../src/lib/db";

async function runMigration() {
  try {
    const missions = await db("mission").select("*");
    console.log(`Loaded ${missions.length} mission records.`);

    const topics = await db("kpi_topic")
      .select("id", "kpi_number", "name", "note", "mission")
      .whereNotNull("note")
      .where("note", "!=", "");

    let updatedCount = 0;

    for (const t of topics) {
      const noteText = (t.note || "").trim();
      if (!noteText) continue;

      const matchedIds: number[] = [];

      for (const m of missions) {
        const mName = m.name.trim();
        if (
          noteText === mName ||
          noteText.includes(mName) ||
          mName.includes(noteText) ||
          (noteText.includes("พันธกิจที่") && mName.includes("พันธกิจที่") &&
            noteText.slice(0, 10) === mName.slice(0, 10))
        ) {
          if (!matchedIds.includes(m.id)) {
            matchedIds.push(m.id);
          }
        }
      }

      if (matchedIds.length > 0) {
        const jsonValue = JSON.stringify(matchedIds);
        await db("kpi_topic")
          .where("id", t.id)
          .update({ mission: jsonValue });

        console.log(`Updated KPI #${t.kpi_number || "-"} (ID ${t.id}): mission = ${jsonValue} (from note: "${noteText}")`);
        updatedCount++;
      }
    }

    console.log(`\nSuccessfully updated ${updatedCount} kpi_topic records!`);
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    process.exit(0);
  }
}

runMigration();
