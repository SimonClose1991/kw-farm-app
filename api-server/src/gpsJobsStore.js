// GPS Run jobs in progress. One job per paddock, shared on the server so a job started by one
// person / phone can be picked up and carried on by another. The job is just an append-only list
// of "events" (GPS fixes and stroke breaks, see src/coverageMath.js in the app); the app rebuilds
// the painted coverage by replaying them. Takes `db` so it can be tested against a throwaway
// in-memory Postgres.
import { sql, eq } from "drizzle-orm";
import { gpsJobs, paddocks, farms } from "./db/schema.js";

export class JobError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const MAX_BATCH = 2000;   // events per request

// An event is [timeMs, lat, lng, accuracy, widthM, session] (a painted fix) or [timeMs, "b", session] (machine switched off)
function cleanEvents(events) {
  if (!Array.isArray(events) || events.length === 0) throw new JobError(400, "No GPS points to save");
  if (events.length > MAX_BATCH) throw new JobError(400, `Too many points in one go (max ${MAX_BATCH})`);
  return events.map((e) => {
    if (!Array.isArray(e) || e.length < 3 || e.length > 8 || !Number.isFinite(Number(e[0]))) throw new JobError(400, "Bad GPS point");
    if (e[1] === "b") return [Number(e[0]), "b", String(e[2] ?? "").slice(0, 16)];
    const [t, lat, lng, acc, w, sess] = e;
    if (![lat, lng].every((n) => Number.isFinite(Number(n))) || Math.abs(lat) > 90 || Math.abs(lng) > 180) throw new JobError(400, "Bad GPS position");
    return [Number(t), Number(lat), Number(lng), Math.round(Number(acc) || 0), Number(w) || 0, String(sess ?? "").slice(0, 16)];
  });
}

const summary = (r) => ({
  paddockId: r.paddockId, product: r.product, widthM: r.widthM == null ? null : Number(r.widthM),
  eventCount: Number(r.eventCount ?? 0), startedBy: r.startedBy, updatedBy: r.updatedBy, createdAt: r.createdAt, updatedAt: r.updatedAt,
});

// Jobs in progress for every paddock of a farm (no events — just enough to show "job in progress")
export async function listJobs(db, farmName) {
  const rows = await db.select({
    paddockId: gpsJobs.paddockId, product: gpsJobs.product, widthM: gpsJobs.widthM,
    eventCount: sql`jsonb_array_length(${gpsJobs.events})`, startedBy: gpsJobs.startedBy, updatedBy: gpsJobs.updatedBy,
    createdAt: gpsJobs.createdAt, updatedAt: gpsJobs.updatedAt,
  }).from(gpsJobs)
    .innerJoin(paddocks, eq(paddocks.id, gpsJobs.paddockId))
    .innerJoin(farms, eq(farms.id, paddocks.farmId))
    .where(eq(farms.name, farmName));
  return rows.map(summary);
}

export async function getJob(db, paddockId) {
  const [r] = await db.select().from(gpsJobs).where(eq(gpsJobs.paddockId, paddockId));
  if (!r) return null;
  return { ...summary({ ...r, eventCount: (r.events || []).length }), events: r.events || [] };
}

// Add points to a paddock's job (creating the job if there isn't one). Appending is safe even if
// two people are riding the same paddock — nothing is overwritten.
export async function appendEvents(db, paddockId, body, who) {
  const events = cleanEvents(body?.events);
  const [pad] = await db.select({ id: paddocks.id }).from(paddocks).where(eq(paddocks.id, paddockId));
  if (!pad) throw new JobError(404, "Paddock not found");
  const product = typeof body.product === "string" ? body.product.trim().slice(0, 200) : "";
  const widthM = Number(body.widthM);
  const width = Number.isFinite(widthM) && widthM > 0 && widthM <= 200 ? String(widthM) : null;
  await db.insert(gpsJobs).values({
    paddockId, product: product || null, widthM: width, events, startedBy: who, updatedBy: who,
  }).onConflictDoUpdate({
    target: gpsJobs.paddockId,
    set: {
      events: sql`${gpsJobs.events} || ${JSON.stringify(events)}::jsonb`,
      product: product ? product : sql`${gpsJobs.product}`,
      widthM: width != null ? width : sql`${gpsJobs.widthM}`,
      updatedBy: who,
      updatedAt: sql`now()`,
    },
  });
  const [r] = await db.select({ n: sql`jsonb_array_length(${gpsJobs.events})` }).from(gpsJobs).where(eq(gpsJobs.paddockId, paddockId));
  return { eventCount: Number(r?.n ?? 0) };
}

export async function deleteJob(db, paddockId) {
  await db.delete(gpsJobs).where(eq(gpsJobs.paddockId, paddockId));
  return { ok: true };
}
