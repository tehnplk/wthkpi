import db from "../src/lib/db";

async function runStrictMigration() {
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

      // 1. Exact match first
      let matched = missions.filter((m) => m.name.trim() === noteText);

      // 2. If no exact match, try contains match
      if (matched.length === 0) {
        matched = missions.filter((m) => {
          const mName = m.name.trim();
          return noteText.includes(mName) || mName.includes(noteText);
        });
      }

      // We ONLY take the single best match (exactly 1 mission ID)
      if (matched.length > 0) {
        const bestMatch = matched[0];
        const jsonValue = JSON.stringify([bestMatch.id]);

        await db("kpi_topic")
          .where("id", t.id)
          .update({ mission: jsonValue });

        console.log(`Updated KPI #${t.kpi_number || "-"} (ID ${t.id}): mission = ${jsonValue} (Matched Mission ID ${bestMatch.id}: "${bestMatch.name}")`);
        updatedCount++;
      }
    }

    console.log(`\nSuccessfully updated ${updatedCount} kpi_topic records to exactly 1 mission ID!`);
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    process.exit(0);
  }
}

runStrictMigration();
