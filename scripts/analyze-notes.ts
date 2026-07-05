import db from "../src/lib/db";

async function analyzeNotes() {
  try {
    const missions = await db("mission").select("*");
    console.log("=== ALL MISSIONS IN DB ===");
    for (const m of missions) {
      console.log(`Mission ID ${m.id}: "${m.name}"`);
    }

    const topics = await db("kpi_topic")
      .select("id", "kpi_number", "name", "note", "mission")
      .whereNotNull("note")
      .where("note", "!=", "");

    const noteMap = new Map<string, typeof topics>();
    for (const t of topics) {
      const noteStr = (t.note || "").trim();
      const list = noteMap.get(noteStr) || [];
      list.push(t);
      noteMap.set(noteStr, list);
    }

    console.log(`\n=== UNIQUE NOTES (${noteMap.size} unique notes across ${topics.length} topics) ===`);
    let idx = 1;
    for (const [noteStr, topicList] of noteMap.entries()) {
      console.log(`\n[Note #${idx++}] (${topicList.length} topics) "${noteStr}"`);

      // 1. Exact match
      let exact = missions.filter((m) => m.name.trim() === noteStr);

      // 2. Contains match (if exact is empty)
      let matched = exact;
      if (matched.length === 0) {
        matched = missions.filter((m) => {
          const mName = m.name.trim();
          return noteStr.includes(mName) || mName.includes(noteStr);
        });
      }

      console.log(`  Matched (${matched.length}): ${matched.map((m) => `[ID ${m.id}] "${m.name}"`).join(" AND ")}`);
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

analyzeNotes();
