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

// GET /api/mobs?farm=Arundale — active mobs by default; ?archived=true lists archived ones instead
router.get("/", requireAuth, async (req, res) => {
  const farmName = req.query.farm;
  if (!farmName) return res.status(400).json({ error: "farm query param is required" });
  const farmId = await farmIdByName(farmName);
  if (!farmId) return res.json([]);
  const showArchived = req.query.archived === "true" || req.query.archived === "1";
  const all = await db.select().from(mobs).where(and(eq(mobs.farmId, farmId), eq(mobs.archived, showArchived)));
  // Flatten extra jsonb fields into each mob so frontend receives lastTreatDate, whpDays etc
  res.json(all.map(m => ({ ...m, ...(m.extra || {}) })));
});

// POST /api/mobs  body: { farm, ...mobFields }
router.post("/", requireAuth, requireEditor, async (req, res) => {
  // Strip server-managed fields — clients may post back a whole mob record
  // (e.g. Copy mob), and JSON timestamps arrive as strings which crash the
  // timestamp column mapper if inserted directly.
  const { farm, id, farmId: _farmId, createdAt, updatedAt, extra, ...fields } = req.body;
  const farmId = await farmIdByName(farm);
  if (!farmId) return res.status(400).json({ error: "Unknown farm" });

  // Same known-column split as PUT so flattened extra fields survive a copy
  const KNOWN_COLS = new Set([
    "name","desc","count","paddock","dse","species","type","breed","ageClass",
    "mgmtGroup","tag","whp","lastWeight","lastWeightDate","assumedADG",
    "daysInPaddock","wec","extra"
  ]);
  const knownFields = {};
  const extraFields = { ...(extra || {}) };
  for (const [k, v] of Object.entries(fields)) {
    if (KNOWN_COLS.has(k)) knownFields[k] = v;
    else extraFields[k] = v;
  }
  if (Object.keys(extraFields).length > 0) knownFields.extra = extraFields;

  const [created] = await db.insert(mobs).values({ ...knownFields, farmId, updatedAt: new Date() }).returning();
  res.status(201).json({ ...created, ...(created.extra || {}) });
});

// PUT /api/mobs/:id  body: { ...fields to update }
router.put("/:id", requireAuth, requireEditor, async (req, res) => {
  const { farm, id, farmId, createdAt, updatedAt, ...fields } = req.body;

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

// PUT /api/mobs/:id/archive — soft-delete: hides the mob from normal lists but
// keeps it (and its full history) in the database, so paddock/lambing reports
// that read from mob history are unaffected. Used by "recount to 0".
router.put("/:id/archive", requireAuth, requireEditor, async (req, res) => {
  const [updated] = await db
    .update(mobs)
    .set({ archived: true, archivedAt: new Date(), updatedAt: new Date() })
    .where(eq(mobs.id, Number(req.params.id)))
    .returning();
  if (!updated) return res.status(404).json({ error: "Mob not found" });
  res.json({ ...updated, ...(updated.extra || {}) });
});

// PUT /api/mobs/:id/restore — brings an archived mob back into normal lists
router.put("/:id/restore", requireAuth, requireEditor, async (req, res) => {
  const [updated] = await db
    .update(mobs)
    .set({ archived: false, archivedAt: null, updatedAt: new Date() })
    .where(eq(mobs.id, Number(req.params.id)))
    .returning();
  if (!updated) return res.status(404).json({ error: "Mob not found" });
  res.json({ ...updated, ...(updated.extra || {}) });
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

// POST /api/mobs/:id/merge  body: { intoMobId }
// Merges this mob into another mob: head count combines, and ALL history and
// notes move across (reassigned, not duplicated — the source mob disappears
// afterwards, so there's no risk of double-counting reports).
router.post("/:id/merge", requireAuth, requireEditor, async (req, res) => {
  const sourceId = Number(req.params.id);
  const targetId = Number(req.body.intoMobId);
  if (!targetId || targetId === sourceId) return res.status(400).json({ error: "Pick a different mob to merge into" });
  const [source] = await db.select().from(mobs).where(eq(mobs.id, sourceId));
  const [target] = await db.select().from(mobs).where(eq(mobs.id, targetId));
  if (!source || !target) return res.status(404).json({ error: "Mob not found" });
  if (source.species !== target.species) return res.status(400).json({ error: "Can't merge mobs of different species" });

  await db.update(mobHistory).set({ mobId: targetId }).where(eq(mobHistory.mobId, sourceId));
  await db.update(mobNotes).set({ mobId: targetId }).where(eq(mobNotes.mobId, sourceId));

  await db.insert(mobHistory).values({
    mobId: targetId,
    date: new Date().toISOString().slice(0, 10),
    action: "Merge",
    detail: `Merged ${source.count} head from ${source.name}${source.paddock ? ` (${source.paddock})` : ""}`,
    authorName: req.user?.name || null,
    paddock: target.paddock || null,
  });

  const [updatedTarget] = await db
    .update(mobs)
    .set({ count: (target.count || 0) + (source.count || 0), updatedAt: new Date() })
    .where(eq(mobs.id, targetId))
    .returning();

  await db.delete(mobs).where(eq(mobs.id, sourceId));

  res.json({ mergedMob: { ...updatedTarget, ...(updatedTarget.extra || {}) } });
});

// --- History ---
// POST /api/mobs/:id/copy-history  body: { fromMobId }
// Copies another mob's full history onto this one — used by Split/Copy so
// treatments (drench WHP evidence), scans and records follow the animals.
router.post("/:id/copy-history", requireAuth, requireEditor, async (req, res) => {
  const toId = Number(req.params.id);
  const fromId = Number(req.body.fromMobId);
  if (!fromId) return res.status(400).json({ error: "fromMobId is required" });
  const rows = await db.select().from(mobHistory).where(eq(mobHistory.mobId, fromId));
  // Treatments, moves etc. follow the animals — but SEASON records must not be
  // duplicated: copied Scans/Marks/Deaths/Start Lambing double-count in the
  // performance reports and leave phantom "live" seasons on the split portion.
  const EXCLUDE = new Set(["Scan", "Mark", "Wean", "Death", "Start Lambing", "End Lambing", "Start Calving", "End Calving", "Copy"]);
  const keep = rows.filter(r => !EXCLUDE.has(r.action));
  if (keep.length === 0) return res.json({ copied: 0 });
  const values = keep.map(({ id, createdAt, ...r }) => ({ ...r, mobId: toId }));
  await db.insert(mobHistory).values(values);
  res.json({ copied: values.length });
});

// PUT /api/mobs/:id/history/:historyId — edit a history entry (detail / date)
router.put("/:id/history/:historyId", requireAuth, requireEditor, async (req, res) => {
  const { detail, date, paddock } = req.body;
  const updates = {};
  if (detail !== undefined) updates.detail = detail;
  if (date !== undefined) updates.date = date;
  if (paddock !== undefined) updates.paddock = paddock;
  const [updated] = await db.update(mobHistory).set(updates)
    .where(eq(mobHistory.id, Number(req.params.historyId))).returning();
  if (!updated) return res.status(404).json({ error: "History entry not found" });
  res.json(updated);
});

// DELETE /api/mobs/:id/history/:historyId
router.delete("/:id/history/:historyId", requireAuth, requireEditor, async (req, res) => {
  const [deleted] = await db
    .delete(mobHistory)
    .where(eq(mobHistory.id, Number(req.params.historyId)))
    .returning();
  if (!deleted) return res.status(404).json({ error: "History entry not found" });
  res.json({ ok: true, deleted });
});

// GET /api/mobs/:id/history
router.get("/:id/history", requireAuth, async (req, res) => {
  const all = await db.select().from(mobHistory).where(eq(mobHistory.mobId, Number(req.params.id)));
  res.json(all);
});

// POST /api/mobs/:id/history  body: { date, action, detail }
router.post("/:id/history", requireAuth, requireEditor, async (req, res) => {
  const { date, action, detail } = req.body;
  const authorName = req.user?.name || null;
  // Record the paddock the mob is in RIGHT NOW — so per-paddock performance
  // reports (lambing etc.) attribute events correctly even after later moves
  let paddock = req.body.paddock || null;
  if (!paddock) {
    const [mobRow] = await db.select({ paddock: mobs.paddock }).from(mobs).where(eq(mobs.id, Number(req.params.id)));
    paddock = mobRow?.paddock || null;
  }
  const [created] = await db
    .insert(mobHistory)
    .values({ mobId: Number(req.params.id), date: date || new Date().toISOString().slice(0, 10), action, detail, authorName, paddock })
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
    history.forEach(h => allHistory.push({ ...h, mobName: mob.name, species: mob.species, breed: mob.breed, ageClass: mob.ageClass, tag: mob.tag, paddock: h.paddock || mob.paddock, mgmtGroup: mob.mgmtGroup }));
  }
  // Sort by date descending
  allHistory.sort((a, b) => (a.date < b.date ? 1 : -1));
  res.json(allHistory);
});
