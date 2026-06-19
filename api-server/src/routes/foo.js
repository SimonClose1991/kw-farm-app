import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { fooHistory, farms } from "../db/schema.js";
import { requireAuth, requireEditor } from "../auth.js";

const router = Router();

async function farmIdByName(name) {
  const [farm] = await db.select().from(farms).where(eq(farms.name, name));
  return farm?.id || null;
}

// GET /api/foo?farm=Arundale
router.get("/", requireAuth, async (req, res) => {
  const farmId = await farmIdByName(req.query.farm);
  if (!farmId) return res.json([]);
  const all = await db.select().from(fooHistory).where(eq(fooHistory.farmId, farmId));
  res.json(all);
});

// POST /api/foo  body: { farm, paddock, date, kgDm, height, cover, notes }
router.post("/", requireAuth, requireEditor, async (req, res) => {
  const { farm, ...fields } = req.body;
  const farmId = await farmIdByName(farm);
  if (!farmId) return res.status(400).json({ error: "Unknown farm" });
  const [created] = await db.insert(fooHistory).values({ ...fields, farmId }).returning();
  res.status(201).json(created);
});

export default router;
