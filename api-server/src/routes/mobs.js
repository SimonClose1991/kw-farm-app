import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { mobs, mobHistory, mobNotes, farms } from "../db/schema.js";
import { requireAuth, requireEditor } from "../auth.js";

const router = Router();

async function farmIdByName(name) {
  const [farm] = await db.select().from(farms).where(eq(farms.name, name));
  return farm?.id || null;
}

// GET /api/mobs?farm=Arundale
router.get("/", requireAuth, async (req, res) => {
  const farmName = req.query.farm;
  if (!farmName) return res.status(400).json({ error: "farm query param is required" });
  const farmId = await farmIdByName(farmName);
  if (!farmId) return res.json([]);
  const all = await db.select().from(mobs).where(eq(mobs.farmId, farmId));
  // Flatten extra jsonb fields into each mob so frontend receives lastTreatDate, whpDays etc
  res.json(all.map(m => ({ ...m, ...(m.extra || {}) })));
});

// POST /api/mobs  body: { farm, ...mobFields }
router.post("/", requireAuth, requireEditor, async (req, res) => {
  const { farm, ...fields } = req.body;
  const farmId = await farmIdByName(farm);
  if (!farmId) return res.status(400).json({ error: "Unknown farm" });
  const [created] = await db.insert(mobs).values({ ...fields, farmId, updatedAt: new Date() }).returning();
  res.status(201).json(created);
});

// PUT /api/mobs/:id  body: { ...fields to update }
router.put("/:id", requireAuth, requireEditor, async (req, res) => {
  const { farm, ...fields } = req.body;

  // Known DB columns on the mobs table
  const KNOWN_COLS = new Set([
    "name","desc","count","paddock","dse","species","type","breed","ageClass",
    "mgmtGroup","tag","whp","lastWeight","lastWeightDate","assumedADG",
    "daysInPaddock","wec","extra"
  ]);

  // Split into known columns and extra fields
  const knownFields = {};
  const extraFields = {};
  for (const [k, v] of Object.entries(fields)) {
    if (KNOWN_COLS.has(k)) knownFields[k] = v;
    else extraFields[k] = v;
  }

  // Merge extra fields with existing extra blob
  if (Object.keys(extraFields).length > 0) {
    const [existing] = await db.select({ extra: mobs.extra })
      .from(mobs).where(eq(mobs.id, Number(req.params.id)));
    knownFields.extra = { ...(existing?.extra || {}), ...extraFields };
  }

  const [updated] = await db
    .update(mobs)
    .set({ ...knownFields, updatedAt: new Date() })
    .where(eq(mobs.id, Number(req.params.id)))
    .returning();
  if (!updated) return res.status(404).json({ error: "Mob not found" });
  // Flatten extra fields back into response so frontend gets them
  res.json({ ...updated, ...(updated.extra || {}) });
});

// DELETE /api/mobs/:id
router.delete("/:id", requireAuth, requireEditor, async (req, res) => {
  await db.delete(mobs).where(eq(mobs.id, Number(req.params.id)));
  res.json({ ok: true });
});

// POST /api/mobs/:id/transfer  body: { toFarm, count, date }
// Creates a copy of the mob in the destination farm and reduces the source count,
// recording a history entry on both sides.
router.post("/:id/transfer", requireAuth, requireEditor, async (req, res) => {
  const { toFarm, count, date } = req.body;
  const sourceId = Number(req.params.id);
  const [source] = await db.select().from(mobs).where(eq(mobs.id, sourceId));
  if (!source) return res.status(404).json({ error: "Mob not found" });
  const destFarmId = await farmIdByName(toFarm);
  if (!destFarmId) return res.status(400).json({ error: "Unknown destination farm" });

  const transferCount = Number(count) || 0;
  const dateStr = date || new Date().toISOString().slice(0, 10);
  const detail = `Transferred ${transferCount} head to ${toFarm}`;

  const { id, farmId, createdAt, updatedAt, ...rest } = source;
  const [newMob] = await db
    .insert(mobs)
    .values({ ...rest, farmId: destFarmId, count: transferCount, paddock: "Yards", daysInPaddock: 0 })
    .returning();

  const [updatedSource] = await db
    .update(mobs)
    .set({ count: Math.max(0, source.count - transferCount), updatedAt: new Date() })
    .where(eq(mobs.id, sourceId))
    .returning();

  await db.insert(mobHistory).values([
    { mobId: sourceId, date: dateStr, action: "Transfer", detail },
    { mobId: newMob.id, date: dateStr, action: "Transfer", detail: `Received from ${source.farmId === destFarmId ? "same farm" : "transfer"}` },
  ]);

  res.status(201).json({ source: updatedSource, newMob });
});

// --- History ---
// GET /api/mobs/:id/history
router.get("/:id/history", requireAuth, async (req, res) => {
  const all = await db.select().from(mobHistory).where(eq(mobHistory.mobId, Number(req.params.id)));
  res.json(all);
});

// POST /api/mobs/:id/history  body: { date, action, detail }
router.post("/:id/history", requireAuth, requireEditor, async (req, res) => {
  const { date, action, detail } = req.body;
  const [created] = await db
    .insert(mobHistory)
    .values({ mobId: Number(req.params.id), date: date || new Date().toISOString().slice(0, 10), action, detail })
    .returning();
  res.status(201).json(created);
});

// --- Notes ---
// GET /api/mobs/:id/notes
router.get("/:id/notes", requireAuth, async (req, res) => {
  const all = await db.select().from(mobNotes).where(eq(mobNotes.mobId, Number(req.params.id)));
  res.json(all);
});

// POST /api/mobs/:id/notes  body: { text, authorName }
router.post("/:id/notes", requireAuth, async (req, res) => {
  const { text, authorName } = req.body;
  if (!text) return res.status(400).json({ error: "Note text is required" });
  const [created] = await db
    .insert(mobNotes)
    .values({ mobId: Number(req.params.id), text, authorName })
    .returning();
  res.status(201).json(created);
});

// DELETE /api/mobs/:id/notes/:noteId
router.delete("/:id/notes/:noteId", requireAuth, async (req, res) => {
  await db.delete(mobNotes).where(eq(mobNotes.id, Number(req.params.noteId)));
  res.json({ ok: true });
});

export default router;

// GET /api/mobs/history?farm=Arundale — all mob history for a farm (for records export)
router.get("/history", requireAuth, async (req, res) => {
  const farmName = req.query.farm;
  if (!farmName) return res.status(400).json({ error: "farm query param is required" });
  const farmId = await farmIdByName(farmName);
  if (!farmId) return res.json([]);
  // Join mob history with mob name/species for display
  const farmMobs = await db.select().from(mobs).where(eq(mobs.farmId, farmId));
  const mobMap = {};
  farmMobs.forEach(m => { mobMap[m.id] = m; });
  const allHistory = [];
  for (const mob of farmMobs) {
    const history = await db.select().from(mobHistory).where(eq(mobHistory.mobId, mob.id));
    history.forEach(h => allHistory.push({ ...h, mobName: mob.name, species: mob.species, breed: mob.breed, ageClass: mob.ageClass, tag: mob.tag, paddock: mob.paddock }));
  }
  // Sort by date descending
  allHistory.sort((a, b) => (a.date < b.date ? 1 : -1));
  res.json(allHistory);
});
