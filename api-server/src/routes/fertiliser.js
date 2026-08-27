import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { fertiliserApplications, farms } from "../db/schema.js";
import { requireAuth, requireEditor } from "../auth.js";

const router = Router();

async function farmIdByName(name) {
  const [farm] = await db.select().from(farms).where(eq(farms.name, name));
  return farm?.id || null;
}

// GET /api/fertiliser?farm=Arundale&paddock=Back Creek
router.get("/", requireAuth, async (req, res) => {
  const farmId = await farmIdByName(req.query.farm);
  if (!farmId) return res.json([]);
  const conditions = [eq(fertiliserApplications.farmId, farmId)];
  if (req.query.paddock) conditions.push(eq(fertiliserApplications.paddock, req.query.paddock));
  const all = await db.select().from(fertiliserApplications).where(and(...conditions));
  res.json(all);
});

// POST /api/fertiliser  body: { farm, paddock, date, category, product, rate, areaHa, totalQuantity, contractor, cost, notes }
router.post("/", requireAuth, requireEditor, async (req, res) => {
  const { farm, paddock, date, category, product, rate, areaHa, totalQuantity, contractor, cost, notes } = req.body;
  if (!paddock || !date || !product) return res.status(400).json({ error: "Paddock, date and product are required" });
  const farmId = await farmIdByName(farm);
  if (!farmId) return res.status(400).json({ error: "Unknown farm" });
  const authorName = req.user?.name || null;
  const [created] = await db.insert(fertiliserApplications).values({
    farmId, paddock, date, category: category || "maintenance", product,
    rate: rate || null, areaHa: areaHa || null, totalQuantity: totalQuantity || null,
    contractor: contractor || null, cost: cost || null, notes: notes || null, authorName,
  }).returning();
  res.status(201).json(created);
});

// PUT /api/fertiliser/:id
router.put("/:id", requireAuth, requireEditor, async (req, res) => {
  const { paddock, date, category, product, rate, areaHa, totalQuantity, contractor, cost, notes } = req.body;
  const updates = {};
  if (paddock !== undefined) updates.paddock = paddock;
  if (date !== undefined) updates.date = date;
  if (category !== undefined) updates.category = category;
  if (product !== undefined) updates.product = product;
  if (rate !== undefined) updates.rate = rate || null;
  if (areaHa !== undefined) updates.areaHa = areaHa || null;
  if (totalQuantity !== undefined) updates.totalQuantity = totalQuantity || null;
  if (contractor !== undefined) updates.contractor = contractor || null;
  if (cost !== undefined) updates.cost = cost || null;
  if (notes !== undefined) updates.notes = notes || null;
  const [updated] = await db.update(fertiliserApplications).set(updates).where(eq(fertiliserApplications.id, Number(req.params.id))).returning();
  if (!updated) return res.status(404).json({ error: "Fertiliser record not found" });
  res.json(updated);
});

// DELETE /api/fertiliser/:id
router.delete("/:id", requireAuth, requireEditor, async (req, res) => {
  await db.delete(fertiliserApplications).where(eq(fertiliserApplications.id, Number(req.params.id)));
  res.json({ ok: true });
});

export default router;
