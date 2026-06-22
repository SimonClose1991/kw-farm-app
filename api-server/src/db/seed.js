// Seeds the database with: the four farms, the primary Admin account (Simon),
// two demo accounts, and starter paddocks/mobs so the app isn't empty on first run.
// Run with: node src/db/seed.js
import { db, pool } from "./index.js";
import { accounts, farms, mobs, paddocks } from "./schema.js";
import { hashPassword } from "../auth.js";
import { eq } from "drizzle-orm";

const FARM_CENTERS = {
  Arundale: [-37.21, 141.62],
  Hamilton: [-37.745, 142.02],
  "Kurra-Wirra": [-36.95, 141.85],
  Mooralla: [-37.36, 141.65],
  Carramar: [-37.10, 141.75],
};

async function seed() {
  console.log("Seeding farms...");
  const farmIds = {};
  for (const [name, [lat, lng]] of Object.entries(FARM_CENTERS)) {
    const existing = await db.select().from(farms).where(eq(farms.name, name));
    if (existing.length > 0) {
      farmIds[name] = existing[0].id;
      continue;
    }
    const [created] = await db.insert(farms).values({ name, centerLat: lat, centerLng: lng }).returning();
    farmIds[name] = created.id;
  }

  console.log("Seeding accounts...");
  const accountSeeds = [
    { name: "Simon Close", email: "simon@kurrawirra.com.au", role: "Admin", password: "Sc731991" },
    { name: "Jenny Smith", email: "jenny.manager@arundale.com", role: "Manager", password: "password" },
    { name: "Tom Wilson", email: "tom.worker@arundale.com", role: "Worker", password: "password" },
  ];
  for (const a of accountSeeds) {
    const existing = await db.select().from(accounts).where(eq(accounts.email, a.email));
    if (existing.length > 0) continue;
    const passwordHash = await hashPassword(a.password);
    await db.insert(accounts).values({ name: a.name, email: a.email, role: a.role, passwordHash });
  }

  console.log("Seeding starter paddocks for Arundale...");
  const arundaleId = farmIds["Arundale"];
  const existingPaddocks = await db.select().from(paddocks).where(eq(paddocks.farmId, arundaleId));
  if (existingPaddocks.length === 0) {
    await db.insert(paddocks).values([
      { farmId: arundaleId, name: "North", ha: 45, landUse: "Grazing", pasture: "Native grass", colour: "Sky Blue" },
      { farmId: arundaleId, name: "South", ha: 37, landUse: "Grazing", pasture: "Improved pasture", colour: "Forest Green" },
      { farmId: arundaleId, name: "East", ha: 21, landUse: "Grazing", pasture: "Native grass", colour: "Sunset Orange" },
      { farmId: arundaleId, name: "West", ha: 28, landUse: "Grazing", pasture: "Improved pasture", colour: "Ruby Red" },
      { farmId: arundaleId, name: "River", ha: 18, landUse: "Grazing", pasture: "Native grass", colour: "Lavender" },
      { farmId: arundaleId, name: "Yards", ha: 5, landUse: "Yards/Infrastructure", pasture: "N/A", colour: "Mustard" },
    ]);
  }

  console.log("Seeding starter mobs for Arundale...");
  const existingMobs = await db.select().from(mobs).where(eq(mobs.farmId, arundaleId));
  if (existingMobs.length === 0) {
    await db.insert(mobs).values([
      { farmId: arundaleId, name: "Fenton steer calves", desc: "Angus steer calves · 10 months old", count: 142, paddock: "North", dse: 6, species: "Cattle", type: "Steers", breed: "Angus", ageClass: "Calves", mgmtGroup: "Breeders", tag: "Blue", whp: 0 },
      { farmId: arundaleId, name: "Coleraine cows", desc: "Angus cows · 4 years old", count: 295, paddock: "River", dse: 8, species: "Cattle", type: "Cows", breed: "Angus", ageClass: "Adult", mgmtGroup: "Breeders", tag: "Yellow", whp: 21 },
      { farmId: arundaleId, name: "Steer weaners", desc: "Mixed breed · 8 months old", count: 95, paddock: "East", dse: 5, species: "Cattle", type: "Steers", breed: "Mixed", ageClass: "Weaners", mgmtGroup: "Trade", tag: "Green", whp: 0 },
      { farmId: arundaleId, name: "Merino ewes", desc: "Merino ewes · 3 years old", count: 1829, paddock: "South", dse: 1.5, species: "Sheep", type: "Ewes", breed: "Merino", ageClass: "Adult", mgmtGroup: "Breeders", tag: "Pink", whp: 0 },
      { farmId: arundaleId, name: "5 Ways", desc: "Ram lambs · Bull", count: 1123, paddock: "West", dse: 3, species: "Sheep", type: "Rams", breed: "Merino", ageClass: "Lambs", mgmtGroup: "Breeders", tag: "Orange", whp: 1 },
    ]);
  }

  console.log("Seed complete.");
  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
