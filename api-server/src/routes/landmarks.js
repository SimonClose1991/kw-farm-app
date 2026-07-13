import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { landmarks, farms } from "../db/schema.js";
import { requireAuth, requireEditor } from "../auth.js";

const router = Router();

async function farmIdByName(name) {
  const [farm] = await db.select().from(farms).where(eq(farms.name, name));
  return farm?.id || null;
}

// GET /api/landmarks?farm=Arundale
router.get("/", requireAuth, async (req, res) => {
  const farmName = req.query.farm;
  if (!farmName) return res.status(400).json({ error: "farm query param is required" });
  const farmId = await farmIdByName(farmName);
  if (!farmId) return res.json([]);
  const all = await db.select().from(landmarks).where(eq(landmarks.farmId, farmId));
  res.json(all);
});

// POST /api/landmarks  body: { farm, type, name, paddock, colour, notes, lat, lng }
router.post("/", requireAuth, requireEditor, async (req, res) => {
  const { farm, ...fields } = req.body;
  const farmId = await farmIdByName(farm);
  if (!farmId) return res.status(400).json({ error: "Unknown farm" });
  const [created] = await db.insert(landmarks).values({ ...fields, farmId }).returning();
  res.status(201).json(created);
});

// PUT /api/landmarks/:id
router.put("/:id", requireAuth, requireEditor, async (req, res) => {
  const { farm, id, farmId, createdAt, ...fields } = req.body;
  const [updated] = await db
    .update(landmarks)
    .set(fields)
    .where(eq(landmarks.id, Number(req.params.id)))
    .returning();
  if (!updated) return res.status(404).json({ error: "Landmark not found" });
  res.json(updated);
});

// DELETE /api/landmarks/:id
router.delete("/:id", requireAuth, requireEditor, async (req, res) => {
  await db.delete(landmarks).where(eq(landmarks.id, Number(req.params.id)));
  res.json({ ok: true });
});

export default router;
