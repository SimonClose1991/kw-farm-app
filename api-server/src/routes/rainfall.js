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
