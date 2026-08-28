import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { farms } from "../db/schema.js";
import { requireAuth, requireEditor } from "../auth.js";

const router = Router();

// GET /api/farms
router.get("/", requireAuth, async (req, res) => {
  const all = await db.select().from(farms);
  res.json(all);
});

// PUT /api/farms/:id  body: { dseIntakePerDay, seasonType } — grazing-days-remaining settings
router.put("/:id", requireAuth, requireEditor, async (req, res) => {
  const { dseIntakePerDay, seasonType } = req.body;
  const updates = {};
  if (dseIntakePerDay !== undefined) updates.dseIntakePerDay = dseIntakePerDay;
  if (seasonType !== undefined) updates.seasonType = seasonType;
  const [updated] = await db.update(farms).set(updates).where(eq(farms.id, Number(req.params.id))).returning();
  if (!updated) return res.status(404).json({ error: "Farm not found" });
  res.json(updated);
});

export default router;
