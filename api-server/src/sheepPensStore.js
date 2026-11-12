// Sheep Feeding pens <-> the "Arundale - Feedlot" map farm.
//
// One set of numbers: a feeding pen's head count is READ from the mob(s) standing in that pen's
// paddock on the map. Editing a pen in Sheep Feeding writes to the mob (creates / updates /
// archives it), so the two screens can't disagree. Pen "Pen 7" is the paddock named "P7".
//
// Every function takes `db` as its first argument so the same code runs against a throwaway
// in-memory Postgres in tests.
import { sql, eq, and, inArray, asc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { sheepPens, paddocks, farms, mobs, mobHistory } from "./db/schema.js";
import { mergedWithholding } from "./withholding.js";

export const FEEDLOT_FARM = "Arundale - Feedlot";
const FEEDING_SPECIES = ["Sheep", "Rams"];
const LOCK_KEY = 7731; // serialises first-time linking so two phones opening at once can't double up

export class PenError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
const bad = (m) => new PenError(m, 400);

const rowsOf = (res) => (Array.isArray(res) ? res : res?.rows || []);
const clampInt = (v, min, max) => Math.max(min, Math.min(max, Math.round(Number(v) || 0)));
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Australia/Melbourne" });

// "P7" / "p 7" -> 7 (paddocks);  "Pen 7" -> 7 (old feeding pens)
export const paddockNumber = (name) => { const m = /^\s*P\s*(\d+)\s*$/i.exec(String(name ?? "")); return m ? Number(m[1]) : null; };
export const penNumber = (name) => { const m = /(\d+)/.exec(String(name ?? "")); return m ? Number(m[1]) : null; };

// What a brand-new feedlot mob looks like (everything the user said to "assume in the background")
export const NEW_MOB_DEFAULTS = {
  species: "Sheep", type: "Lambs", ageClass: "Lambs", mgmtGroup: "Sale Lambs", tag: "Mixed", dse: "1", whp: 0,
};
const mobDesc = (breed, ageClass) => `${breed || "Sheep"} ${(ageClass || "").toLowerCase()}`.trim();

const penOut = (p) => ({
  id: p.id, name: p.name, ration: p.ration, headCount: p.headCount,
  kgPerHead: Number(p.kgPerHead), rationPercent: p.rationPercent, active: p.active,
  orderIndex: p.orderIndex, notes: p.notes ?? null, paddockId: p.paddockId ?? null,
});

async function feedlotFarmId(db) {
  const [f] = await db.select({ id: farms.id }).from(farms).where(eq(farms.name, FEEDLOT_FARM));
  return f?.id ?? null;
}

async function liveMobsByPaddock(db, farmId, names) {
  const out = new Map();
  if (!names.length) return out;
  const rows = await db.select().from(mobs).where(and(
    eq(mobs.farmId, farmId), eq(mobs.archived, false),
    inArray(mobs.paddock, names), inArray(mobs.species, FEEDING_SPECIES),
  )).orderBy(asc(mobs.id));
  for (const m of rows) { if (!out.has(m.paddock)) out.set(m.paddock, []); out.get(m.paddock).push(m); }
  return out;
}

async function addHistory(tx, mobId, paddock, action, detail, authorName) {
  await tx.insert(mobHistory).values({ mobId, date: today(), action, detail, paddock, authorName: authorName || null });
}

async function createMob(tx, farmId, paddockName, { name, breed, count }, note, authorName) {
  const [m] = await tx.insert(mobs).values({
    farmId, name, desc: mobDesc(breed, NEW_MOB_DEFAULTS.ageClass), count, paddock: paddockName,
    ...NEW_MOB_DEFAULTS, breed: breed || "Mixed", updatedAt: new Date(),
  }).returning();
  await addHistory(tx, m.id, paddockName, "Created", note, authorName);
  return m;
}

// ── replacing the mobs that were already standing in a pen ──────────────────────────────
// Season records must not be duplicated onto the new mob (same rule as the Split/Copy history copy)
const NOT_COPIED = new Set(["Scan", "Mark", "Wean", "Death", "Start Lambing", "End Lambing", "Start Calving", "End Calving", "Copy"]);
const WEIGH_RE = /Average weight \(kg\):\s*([0-9]+(?:\.[0-9]+)?)/i;
const round1 = (n) => Math.round(n * 10) / 10;

// The weight to carry across: each old mob's recorded average weight (its "last weight", or failing
// that the newest Weigh entry in its history), averaged by head count; dated with the latest weighing.
export function carriedWeight(oldMobs, historyRows) {
  const items = [];
  for (const m of oldMobs) {
    let w = Number(m.lastWeight), d = m.lastWeightDate || null;
    if (!(w > 0)) {
      const weighs = historyRows.filter((h) => h.mobId === m.id && h.action === "Weigh")
        .map((h) => ({ w: Number(WEIGH_RE.exec(h.detail || "")?.[1]), d: h.date || "" })).filter((x) => x.w > 0)
        .sort((a, b) => (a.d < b.d ? 1 : -1));
      w = weighs[0]?.w || 0; d = weighs[0]?.d || null;
    }
    if (w > 0) items.push({ w, d, n: Math.max(0, Number(m.count) || 0) });
  }
  if (!items.length) return null;
  const heads = items.reduce((t, i) => t + i.n, 0);
  const avg = heads > 0 ? items.reduce((t, i) => t + i.w * i.n, 0) / heads : items.reduce((t, i) => t + i.w, 0) / items.length;
  const dates = items.map((i) => i.d).filter(Boolean).sort();
  return { weight: round1(avg), date: dates.length ? dates[dates.length - 1] : null };
}

// Archives the pen's existing mobs (history kept) and puts ONE new mob in, so the count is exactly what
// was typed in Sheep Feeding. The new mob inherits the average weight, the longest withholding (meat /
// ESI / wool — a treated mob can't "lose" its WHP by being replaced) and the old history.
async function replaceMobs(tx, farmId, paddockName, oldMobs, { name, breed, count }, note, authorName) {
  const ids = oldMobs.map((m) => m.id);
  const hist = ids.length ? await tx.select().from(mobHistory).where(inArray(mobHistory.mobId, ids)) : [];
  const carried = carriedWeight(oldMobs, hist);
  let withholding = {};
  for (const m of oldMobs) withholding = mergedWithholding(m.extra, withholding);
  const oldNames = oldMobs.map((m) => `${m.name} (${m.count})`).join(", ");

  let created = null;
  if (count > 0) {
    [created] = await tx.insert(mobs).values({
      farmId, name, desc: mobDesc(breed, NEW_MOB_DEFAULTS.ageClass), count, paddock: paddockName,
      ...NEW_MOB_DEFAULTS, breed: breed || "Mixed",
      ...(carried ? { lastWeight: String(carried.weight), lastWeightDate: carried.date } : {}),
      ...(Object.keys(withholding).length ? { extra: withholding } : {}),
      updatedAt: new Date(),
    }).returning();
    const keep = hist.filter((h) => !NOT_COPIED.has(h.action));
    if (keep.length) {
      await tx.insert(mobHistory).values(keep.map((h) => ({
        mobId: created.id, date: h.date, action: h.action, detail: h.detail, paddock: h.paddock, authorName: h.authorName,
      })));
    }
    await addHistory(tx, created.id, paddockName, "Created",
      `${note} — replaced ${oldNames}${carried ? `; average weight ${carried.weight} kg carried across` : ""}`, authorName);
  }
  for (const m of oldMobs) {
    await addHistory(tx, m.id, paddockName, "Recount",
      `Replaced by ${created ? created.name : "nothing"} (${count} head) from Sheep Feeding — mob archived (was ${m.count})`, authorName);
    await tx.update(mobs).set({ count: 0, archived: true, archivedAt: new Date(), updatedAt: new Date() }).where(eq(mobs.id, m.id));
  }
  return created;
}

// ── link every P# paddock in the Feedlot farm to a feeding pen (idempotent) ──────────────
export async function syncPens(db, { defaultKg = 0 } = {}) {
  const farmId = await feedlotFarmId(db);
  if (!farmId) return { created: 0, adopted: 0, mobsCreated: 0, mobsReplaced: 0 };
  const pads = (await db.select().from(paddocks).where(eq(paddocks.farmId, farmId)))
    .map((p) => ({ p, n: paddockNumber(p.name) })).filter((x) => x.n !== null)
    .sort((a, b) => a.n - b.n || a.p.id - b.p.id);
  if (!pads.length) return { created: 0, adopted: 0, mobsCreated: 0, mobsReplaced: 0 };

  // Cheap check first so the common case (everything already linked) takes no lock and writes nothing
  const linked = new Set((await db.select({ id: sheepPens.paddockId }).from(sheepPens)).map((r) => r.id).filter((v) => v != null));
  if (pads.every((x) => linked.has(x.p.id))) return { created: 0, adopted: 0, mobsCreated: 0, mobsReplaced: 0 };

  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${LOCK_KEY})`);
    const pens = await tx.select().from(sheepPens);
    const taken = new Set(pens.map((p) => p.paddockId).filter((v) => v != null));
    const unlinked = pens.filter((p) => p.paddockId == null);
    let nextOrder = pens.reduce((m, p) => Math.max(m, p.orderIndex), -1) + 1;
    const stats = { created: 0, adopted: 0, mobsCreated: 0, mobsReplaced: 0 };
    const seenNumbers = new Set();
    for (const { p: pad, n } of pads) {
      if (taken.has(pad.id)) continue;
      // two paddocks both called "P7": the first gets the pen, the rest are left alone
      if (seenNumbers.has(n)) continue;
      seenNumbers.add(n);
      const old = unlinked.find((p) => !p.paddockId && penNumber(p.name) === n);
      if (old) {
        old.paddockId = pad.id; // so a second paddock with the same number can't adopt it too
        const live = await tx.select().from(mobs).where(and(
          eq(mobs.farmId, farmId), eq(mobs.archived, false), eq(mobs.paddock, pad.name), inArray(mobs.species, FEEDING_SPECIES)));
        if (old.headCount > 0) {
          const vals = { name: String(old.ration || "").trim() || old.name, breed: "Mixed", count: old.headCount };
          if (live.length === 0) {
            await createMob(tx, farmId, pad.name, vals, "Created from the existing Sheep Feeding pen", null);
          } else {
            // Sheep Feeding's number is the right one: swap the mob(s) already on the map for one with that count
            await replaceMobs(tx, farmId, pad.name, live, vals, "Created from the existing Sheep Feeding pen", null);
            stats.mobsReplaced++;
          }
          stats.mobsCreated++;
        }
        // the typed head count is retired once the mob exists — the mob is now the only count
        await tx.update(sheepPens).set({ paddockId: pad.id, headCount: 0 }).where(eq(sheepPens.id, old.id));
        stats.adopted++;
      } else {
        await tx.insert(sheepPens).values({
          id: randomUUID(), name: `Pen ${n}`, ration: "", headCount: 0, kgPerHead: String(defaultKg || 0),
          rationPercent: 100, active: true, orderIndex: nextOrder++, paddockId: pad.id,
        }).onConflictDoNothing();
        stats.created++;
      }
    }
    return stats;
  });
}

// ── the pen list the Sheep Feeding screen uses ──────────────────────────────────────────
export async function listPens(db, { id } = {}) {
  const all = await db.select().from(sheepPens).orderBy(asc(sheepPens.orderIndex));
  const pens = id ? all.filter((p) => p.id === id) : all;
  const farmId = await feedlotFarmId(db);
  const padIds = [...new Set(pens.map((p) => p.paddockId).filter((v) => v != null))];
  const pads = padIds.length ? await db.select().from(paddocks).where(inArray(paddocks.id, padIds)) : [];
  const padById = new Map(pads.map((p) => [p.id, p]));
  const live = farmId ? await liveMobsByPaddock(db, farmId, pads.map((p) => p.name)) : new Map();

  return pens.map((p) => {
    const base = penOut(p);
    const pad = p.paddockId != null ? padById.get(p.paddockId) : null;
    if (!pad) return { ...base, linked: false, paddockName: null, mobs: [], multiMob: false };
    const ms = (live.get(pad.name) || []).map((m) => ({ id: m.id, name: m.name, breed: m.breed || "", count: m.count || 0 }));
    const head = ms.reduce((s, m) => s + m.count, 0);
    const breeds = [...new Set(ms.map((m) => m.breed).filter(Boolean))];
    return {
      ...base, linked: true, paddockName: pad.name, mobs: ms, multiMob: ms.length > 1,
      headCount: head,
      // The pen's label in the feed run is the mob's name
      ration: ms.map((m) => m.name).join(" + "),
      mobName: ms.map((m) => m.name).join(" + "),
      breed: breeds.length === 1 ? breeds[0] : breeds.length > 1 ? "Various" : "",
    };
  });
}

// ── save a LINKED pen (Admin/Manager): feeding settings + the mob behind it ───────────────
export async function savePen(db, id, b = {}, { authorName = null } = {}) {
  const [pen] = await db.select().from(sheepPens).where(eq(sheepPens.id, id));
  if (!pen) throw new PenError("Pen not found", 404);
  if (pen.paddockId == null) throw bad("This pen isn't linked to a paddock");
  const farmId = await feedlotFarmId(db);
  const [pad] = await db.select().from(paddocks).where(eq(paddocks.id, pen.paddockId));
  if (!farmId || !pad) throw bad("This pen's paddock no longer exists");

  const wantsName = b.mobName !== undefined, wantsBreed = b.breed !== undefined, wantsHead = b.headCount !== undefined;
  const head = wantsHead ? clampInt(b.headCount, 0, 100000) : undefined;
  const name = wantsName ? String(b.mobName ?? "").trim().slice(0, 100) : undefined;
  const breed = wantsBreed ? String(b.breed ?? "").trim().slice(0, 60) : undefined;

  const penUpdates = {};
  if (b.kgPerHead !== undefined) penUpdates.kgPerHead = String(Math.max(0, Number(b.kgPerHead) || 0));
  if (b.rationPercent !== undefined) penUpdates.rationPercent = clampInt(b.rationPercent, 0, 200);
  if (b.active !== undefined) penUpdates.active = !!b.active;

  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${LOCK_KEY})`);
    const ms = await tx.select().from(mobs).where(and(
      eq(mobs.farmId, farmId), eq(mobs.archived, false), eq(mobs.paddock, pad.name), inArray(mobs.species, FEEDING_SPECIES))).orderBy(asc(mobs.id));

    if (ms.length > 1) {
      if (b.replace === true && (wantsHead || wantsName)) {
        // explicit "replace these with one mob": all archived, the new mob carries weight / WHP / history
        const n = wantsHead ? head : ms.reduce((t, m) => t + (m.count || 0), 0);
        if (n > 0 && !name) throw bad("Give the mob a name");
        await replaceMobs(tx, farmId, pad.name, ms, { name, breed, count: n }, "Added from Sheep Feeding", authorName);
        penUpdates.active = n > 0;
      } else if (wantsName || wantsBreed || wantsHead) {
        throw bad(`${ms.length} mobs are in this pen — change them on the map, or use "Replace with one mob"`);
      }
    } else if (ms.length === 1) {
      const m = ms[0];
      const upd = {};
      if (wantsName && name && name !== m.name) upd.name = name;
      if (wantsBreed && breed && breed !== (m.breed || "")) { upd.breed = breed; upd.desc = mobDesc(breed, m.ageClass); }
      if (wantsHead && head !== m.count) {
        if (head === 0) {
          await addHistory(tx, m.id, pad.name, "Recount", `Recounted ${m.count} → 0 from Sheep Feeding — mob archived`, authorName);
          await tx.update(mobs).set({ count: 0, archived: true, archivedAt: new Date(), updatedAt: new Date() }).where(eq(mobs.id, m.id));
          penUpdates.active = false; // an empty pen is not fed
        } else {
          await addHistory(tx, m.id, pad.name, "Recount", `Recounted ${m.count} → ${head} from Sheep Feeding`, authorName);
          upd.count = head;
        }
      }
      if (Object.keys(upd).length) await tx.update(mobs).set({ ...upd, updatedAt: new Date() }).where(eq(mobs.id, m.id));
    } else if (wantsHead && head > 0) {
      if (!name) throw bad("Give the mob a name");
      await createMob(tx, farmId, pad.name, { name, breed, count: head }, "Added from Sheep Feeding", authorName);
      penUpdates.active = true; // sheep put in an empty pen start being fed
    }

    if (Object.keys(penUpdates).length) await tx.update(sheepPens).set(penUpdates).where(eq(sheepPens.id, id));
  });

  const [out] = await listPens(db, { id });
  return out;
}

export const defaultKgFromSettings = (settingsRow) => {
  const ing = Array.isArray(settingsRow?.ingredients) ? settingsRow.ingredients : [];
  return Math.round(ing.reduce((s, i) => s + (Number(i?.kgPerHead) || 0), 0) * 10000) / 10000;
};
