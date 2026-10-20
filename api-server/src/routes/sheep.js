import { Router } from "express";
import { randomUUID } from "crypto";
import { eq, asc, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { sheepPens, sheepFeedHistory, sheepSettings, sheepCurrentRun } from "../db/schema.js";
import { requireAuth, requireEditor, requireAdmin } from "../auth.js";

const router = Router();

// Express 4 doesn't catch errors thrown in async handlers — without this a
// failed query leaves the request hanging instead of returning an error
const handle = (fn) => (req, res) =>
  Promise.resolve(fn(req, res)).catch((err) => {
    console.error("Sheep feeding error:", err);
    res.status(500).json({ error: "Something went wrong on the server" });
  });

// Drizzle returns NUMERIC columns as strings — hand the client real numbers
const penOut = (p) => ({ ...p, kgPerHead: Number(p.kgPerHead) });
const runOut = (r) => ({ ...r, splitFraction: Number(r.splitFraction) });

const clampInt = (v, min, max) => Math.max(min, Math.min(max, Math.round(Number(v) || 0)));

// ── Pens ─────────────────────────────────────────────────────────────────────
// Pens are saved one at a time. (This used to delete EVERY pen and re-insert the
// whole list on each save, outside a transaction — one failure part-way and all
// pens were gone.)
router.get("/pens", requireAuth, handle(async (req, res) => {
  const pens = await db.select().from(sheepPens).orderBy(asc(sheepPens.orderIndex));
  res.json(pens.map(penOut));
}));

router.post("/pens", requireAuth, requireEditor, handle(async (req, res) => {
  const { name, ration, headCount, kgPerHead, rationPercent, active } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: "Pen name is required" });
  const existing = await db.select({ orderIndex: sheepPens.orderIndex }).from(sheepPens);
  const nextOrder = existing.reduce((m, p) => Math.max(m, p.orderIndex), -1) + 1;
  const [created] = await db.insert(sheepPens).values({
    id: randomUUID(),
    name: String(name).trim(),
    ration: String(ration || "Grower").trim(),
    headCount: clampInt(headCount, 0, 1000000),
    kgPerHead: String(Math.max(0, Number(kgPerHead) || 0)),
    rationPercent: clampInt(rationPercent ?? 100, 0, 200),
    active: active !== false,
    orderIndex: nextOrder,
  }).returning();
  res.status(201).json(penOut(created));
}));

// Must come before "/pens/:id" or "order" would be read as a pen id
router.put("/pens/order", requireAuth, requireEditor, handle(async (req, res) => {
  const ids = req.body?.ids;
  if (!Array.isArray(ids)) return res.status(400).json({ error: "Expected a list of pen ids" });
  await db.transaction(async (tx) => {
    for (let i = 0; i < ids.length; i++) {
      await tx.update(sheepPens).set({ orderIndex: i }).where(eq(sheepPens.id, String(ids[i])));
    }
  });
  res.json({ ok: true });
}));

router.put("/pens/:id", requireAuth, requireEditor, handle(async (req, res) => {
  const b = req.body || {};
  const updates = {};
  if (b.name !== undefined) {
    if (!String(b.name).trim()) return res.status(400).json({ error: "Pen name can't be blank" });
    updates.name = String(b.name).trim();
  }
  if (b.ration !== undefined) updates.ration = String(b.ration).trim();
  if (b.headCount !== undefined) updates.headCount = clampInt(b.headCount, 0, 1000000);
  if (b.kgPerHead !== undefined) updates.kgPerHead = String(Math.max(0, Number(b.kgPerHead) || 0));
  if (b.rationPercent !== undefined) updates.rationPercent = clampInt(b.rationPercent, 0, 200);
  if (b.active !== undefined) updates.active = !!b.active;
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: "Nothing to update" });
  const [updated] = await db.update(sheepPens).set(updates).where(eq(sheepPens.id, req.params.id)).returning();
  if (!updated) return res.status(404).json({ error: "Pen not found" });
  res.json(penOut(updated));
}));

// Deliberately open to every logged-in user (incl. Workers): bumping a pen's ration
// % and leaving a note ("UP") is part of the feed run itself. Nothing else about
// the pen can be changed through this route.
router.patch("/pens/:id/ration", requireAuth, handle(async (req, res) => {
  const b = req.body || {};
  const updates = {};
  if (b.rationPercent !== undefined) updates.rationPercent = clampInt(b.rationPercent, 0, 200);
  if (b.notes !== undefined) updates.notes = b.notes ? String(b.notes).slice(0, 500) : null;
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: "Nothing to update" });
  const [updated] = await db.update(sheepPens).set(updates).where(eq(sheepPens.id, req.params.id)).returning();
  if (!updated) return res.status(404).json({ error: "Pen not found" });
  res.json(penOut(updated));
}));

router.delete("/pens/:id", requireAuth, requireEditor, handle(async (req, res) => {
  await db.delete(sheepPens).where(eq(sheepPens.id, req.params.id));
  res.json({ ok: true });
}));

// ── Settings ─────────────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = { splitAm: 0.6, splitPm: 0.4, bufferPercent: 0, ingredients: [] };

const settingsOut = (s) => !s ? DEFAULT_SETTINGS : ({
  splitAm: Number(s.splitAm ?? 0.6),
  splitPm: Number(s.splitPm ?? 0.4),
  bufferPercent: Number(s.bufferPercent ?? 0),
  ingredients: Array.isArray(s.ingredients) ? s.ingredients : [],
  // adminPin / defaultFeeder are deliberately NOT sent — the old PIN column is
  // unused and must never be handed to every browser
});

// Everyone who feeds needs these (splits, ingredients, buffer) so reading is open
// to all logged-in users; changing them is Admin only.
router.get("/settings", requireAuth, handle(async (req, res) => {
  const [s] = await db.select().from(sheepSettings).where(eq(sheepSettings.id, "singleton"));
  res.json(settingsOut(s));
}));

router.put("/settings", requireAuth, requireAdmin, handle(async (req, res) => {
  const b = req.body || {};
  const updates = {};
  if (b.splitAm !== undefined || b.splitPm !== undefined) {
    const am = Number(b.splitAm), pm = Number(b.splitPm);
    if (!(am >= 0 && am <= 1 && pm >= 0 && pm <= 1) || Math.abs(am + pm - 1) > 0.001) {
      return res.status(400).json({ error: "AM and PM split must add up to 100%" });
    }
    updates.splitAm = String(am);
    updates.splitPm = String(pm);
  }
  if (b.bufferPercent !== undefined) {
    const buf = Number(b.bufferPercent);
    if (!(buf >= 0 && buf <= 100)) return res.status(400).json({ error: "Buffer must be between 0 and 100%" });
    updates.bufferPercent = String(buf);
  }
  if (b.ingredients !== undefined) {
    if (!Array.isArray(b.ingredients)) return res.status(400).json({ error: "Ingredients must be a list" });
    const clean = [];
    for (const ing of b.ingredients) {
      const name = String(ing?.name || "").trim();
      const kg = Number(ing?.kgPerHead);
      if (!name || !(kg >= 0)) return res.status(400).json({ error: "Every ingredient needs a name and a kg amount" });
      clean.push({ name, kgPerHead: kg });
    }
    updates.ingredients = clean;
  }
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: "Nothing to update" });
  const existing = await db.select().from(sheepSettings).where(eq(sheepSettings.id, "singleton"));
  if (existing.length > 0) {
    await db.update(sheepSettings).set(updates).where(eq(sheepSettings.id, "singleton"));
  } else {
    await db.insert(sheepSettings).values({ id: "singleton", ...updates });
  }
  const [s] = await db.select().from(sheepSettings).where(eq(sheepSettings.id, "singleton"));
  res.json(settingsOut(s));
}));

// ── Feed history ──────────────────────────────────────────────────────────────
router.get("/history", requireAuth, handle(async (req, res) => {
  const history = await db.select().from(sheepFeedHistory).orderBy(desc(sheepFeedHistory.startedAt));
  res.json(history.map(runOut));
}));

// Any feeder can finish a run; only Admin/Manager can delete one (below)
router.post("/history", requireAuth, handle(async (req, res) => {
  const b = req.body || {};
  const started = new Date(b.startedAt);
  if (isNaN(started.getTime())) return res.status(400).json({ error: "Run has no valid start time" });
  if (b.period !== "AM" && b.period !== "PM") return res.status(400).json({ error: "Period must be AM or PM" });
  if (!Array.isArray(b.events)) return res.status(400).json({ error: "Run has no events" });
  const finished = b.finishedAt ? new Date(b.finishedAt) : new Date();
  const [created] = await db.insert(sheepFeedHistory).values({
    id: b.id || randomUUID(),
    startedAt: started,
    finishedAt: isNaN(finished.getTime()) ? new Date() : finished,
    feeder: b.feeder ? String(b.feeder).slice(0, 100) : null,
    period: b.period,
    splitFraction: String(Number(b.splitFraction) || 0),
    events: b.events,
  }).returning();
  res.status(201).json(runOut(created));
}));

router.delete("/history/:id", requireAuth, requireEditor, handle(async (req, res) => {
  await db.delete(sheepFeedHistory).where(eq(sheepFeedHistory.id, req.params.id));
  res.json({ ok: true });
}));

// ── In-progress run (one shared run so it survives a reload / phone swap) ─────
router.get("/current-run", requireAuth, handle(async (req, res) => {
  const [run] = await db.select().from(sheepCurrentRun).where(eq(sheepCurrentRun.id, "singleton"));
  res.json(run ? runOut(run) : null);
}));

router.put("/current-run", requireAuth, handle(async (req, res) => {
  const b = req.body || {};
  const started = new Date(b.startedAt);
  if (isNaN(started.getTime())) return res.status(400).json({ error: "Run has no valid start time" });
  if (b.period !== "AM" && b.period !== "PM") return res.status(400).json({ error: "Period must be AM or PM" });
  if (!Array.isArray(b.events)) return res.status(400).json({ error: "Run has no events" });
  const values = {
    startedAt: started,
    feeder: b.feeder ? String(b.feeder).slice(0, 100) : null,
    period: b.period,
    splitFraction: String(Number(b.splitFraction) || 0),
    events: b.events,
    penIndex: clampInt(b.penIndex, 0, 100000),
  };
  const existing = await db.select().from(sheepCurrentRun).where(eq(sheepCurrentRun.id, "singleton"));
  if (existing.length > 0) {
    await db.update(sheepCurrentRun).set(values).where(eq(sheepCurrentRun.id, "singleton"));
  } else {
    await db.insert(sheepCurrentRun).values({ id: "singleton", ...values });
  }
  res.json({ ok: true });
}));

router.delete("/current-run", requireAuth, handle(async (req, res) => {
  await db.delete(sheepCurrentRun).where(eq(sheepCurrentRun.id, "singleton"));
  res.json({ ok: true });
}));

export default router;
