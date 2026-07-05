import db from "../src/lib/db";

async function clearMissionNotes() {
  try {
    const missions = await db("mission").select("*");
    const missionNames = new Set(missions.map((m) => m.name.trim()));
    console.log(`Loaded ${missions.length} mission names.`);

    const topics = await db("kpi_topic")
      .select("id", "kpi_number", "name", "note", "mission")
      .whereNotNull("note")
      .where("note", "!=", "");

    let clearedCount = 0;
    let keptCount = 0;

    for (const t of topics) {
      const noteText = (t.note || "").trim();
      if (!noteText) continue;

      // Check if noteText matches any mission name exactly or partially
      let isMissionName = missionNames.has(noteText);

      if (!isMissionName) {
        // Double check against all mission names
        isMissionName = missions.some((m) => {
          const mName = m.name.trim();
          return noteText === mName || noteText.includes(mName) || mName.includes(noteText);
        });
      }

      if (isMissionName) {
        await db("kpi_topic")
          .where("id", t.id)
          .update({ note: null });

        console.log(`Cleared note for KPI #${t.kpi_number || "-"} (ID ${t.id}): was "${noteText}"`);
        clearedCount++;
      } else {
        console.log(`Kept non-mission note for KPI #${t.kpi_number || "-"} (ID ${t.id}): "${noteText}"`);
        keptCount++;
      }
    }

    console.log(`\nNote cleanup finished:
      - Cleared (mission names): ${clearedCount} topics
      - Kept (other notes): ${keptCount} topics
    `);
  } catch (err) {
    console.error("Cleanup failed:", err);
  } finally {
    process.exit(0);
  }
}

clearMissionNotes();
