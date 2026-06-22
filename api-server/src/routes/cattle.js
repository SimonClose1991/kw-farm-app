import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { cattleElements, cattleAnimalClasses, cattleRecipes, cattleMobs, cattleLoads, cattleLoadAssignments, cattleFeedHistory } from "../db/schema.js";
import { requireAuth } from "../auth.js";

const router = Router();
const uuid = () => crypto.randomUUID();

// ── Elements ─────────────────────────────────────────────────────────────────
router.get("/elements", requireAuth, async (req, res) => {
  res.json(await db.select().from(cattleElements));
});
router.post("/elements", requireAuth, async (req, res) => {
  try {
    const [created] = await db.insert(cattleElements).values({ ...req.body, id: uuid() }).returning();
    res.status(201).json(created);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.patch("/elements/:id", requireAuth, async (req, res) => {
  try {
    const [updated] = await db.update(cattleElements).set(req.body).where(eq(cattleElements.id, req.params.id)).returning();
    updated ? res.json(updated) : res.status(404).json({ error: "Not found" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete("/elements/:id", requireAuth, async (req, res) => {
  await db.delete(cattleElements).where(eq(cattleElements.id, req.params.id));
  res.status(204).send();
});

// ── Animal Classes ────────────────────────────────────────────────────────────
router.get("/animal-classes", requireAuth, async (req, res) => {
  res.json(await db.select().from(cattleAnimalClasses));
});
router.post("/animal-classes", requireAuth, async (req, res) => {
  try {
    const [created] = await db.insert(cattleAnimalClasses).values({ ...req.body, id: uuid() }).returning();
    res.status(201).json(created);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete("/animal-classes/:id", requireAuth, async (req, res) => {
  await db.delete(cattleAnimalClasses).where(eq(cattleAnimalClasses.id, req.params.id));
  res.status(204).send();
});

// ── Recipes ───────────────────────────────────────────────────────────────────
router.get("/recipes", requireAuth, async (req, res) => {
  res.json(await db.select().from(cattleRecipes));
});
router.post("/recipes", requireAuth, async (req, res) => {
  try {
    const [created] = await db.insert(cattleRecipes).values({ ...req.body, id: uuid() }).returning();
    res.status(201).json(created);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put("/recipes", requireAuth, async (req, res) => {
  // Replace all recipes for a class
  try {
    const { className, recipes } = req.body;
    await db.delete(cattleRecipes).where(eq(cattleRecipes.className, className));
    if (recipes?.length > 0) {
      await db.insert(cattleRecipes).values(recipes.map((r) => ({ ...r, id: uuid() })));
    }
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete("/recipes/:id", requireAuth, async (req, res) => {
  await db.delete(cattleRecipes).where(eq(cattleRecipes.id, req.params.id));
  res.status(204).send();
});

// ── Cattle Mobs ───────────────────────────────────────────────────────────────
router.get("/cattle-mobs", requireAuth, async (req, res) => {
  res.json(await db.select().from(cattleMobs));
});
router.post("/cattle-mobs", requireAuth, async (req, res) => {
  try {
    const [created] = await db.insert(cattleMobs).values({ ...req.body, id: uuid() }).returning();
    res.status(201).json(created);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.patch("/cattle-mobs/:id", requireAuth, async (req, res) => {
  try {
    const [updated] = await db.update(cattleMobs).set(req.body).where(eq(cattleMobs.id, req.params.id)).returning();
    updated ? res.json(updated) : res.status(404).json({ error: "Not found" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete("/cattle-mobs/:id", requireAuth, async (req, res) => {
  await db.delete(cattleMobs).where(eq(cattleMobs.id, req.params.id));
  res.status(204).send();
});

// ── Loads ─────────────────────────────────────────────────────────────────────
router.get("/loads", requireAuth, async (req, res) => {
  res.json(await db.select().from(cattleLoads));
});
router.post("/loads", requireAuth, async (req, res) => {
  try {
    const [created] = await db.insert(cattleLoads).values({ ...req.body, id: uuid() }).returning();
    res.status(201).json(created);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete("/loads/:id", requireAuth, async (req, res) => {
  await db.delete(cattleLoads).where(eq(cattleLoads.id, req.params.id));
  res.status(204).send();
});

// ── Load Assignments ──────────────────────────────────────────────────────────
router.get("/load-assignments", requireAuth, async (req, res) => {
  res.json(await db.select().from(cattleLoadAssignments));
});
router.post("/load-assignments", requireAuth, async (req, res) => {
  try {
    const [created] = await db.insert(cattleLoadAssignments).values({ ...req.body, id: uuid() }).returning();
    res.status(201).json(created);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete("/load-assignments/:id", requireAuth, async (req, res) => {
  await db.delete(cattleLoadAssignments).where(eq(cattleLoadAssignments.id, req.params.id));
  res.status(204).send();
});

// ── Cattle Feed History ───────────────────────────────────────────────────────
router.get("/cattle-history", requireAuth, async (req, res) => {
  const history = await db.select().from(cattleFeedHistory)
    .orderBy(cattleFeedHistory.startedAt);
  res.json(history.reverse());
});
router.post("/cattle-history", requireAuth, async (req, res) => {
  try {
    const [created] = await db.insert(cattleFeedHistory).values({ ...req.body, id: uuid() }).returning();
    res.status(201).json(created);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
