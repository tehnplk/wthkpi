import db from "../src/lib/db";

async function checkMapping() {
  try {
    const missions = await db("mission").select("*");
    console.log("=== MISSIONS ===");
    for (const m of missions) {
      console.log(`[ID ${m.id}] ${m.name}`);
    }

    const topics = await db("kpi_topic")
      .select("id", "kpi_number", "name", "note", "mission")
      .whereNotNull("note")
      .where("note", "!=", "");

    console.log(`\n=== TOPICS WITH NOTE (${topics.length} items) ===`);
    for (const t of topics) {
      const matchedMissions: typeof missions = [];
      const noteText = (t.note || "").trim();

      for (const m of missions) {
        const mName = m.name.trim();
        if (
          noteText === mName ||
          noteText.includes(mName) ||
          mName.includes(noteText) ||
          (noteText.includes("พันธกิจที่") && mName.includes("พันธกิจที่") &&
            noteText.slice(0, 10) === mName.slice(0, 10))
        ) {
          matchedMissions.push(m);
        }
      }

      console.log(`KPI #${t.kpi_number || "-"} (ID ${t.id}): "${t.name}"`);
      console.log(`  note: "${t.note}"`);
      console.log(`  current mission: ${JSON.stringify(t.mission)}`);
      console.log(`  matched missions: ${matchedMissions.map((m) => `[ID ${m.id}] ${m.name}`).join(" | ")}`);
      console.log("---");
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

checkMapping();
