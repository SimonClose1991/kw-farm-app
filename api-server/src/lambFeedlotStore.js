// Data access + validation for the Admin-only lamb feedlot tracker.
// Every function takes `db` as its first argument (rather than importing it) so the
// same code can be exercised against a throwaway in-memory Postgres in tests.
import { sql, eq, like } from "drizzle-orm";
import { lambMobs, lambAnimals, lambSettings } from "./db/schema.js";

export const UNATTR_ID = "UNATTR";
const EID_RE = /^\d{14,16}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MOB_ID_RE = /^[A-Za-z0-9_-]{1,40}$/;
const CHUNK = 400; // rows per INSERT/UPDATE — keeps well inside Postgres' parameter limit
const DEFAULT_SETTINGS = { dressing: 47, feedCost: 0.62, levies: 3.1 };

export class StoreError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
const bad = (msg) => new StoreError(msg, 400);

// ── small validators ────────────────────────────────────────────────────────
// A real calendar day (rejects 2026-02-31, which would otherwise quietly roll into March)
const isDate = (d) => {
  if (typeof d !== "string" || !DATE_RE.test(d)) return false;
  const t = new Date(d + "T00:00:00Z");
  return !isNaN(t.getTime()) && t.toISOString().slice(0, 10) === d;
};
const numIn = (v, min, max) => { const n = Number(v); return Number.isFinite(n) && n >= min && n <= max ? n : null; };
const text = (v, max) => String(v ?? "").trim().slice(0, max);
const chunks = (arr, n = CHUNK) => { const out = []; for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n)); return out; };
const rowsOf = (res) => (Array.isArray(res) ? res : res?.rows || []);

// ── shapes sent to the browser (NUMERIC comes back from Postgres as text) ─────
const nOrNull = (v) => (v === null || v === undefined ? null : Number(v));
const mobOut = (m) => ({ id: m.id, name: m.name, src: m.src, type: m.type, inDate: m.inDate, costBasis: m.costBasis, costRate: Number(m.costRate) });
const animalOut = (a) => ({
  eid: a.eid, mobId: a.mobId, inWt: nOrNull(a.inWt), sold: !!a.sold,
  saleDate: a.saleDate ?? null, saleWt: nOrNull(a.saleWt), saleWtType: a.saleWtType ?? null,
  price: nOrNull(a.price), buyer: a.buyer ?? null,
});
const settingsOut = (s) => (s
  ? { dressing: Number(s.dressing), feedCost: Number(s.feedCost), levies: Number(s.levies) }
  : { ...DEFAULT_SETTINGS });

// ── read everything ─────────────────────────────────────────────────────────
export async function loadAll(db) {
  const [s] = await db.select().from(lambSettings).where(eq(lambSettings.id, "singleton"));
  const mobs = await db.select().from(lambMobs);
  const animals = await db.select().from(lambAnimals).orderBy(lambAnimals.eid);
  return { settings: settingsOut(s), mobs: mobs.map(mobOut), animals: animals.map(animalOut) };
}

// ── settings ────────────────────────────────────────────────────────────────
export async function saveSettings(db, b = {}) {
  const [existing] = await db.select().from(lambSettings).where(eq(lambSettings.id, "singleton"));
  const cur = settingsOut(existing);
  const next = { ...cur };
  if (b.dressing !== undefined) { const v = numIn(b.dressing, 1, 100); if (v === null) throw bad("Dressing % must be between 1 and 100"); next.dressing = v; }
  if (b.feedCost !== undefined) { const v = numIn(b.feedCost, 0, 100); if (v === null) throw bad("Feed cost must be between $0 and $100 per head per day"); next.feedCost = v; }
  if (b.levies !== undefined) { const v = numIn(b.levies, 0, 1000); if (v === null) throw bad("Levies + freight must be between $0 and $1000 per head"); next.levies = v; }
  const values = { id: "singleton", dressing: String(next.dressing), feedCost: String(next.feedCost), levies: String(next.levies) };
  await db.insert(lambSettings).values(values).onConflictDoUpdate({
    target: lambSettings.id,
    set: { dressing: values.dressing, feedCost: values.feedCost, levies: values.levies },
  });
  return next;
}

// ── mobs ────────────────────────────────────────────────────────────────────
function mobFields(b, { partial = false } = {}) {
  const out = {};
  const has = (k) => b[k] !== undefined;
  if (!partial || has("name")) { const n = text(b.name, 120); if (!n) throw bad("Mob name is required"); out.name = n; }
  if (!partial || has("src")) out.src = text(b.src, 120);
  if (!partial || has("type")) { if (b.type !== "bought" && b.type !== "home") throw bad("Mob source must be Bought or Home-grown"); out.type = b.type; }
  if (!partial || has("inDate")) { if (!isDate(b.inDate)) throw bad("Induction date isn't a valid date"); out.inDate = b.inDate; }
  if (!partial || has("costBasis")) { if (!["perkg", "perhead", "none"].includes(b.costBasis)) throw bad("Cost basis must be per kg, per head or none"); out.costBasis = b.costBasis; }
  if (!partial || has("costRate")) { const r = numIn(b.costRate ?? 0, 0, 10000); if (r === null) throw bad("Cost rate must be a number between 0 and 10000"); out.costRate = String(r); }
  return out;
}

// Next MOB-YYYY-NNN. The advisory lock makes two admins creating a mob at the same
// moment queue up instead of being handed the same number.
async function nextMobId(tx) {
  await tx.execute(sql`SELECT pg_advisory_xact_lock(7340211)`);
  const prefix = `MOB-${new Date().getFullYear()}-`;
  const rows = await tx.select({ id: lambMobs.id }).from(lambMobs).where(like(lambMobs.id, `${prefix}%`));
  let max = 0;
  for (const r of rows) { const n = parseInt(r.id.slice(prefix.length), 10); if (n > max) max = n; }
  return prefix + String(max + 1).padStart(3, "0");
}

export async function createMob(db, b = {}) {
  const f = mobFields(b);
  return db.transaction(async (tx) => {
    const id = await nextMobId(tx);
    const [m] = await tx.insert(lambMobs).values({ id, ...f }).returning();
    return mobOut(m);
  });
}

export async function updateMob(db, id, b = {}) {
  if (id === UNATTR_ID) throw bad("The Unattributed mob can't be edited");
  const f = mobFields(b, { partial: true });
  if (Object.keys(f).length === 0) throw bad("Nothing to update");
  const [m] = await db.update(lambMobs).set(f).where(eq(lambMobs.id, id)).returning();
  if (!m) throw new StoreError("Mob not found", 404);
  return mobOut(m);
}

export async function deleteMob(db, id) {
  return db.transaction(async (tx) => {
    const [m] = await tx.select().from(lambMobs).where(eq(lambMobs.id, id));
    if (!m) throw new StoreError("Mob not found", 404);
    const lambs = rowsOf(await tx.execute(sql`SELECT count(*)::int AS n FROM lamb_animals WHERE mob_id = ${id}`))[0]?.n ?? 0;
    await tx.delete(lambMobs).where(eq(lambMobs.id, id)); // lambs go with it (ON DELETE CASCADE)
    return { deleted: id, lambsDeleted: lambs };
  });
}

// ── induction ───────────────────────────────────────────────────────────────
// b = { mobId } | { mob: {name, src, type, inDate, costBasis, costRate} },  animals: [{eid, inWt}]
export async function induct(db, b = {}) {
  const animals = Array.isArray(b.animals) ? b.animals : null;
  if (!animals || animals.length === 0) throw bad("No lambs to induct");
  if (animals.length > 20000) throw bad("That's too many lambs for one paste — split it into batches of 20,000 or fewer");
  const seen = new Set();
  const clean = [];
  for (const a of animals) {
    const eid = String(a?.eid ?? "");
    if (!EID_RE.test(eid)) throw bad(`"${eid.slice(0, 20)}" isn't a valid EID (14–16 digits)`);
    let inWt = null;
    if (a.inWt !== null && a.inWt !== undefined) {
      inWt = numIn(a.inWt, 5, 150);
      if (inWt === null) throw bad(`Liveweight for ${eid} must be between 5 and 150 kg`);
    }
    if (seen.has(eid)) continue;
    seen.add(eid);
    clean.push({ eid, inWt });
  }
  const newMob = b.mobId ? null : mobFields(b.mob || {});
  return db.transaction(async (tx) => {
    let mob;
    if (b.mobId) {
      if (b.mobId === UNATTR_ID) throw bad("Lambs can't be inducted into the Unattributed mob");
      [mob] = await tx.select().from(lambMobs).where(eq(lambMobs.id, b.mobId));
      if (!mob) throw new StoreError("Mob not found", 404);
    } else {
      const id = await nextMobId(tx);
      [mob] = await tx.insert(lambMobs).values({ id, ...newMob }).returning();
    }
    let inducted = 0;
    for (const part of chunks(clean)) {
      const res = await tx.insert(lambAnimals)
        .values(part.map((a) => ({ eid: a.eid, mobId: mob.id, inWt: a.inWt === null ? null : String(a.inWt), sold: false })))
        .onConflictDoNothing()
        .returning({ eid: lambAnimals.eid });
      inducted += res.length;
    }
    // Rolling back here means a brand-new mob isn't left behind empty
    if (inducted === 0 && !b.mobId) throw bad("Every one of those EIDs is already in the system — no mob was created");
    return { mob: mobOut(mob), inducted, skipped: clean.length - inducted };
  });
}

// ── sales ───────────────────────────────────────────────────────────────────
// b = { saleDate, buyer, saleWtType: 'lw'|'cw', rows: [{eid, saleWt, price}], unattributed: [{eid, saleWt, price}] }
function saleRows(list, label) {
  if (list === undefined) return [];
  if (!Array.isArray(list)) throw bad(`${label} must be a list`);
  const seen = new Set();
  const out = [];
  for (const r of list) {
    const eid = String(r?.eid ?? "");
    if (!EID_RE.test(eid)) throw bad(`"${eid.slice(0, 20)}" isn't a valid EID (14–16 digits)`);
    const saleWt = numIn(r.saleWt, 5, 200);
    if (saleWt === null) throw bad(`Sale weight for ${eid} must be between 5 and 200 kg`);
    const price = Number(r.price);
    if (!(price > 0 && price <= 30)) throw bad(`Price for ${eid} must be above $0 and at most $30 per kg`);
    if (seen.has(eid)) continue;
    seen.add(eid);
    out.push({ eid, saleWt, price });
  }
  return out;
}

export async function recordSales(db, b = {}) {
  if (!isDate(b.saleDate)) throw bad("Sale date isn't a valid date");
  if (b.saleWtType !== "lw" && b.saleWtType !== "cw") throw bad("Weights must be liveweight or carcass");
  const buyer = text(b.buyer, 120);
  const rows = saleRows(b.rows, "Sale rows");
  const unattr = saleRows(b.unattributed, "Unattributed rows");
  if (rows.length + unattr.length === 0) throw bad("Nothing to record");
  if (rows.length + unattr.length > 20000) throw bad("Too many rows for one sale sheet");

  return db.transaction(async (tx) => {
    // Only lambs that exist AND are still unsold are touched — decided here, not trusted from the preview
    let sold = 0;
    for (const part of chunks(rows)) {
      const values = sql.join(part.map((r) => sql`(${r.eid}::text, ${String(r.saleWt)}::numeric, ${String(r.price)}::numeric)`), sql`, `);
      const res = await tx.execute(sql`
        UPDATE lamb_animals AS a
        SET sold = true, sale_date = ${b.saleDate}, sale_wt = v.wt, sale_wt_type = ${b.saleWtType}, price = v.price, buyer = ${buyer}
        FROM (VALUES ${values}) AS v(eid, wt, price)
        WHERE a.eid = v.eid AND a.sold = false
        RETURNING a.eid`);
      sold += rowsOf(res).length;
    }
    let unattributed = 0;
    if (unattr.length) {
      await tx.insert(lambMobs)
        .values({ id: UNATTR_ID, name: "Unattributed", src: "unknown", type: "bought", inDate: b.saleDate, costBasis: "none", costRate: "0" })
        .onConflictDoNothing();
      for (const part of chunks(unattr)) {
        const res = await tx.insert(lambAnimals)
          .values(part.map((r) => ({
            eid: r.eid, mobId: UNATTR_ID, inWt: null, sold: true, saleDate: b.saleDate,
            saleWt: String(r.saleWt), saleWtType: b.saleWtType, price: String(r.price), buyer,
          })))
          .onConflictDoNothing()
          .returning({ eid: lambAnimals.eid });
        unattributed += res.length;
      }
    }
    return { sold, notSold: rows.length - sold, unattributed, unattributedSkipped: unattr.length - unattributed };
  });
}

// ── backup import (merge — never deletes or overwrites) ─────────────────────────
// Takes the file the original HTML tool exports: { settings, mobs: [...], animals: [...] }
export async function importBackup(db, st) {
  if (!st || typeof st !== "object" || !Array.isArray(st.mobs) || !Array.isArray(st.animals) || typeof st.settings !== "object" || st.settings === null) {
    throw bad("That doesn't look like a Feedlot Tracker backup file");
  }
  if (st.mobs.length > 5000 || st.animals.length > 100000) throw bad("That backup is larger than expected");

  let invalid = 0;
  const mobsIn = [];
  for (const m of st.mobs) {
    const id = String(m?.id ?? "");
    try {
      if (!MOB_ID_RE.test(id)) throw bad("id");
      const type = m.type === "home" ? "home" : "bought";
      const costBasis = ["perkg", "perhead", "none"].includes(m.costBasis) ? m.costBasis : "none";
      const name = text(m.name, 120);
      if (!name || !isDate(m.inDate)) throw bad("mob");
      const rate = numIn(m.costRate ?? 0, 0, 10000);
      if (rate === null) throw bad("rate");
      mobsIn.push({ id, name, src: text(m.src, 120), type, inDate: m.inDate, costBasis, costRate: String(rate) });
    } catch { invalid++; }
  }
  const animalsIn = [];
  for (const a of st.animals) {
    const eid = String(a?.eid ?? "");
    if (!EID_RE.test(eid) || !MOB_ID_RE.test(String(a?.mobId ?? ""))) { invalid++; continue; }
    const inWt = a.inWt === null || a.inWt === undefined ? null : Number(a.inWt);
    if (inWt !== null && !Number.isFinite(inWt)) { invalid++; continue; }
    const row = { eid, mobId: String(a.mobId), inWt: inWt === null ? null : String(inWt), sold: !!a.sold };
    if (row.sold) {
      const wt = Number(a.saleWt), price = Number(a.price);
      if (!isDate(a.saleDate) || !(wt > 0) || !(price > 0)) { invalid++; continue; }
      Object.assign(row, { saleDate: a.saleDate, saleWt: String(wt), saleWtType: a.saleWtType === "cw" ? "cw" : "lw", price: String(price), buyer: text(a.buyer, 120) });
    }
    animalsIn.push(row);
  }

  return db.transaction(async (tx) => {
    let mobsAdded = 0;
    for (const part of chunks(mobsIn)) {
      const res = await tx.insert(lambMobs).values(part).onConflictDoNothing().returning({ id: lambMobs.id });
      mobsAdded += res.length;
    }
    const known = new Set((await tx.select({ id: lambMobs.id }).from(lambMobs)).map((r) => r.id));
    let lambsAdded = 0, orphaned = 0;
    const usable = animalsIn.filter((a) => (known.has(a.mobId) ? true : (orphaned++, false)));
    for (const part of chunks(usable)) {
      const res = await tx.insert(lambAnimals).values(part).onConflictDoNothing().returning({ eid: lambAnimals.eid });
      lambsAdded += res.length;
    }
    // Rates from the backup are only used when nothing has been set here yet
    let settingsApplied = false;
    const [existing] = await tx.select().from(lambSettings).where(eq(lambSettings.id, "singleton"));
    if (!existing) {
      const d = numIn(st.settings.dressing, 1, 100), f = numIn(st.settings.feedCost, 0, 100), l = numIn(st.settings.levies, 0, 1000);
      if (d !== null && f !== null && l !== null) {
        await tx.insert(lambSettings).values({ id: "singleton", dressing: String(d), feedCost: String(f), levies: String(l) });
        settingsApplied = true;
      }
    }
    return {
      mobsAdded, mobsAlreadyHere: mobsIn.length - mobsAdded,
      lambsAdded, lambsAlreadyHere: usable.length - lambsAdded,
      invalid: invalid + orphaned, settingsApplied,
    };
  });
}
