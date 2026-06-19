import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { paddocks, farms } from "../db/schema.js";
import { requireAuth, requireEditor } from "../auth.js";

const router = Router();

async function farmIdByName(name) {
  const [farm] = await db.select().from(farms).where(eq(farms.name, name));
  return farm?.id || null;
}

// GET /api/paddocks?farm=Arundale
router.get("/", requireAuth, async (req, res) => {
  const farmName = req.query.farm;
  if (!farmName) return res.status(400).json({ error: "farm query param is required" });
  const farmId = await farmIdByName(farmName);
  if (!farmId) return res.json([]);
  const all = await db.select().from(paddocks).where(eq(paddocks.farmId, farmId));
  res.json(all);
});

// POST /api/paddocks  body: { farm, name, ha, landUse, pasture, colour, geojson }
router.post("/", requireAuth, requireEditor, async (req, res) => {
  const { farm, ...fields } = req.body;
  const farmId = await farmIdByName(farm);
  if (!farmId) return res.status(400).json({ error: "Unknown farm" });
  const [created] = await db.insert(paddocks).values({ ...fields, farmId, updatedAt: new Date() }).returning();
  res.status(201).json(created);
});

// PUT /api/paddocks/:id
router.put("/:id", requireAuth, requireEditor, async (req, res) => {
  const { farm, ...fields } = req.body;
  const [updated] = await db
    .update(paddocks)
    .set({ ...fields, updatedAt: new Date() })
    .where(eq(paddocks.id, Number(req.params.id)))
    .returning();
  if (!updated) return res.status(404).json({ error: "Paddock not found" });
  res.json(updated);
});

// DELETE /api/paddocks/:id
router.delete("/:id", requireAuth, requireEditor, async (req, res) => {
  await db.delete(paddocks).where(eq(paddocks.id, Number(req.params.id)));
  res.json({ ok: true });
});

export default router;
