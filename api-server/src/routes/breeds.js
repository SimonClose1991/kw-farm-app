import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/index.js";
import { customBreeds } from "../db/schema.js";
import { requireAuth, requireEditor } from "../auth.js";

const router = Router();

// GET /api/breeds — all remembered custom breeds, grouped by species
router.get("/", requireAuth, async (req, res) => {
  const all = await db.select().from(customBreeds);
  const grouped = {};
  for (const row of all) {
    if (!grouped[row.species]) grouped[row.species] = [];
    grouped[row.species].push(row.breed);
  }
  res.json(grouped);
});

// POST /api/breeds  body: { species, breed }
router.post("/", requireAuth, requireEditor, async (req, res) => {
  const { species, breed } = req.body;
  if (!species || !breed) return res.status(400).json({ error: "species and breed are required" });
  const existing = await db
    .select()
    .from(customBreeds)
    .where(and(eq(customBreeds.species, species), eq(customBreeds.breed, breed)));
  if (existing.length === 0) {
    await db.insert(customBreeds).values({ species, breed });
  }
  res.status(201).json({ ok: true });
});

export default router;
