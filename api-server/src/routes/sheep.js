import { Router } from "express";
import { eq, asc } from "drizzle-orm";
import { db } from "../db/index.js";
import { sheepPens, sheepFeedHistory, sheepSettings } from "../db/schema.js";
import { requireAuth } from "../auth.js";

const router = Router();

// ── Pens ─────────────────────────────────────────────────────────────────────
router.get("/pens", requireAuth, async (req, res) => {
  const pens = await db.select().from(sheepPens).orderBy(asc(sheepPens.orderIndex));
  res.json(pens);
});

router.post("/pens", requireAuth, async (req, res) => {
  try {
    const pensArray = Array.isArray(req.body) ? req.body : req.body.pens;
    if (!Array.isArray(pensArray)) return res.status(400).json({ error: "Expected array of pens" });
    // Replace all pens (same pattern as the original app)
    await db.delete(sheepPens);
    if (pensArray.length > 0) {
      await db.insert(sheepPens).values(
        pensArray.map((p, i) => ({ ...p, orderIndex: i }))
      );
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("Sheep pens save error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── Settings ─────────────────────────────────────────────────────────────────
router.get("/settings", requireAuth, async (req, res) => {
  const [s] = await db.select().from(sheepSettings).where(eq(sheepSettings.id, "singleton"));
  res.json(s || { id: "singleton", splitAm: 0.6, splitPm: 0.4, bufferPercent: 0 });
});

router.put("/settings", requireAuth, async (req, res) => {
  try {
    const existing = await db.select().from(sheepSettings).where(eq(sheepSettings.id, "singleton"));
    if (existing.length > 0) {
      await db.update(sheepSettings).set(req.body).where(eq(sheepSettings.id, "singleton"));
    } else {
      await db.insert(sheepSettings).values({ ...req.body, id: "singleton" });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Feed history ──────────────────────────────────────────────────────────────
router.get("/history", requireAuth, async (req, res) => {
  const history = await db.select().from(sheepFeedHistory)
    .orderBy(sheepFeedHistory.startedAt);
  res.json(history.reverse()); // newest first
});

router.post("/history", requireAuth, async (req, res) => {
  try {
    const [created] = await db.insert(sheepFeedHistory).values(req.body).returning();
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/history/:id", requireAuth, async (req, res) => {
  await db.delete(sheepFeedHistory).where(eq(sheepFeedHistory.id, req.params.id));
  res.json({ ok: true });
});

export default router;
