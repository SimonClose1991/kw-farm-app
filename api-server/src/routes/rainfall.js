import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { rainfallRecords, farms } from "../db/schema.js";
import { requireAuth, requireEditor } from "../auth.js";

const router = Router();

async function farmIdByName(name) {
  const [farm] = await db.select().from(farms).where(eq(farms.name, name));
  return farm?.id || null;
}

// GET /api/rainfall?farm=Arundale
router.get("/", requireAuth, async (req, res) => {
  const farmId = await farmIdByName(req.query.farm);
  if (!farmId) return res.json([]);
  const all = await db.select().from(rainfallRecords).where(eq(rainfallRecords.farmId, farmId));
  res.json(all);
});

// POST /api/rainfall  body: { farm, date, mm }
router.post("/", requireAuth, requireEditor, async (req, res) => {
  const { farm, date, mm } = req.body;
  const farmId = await farmIdByName(farm);
  if (!farmId) return res.status(400).json({ error: "Unknown farm" });
  const [created] = await db.insert(rainfallRecords).values({ farmId, date, mm }).returning();
  res.status(201).json(created);
});

export default router;

// PUT /api/rainfall/:id
router.put("/:id", requireAuth, async (req, res) => {
  const { date, mm } = req.body;
  const [updated] = await db.update(rainfallRecords)
    .set({ ...(date && { date }), ...(mm && { mm: String(mm) }) })
    .where(eq(rainfallRecords.id, Number(req.params.id)))
    .returning();
  if (!updated) return res.status(404).json({ error: "Record not found" });
  res.json(updated);
});

// DELETE /api/rainfall/:id
router.delete("/:id", requireAuth, async (req, res) => {
  await db.delete(rainfallRecords).where(eq(rainfallRecords.id, Number(req.params.id)));
  res.json({ ok: true });
});
