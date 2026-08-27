import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { soilTests, farms } from "../db/schema.js";
import { requireAuth, requireEditor } from "../auth.js";

const router = Router();

async function farmIdByName(name) {
  const [farm] = await db.select().from(farms).where(eq(farms.name, name));
  return farm?.id || null;
}

// GET /api/soil-tests?farm=Arundale&paddock=Back Creek
router.get("/", requireAuth, async (req, res) => {
  const farmId = await farmIdByName(req.query.farm);
  if (!farmId) return res.json([]);
  const conditions = [eq(soilTests.farmId, farmId)];
  if (req.query.paddock) conditions.push(eq(soilTests.paddock, req.query.paddock));
  const all = await db.select().from(soilTests).where(and(...conditions));
  res.json(all);
});

// POST /api/soil-tests  body: { farm, paddock, zone, testDate, limedDate, limeRate, elements, notes }
router.post("/", requireAuth, requireEditor, async (req, res) => {
  const { farm, paddock, zone, testDate, limedDate, limeRate, elements, notes } = req.body;
  if (!paddock || !testDate) return res.status(400).json({ error: "Paddock and test date are required" });
  const farmId = await farmIdByName(farm);
  if (!farmId) return res.status(400).json({ error: "Unknown farm" });
  const authorName = req.user?.name || null;
  const [created] = await db.insert(soilTests).values({
    farmId, paddock, zone: zone || null, testDate,
    limedDate: limedDate || null, limeRate: limeRate || null,
    elements: elements || {}, notes: notes || null, authorName,
  }).returning();
  res.status(201).json(created);
});

// PUT /api/soil-tests/:id
router.put("/:id", requireAuth, requireEditor, async (req, res) => {
  const { paddock, zone, testDate, limedDate, limeRate, elements, notes } = req.body;
  const updates = {};
  if (paddock !== undefined) updates.paddock = paddock;
  if (zone !== undefined) updates.zone = zone || null;
  if (testDate !== undefined) updates.testDate = testDate;
  if (limedDate !== undefined) updates.limedDate = limedDate || null;
  if (limeRate !== undefined) updates.limeRate = limeRate || null;
  if (elements !== undefined) updates.elements = elements;
  if (notes !== undefined) updates.notes = notes || null;
  const [updated] = await db.update(soilTests).set(updates).where(eq(soilTests.id, Number(req.params.id))).returning();
  if (!updated) return res.status(404).json({ error: "Soil test not found" });
  res.json(updated);
});

// DELETE /api/soil-tests/:id
router.delete("/:id", requireAuth, requireEditor, async (req, res) => {
  await db.delete(soilTests).where(eq(soilTests.id, Number(req.params.id)));
  res.json({ ok: true });
});

export default router;
