import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { fieldNotes, farms } from "../db/schema.js";
import { requireAuth } from "../auth.js";

const router = Router();

async function farmIdByName(name) {
  const [farm] = await db.select().from(farms).where(eq(farms.name, name));
  return farm?.id || null;
}

// GET /api/field-notes?farm=Arundale
router.get("/", requireAuth, async (req, res) => {
  try {
    const farmName = req.query.farm;
    if (!farmName) return res.status(400).json({ error: "farm query param required" });
    const farmId = await farmIdByName(farmName);
    if (!farmId) return res.json([]);
    const notes = await db
      .select()
      .from(fieldNotes)
      .where(eq(fieldNotes.farmId, farmId))
      .orderBy(desc(fieldNotes.createdAt));
    // Parse photos JSON array
    res.json(notes.map(n => ({ ...n, photos: (() => { try { return JSON.parse(n.photos || "[]"); } catch { return []; } })() })));
  } catch (err) {
    // Table may not exist yet if migration hasn't been run
    if (err.message?.includes("field_notes") || err.code === "42P01") {
      return res.json([]); // return empty — don't crash server
    }
    throw err;
  }
});

// POST /api/field-notes
router.post("/", requireAuth, async (req, res) => {
  try {
    const { farm, ...fields } = req.body;
    const farmId = await farmIdByName(farm);
    if (!farmId) return res.status(400).json({ error: "Unknown farm" });
    fields.authorId = req.user?.id || null;
    fields.authorName = req.user?.name || fields.authorName || "Unknown";
    if (fields.photos && Array.isArray(fields.photos)) {
      fields.photos = JSON.stringify(fields.photos);
    }
    const [created] = await db
      .insert(fieldNotes)
      .values({ ...fields, farmId, farmName: farm })
      .returning();
    res.status(201).json({ ...created, photos: (() => { try { return JSON.parse(created.photos || "[]"); } catch { return []; } })() });
  } catch (err) {
    if (err.message?.includes("field_notes") || err.code === "42P01") {
      return res.status(503).json({ error: "Field notes table not ready — run: npx drizzle-kit push" });
    }
    throw err;
  }
});

// PUT /api/field-notes/:id
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { farm, ...fields } = req.body;
    // Stringify photos array if provided
    if (fields.photos && Array.isArray(fields.photos)) {
      fields.photos = JSON.stringify(fields.photos);
    }
    // Drizzle expects Date objects for timestamp columns, not strings
    if (fields.resolvedAt && typeof fields.resolvedAt === "string") {
      fields.resolvedAt = new Date(fields.resolvedAt);
    }
    if (fields.createdAt && typeof fields.createdAt === "string") {
      fields.createdAt = new Date(fields.createdAt);
    }
    const [updated] = await db
      .update(fieldNotes)
      .set(fields)
      .where(eq(fieldNotes.id, Number(req.params.id)))
      .returning();
    if (!updated) return res.status(404).json({ error: "Note not found" });
    res.json({ ...updated, photos: (() => { try { return JSON.parse(updated.photos || "[]"); } catch { return []; } })() });
  } catch (err) {
    if (err.message?.includes("field_notes") || err.code === "42P01") {
      return res.status(503).json({ error: "Field notes table not ready" });
    }
    throw err;
  }
});

// DELETE /api/field-notes/:id
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    await db.delete(fieldNotes).where(eq(fieldNotes.id, Number(req.params.id)));
    res.json({ ok: true });
  } catch (err) {
    if (err.message?.includes("field_notes") || err.code === "42P01") {
      return res.json({ ok: true });
    }
    throw err;
  }
});

export default router;
