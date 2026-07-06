import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { treatmentInventory, sprayInventory, farms } from "../db/schema.js";
import { requireAuth, requireEditor } from "../auth.js";

const router = Router();

async function farmIdByName(name) {
  const [farm] = await db.select().from(farms).where(eq(farms.name, name));
  return farm?.id || null;
}

// GET /api/inventory/treatments?farm=Arundale
router.get("/treatments", requireAuth, async (req, res) => {
  const farmId = await farmIdByName(req.query.farm);
  if (!farmId) return res.json([]);
  const all = await db.select().from(treatmentInventory).where(eq(treatmentInventory.farmId, farmId));
  res.json(all);
});

router.post("/treatments", requireAuth, requireEditor, async (req, res) => {
  const { farm, ...fields } = req.body;
  const farmId = await farmIdByName(farm);
  if (!farmId) return res.status(400).json({ error: "Unknown farm" });
  const [created] = await db.insert(treatmentInventory).values({ ...fields, farmId }).returning();
  res.status(201).json(created);
});

router.delete("/treatments/:id", requireAuth, requireEditor, async (req, res) => {
  await db.delete(treatmentInventory).where(eq(treatmentInventory.id, Number(req.params.id)));
  res.json({ ok: true });
});

// PUT /api/inventory/treatments/:id — update fields including quantityUsed
router.put("/treatments/:id", requireAuth, requireEditor, async (req, res) => {
  const { farm, ...fields } = req.body;
  const [updated] = await db.update(treatmentInventory).set(fields)
    .where(eq(treatmentInventory.id, Number(req.params.id))).returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(updated);
});

// GET /api/inventory/spray?farm=Arundale
router.get("/spray", requireAuth, async (req, res) => {
  const farmId = await farmIdByName(req.query.farm);
  if (!farmId) return res.json([]);
  const all = await db.select().from(sprayInventory).where(eq(sprayInventory.farmId, farmId));
  res.json(all);
});

router.post("/spray", requireAuth, requireEditor, async (req, res) => {
  const { farm, ...fields } = req.body;
  const farmId = await farmIdByName(farm);
  if (!farmId) return res.status(400).json({ error: "Unknown farm" });
  const [created] = await db.insert(sprayInventory).values({ ...fields, farmId }).returning();
  res.status(201).json(created);
});

router.delete("/spray/:id", requireAuth, requireEditor, async (req, res) => {
  await db.delete(sprayInventory).where(eq(sprayInventory.id, Number(req.params.id)));
  res.json({ ok: true });
});

// PUT /api/inventory/spray/:id
router.put("/spray/:id", requireAuth, requireEditor, async (req, res) => {
  const { farm, ...fields } = req.body;
  const [updated] = await db.update(sprayInventory).set(fields)
    .where(eq(sprayInventory.id, Number(req.params.id))).returning();
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(updated);
});

export default router;
