import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { paddocks, farms } from "../db/schema.js";
import { requireAuth, requireEditor } from "../auth.js";

const router = Router();

async function farmIdByName(name) {
  const [farm] = await db.select().from(farms).where(eq(farms.name, name));
  return farm?.id || null;
}

// Recalculate ha from GeoJSON geometry using spherical excess formula
function calcHaFromGeojson(geojson) {
  try {
    const geom = typeof geojson === "string" ? JSON.parse(geojson) : geojson;
    if (!geom) return null;
    let ring = null;
    if (geom.type === "Polygon") ring = geom.coordinates[0];
    else if (geom.type === "MultiPolygon") ring = geom.coordinates[0][0];
    if (!ring || ring.length < 3) return null;
    const R = 6378137;
    const toRad = d => d * Math.PI / 180;
    let area = 0;
    const n = ring.length;
    for (let i = 0; i < n; i++) {
      const [lon1, lat1] = ring[i];
      const [lon2, lat2] = ring[(i + 1) % n];
      area += toRad(lon2 - lon1) * (2 + Math.sin(toRad(lat1)) + Math.sin(toRad(lat2)));
    }
    const ha = Math.abs(area * R * R / 2) / 10000;
    return Math.round(ha * 10) / 10;
  } catch { return null; }
}

// GET /api/paddocks?farm=Arundale
router.get("/", requireAuth, async (req, res) => {
  const farmName = req.query.farm;
  if (!farmName) return res.status(400).json({ error: "farm query param is required" });
  const farmId = await farmIdByName(farmName);
  if (!farmId) return res.json([]);
  const all = await db.select().from(paddocks).where(eq(paddocks.farmId, farmId));
  res.json(all);
});

// POST /api/paddocks  body: { farm, name, ha, landUse, pasture, colour, geojson }
router.post("/", requireAuth, requireEditor, async (req, res) => {
  const { farm, ...fields } = req.body;
  const farmId = await farmIdByName(farm);
  if (!farmId) return res.status(400).json({ error: "Unknown farm" });
  // Always recalculate ha from geometry — stored values are often wrong (AgriWebb exports acres etc.)
  if (fields.geojson) {
    const computedHa = calcHaFromGeojson(fields.geojson);
    if (computedHa !== null) fields.ha = computedHa;
  }
  const [created] = await db.insert(paddocks).values({ ...fields, farmId, updatedAt: new Date() }).returning();
  res.status(201).json(created);
});

// PUT /api/paddocks/:id
router.put("/:id", requireAuth, requireEditor, async (req, res) => {
  const { farm, ...fields } = req.body;
  // Recalculate ha if geometry is being updated
  if (fields.geojson) {
    const computedHa = calcHaFromGeojson(fields.geojson);
    if (computedHa !== null) fields.ha = computedHa;
  }
  const [updated] = await db
    .update(paddocks)
    .set({ ...fields, updatedAt: new Date() })
    .where(eq(paddocks.id, Number(req.params.id)))
    .returning();
  if (!updated) return res.status(404).json({ error: "Paddock not found" });
  res.json(updated);
});

// DELETE /api/paddocks/:id
router.delete("/:id", requireAuth, requireEditor, async (req, res) => {
  await db.delete(paddocks).where(eq(paddocks.id, Number(req.params.id)));
  res.json({ ok: true });
});

export default router;
