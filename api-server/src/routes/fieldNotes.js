import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { fieldNotes, farms } from "../db/schema.js";
import { requireAuth } from "../auth.js";

const router = Router();

async function farmIdByName(name) {
  const [farm] = await db.select().from(farms).where(eq(farms.name, name));
  return farm?.id || null;
}

// GET /api/field-notes?farm=Arundale
router.get("/", requireAuth, async (req, res) => {
  const farmName = req.query.farm;
  if (!farmName) return res.status(400).json({ error: "farm query param required" });
  const farmId = await farmIdByName(farmName);
  if (!farmId) return res.json([]);
  const notes = await db
    .select()
    .from(fieldNotes)
    .where(eq(fieldNotes.farmId, farmId))
    .orderBy(desc(fieldNotes.createdAt));
  res.json(notes);
});

// POST /api/field-notes
router.post("/", requireAuth, async (req, res) => {
  const { farm, ...fields } = req.body;
  const farmId = await farmIdByName(farm);
  if (!farmId) return res.status(400).json({ error: "Unknown farm" });
  // Attach author info from token
  fields.authorId = req.user?.id || null;
  fields.authorName = req.user?.name || fields.authorName || "Unknown";
  const [created] = await db
    .insert(fieldNotes)
    .values({ ...fields, farmId, farmName: farm })
    .returning();
  res.status(201).json(created);
});

// PUT /api/field-notes/:id  (edit body/category/priority, or mark resolved)
router.put("/:id", requireAuth, async (req, res) => {
  const { farm, ...fields } = req.body;
  const [updated] = await db
    .update(fieldNotes)
    .set(fields)
    .where(eq(fieldNotes.id, Number(req.params.id)))
    .returning();
  if (!updated) return res.status(404).json({ error: "Note not found" });
  res.json(updated);
});

// DELETE /api/field-notes/:id
router.delete("/:id", requireAuth, async (req, res) => {
  await db.delete(fieldNotes).where(eq(fieldNotes.id, Number(req.params.id)));
  res.json({ ok: true });
});

export default router;
