// Read-only tools the assistant can call. Every function takes (ctx, input) where
//   ctx = { db, farms: [{ id, name }], today: "yyyy-mm-dd" }
// and only ever sees the farms the signed-in user is allowed to see. Nothing here writes.
import { and, eq, inArray, desc } from "drizzle-orm";
import { mobs, mobHistory, paddocks, treatmentInventory, sprayInventory, rainfallRecords } from "../db/schema.js";
import { withholdingDates } from "../withholding.js";
import { countsOnDate } from "./historyReplay.js";
import { loadState } from "../workflowStore.js";

const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const farmName = (ctx, id) => ctx.farms.find((f) => f.id === id)?.name || "?";
const pickFarms = (ctx, name) => {
  if (!name) return ctx.farms;
  const want = norm(name);
  const hit = ctx.farms.filter((f) => norm(f.name) === want || norm(f.name).includes(want));
  return hit.length ? hit : [];
};
const ids = (farms) => farms.map((f) => f.id);

// A mob as the assistant sees it
export function mobView(ctx, m) {
  const extra = m.extra || {};
  const w = withholdingDates(extra);
  const active = {};
  if (w.meat && w.meat > ctx.today) active.meat_until = w.meat;
  if (w.esi && w.esi > ctx.today) active.esi_until = w.esi;
  if (w.wool && w.wool > ctx.today) active.wool_until = w.wool;
  return {
    id: m.id, farm: farmName(ctx, m.farmId), name: m.name, species: m.species, type: m.type, age_class: m.ageClass,
    breed: m.breed, head: m.count, paddock: m.paddock,
    ...(Object.keys(active).length ? { in_withholding: active } : {}),
    ...(m.lastWeight ? { last_weight_kg: Number(m.lastWeight), last_weight_date: m.lastWeightDate } : {}),
  };
}

async function liveMobs(ctx, farms) {
  if (!farms.length) return [];
  return ctx.db.select().from(mobs).where(and(inArray(mobs.farmId, ids(farms)), eq(mobs.archived, false)));
}

export async function find_mobs(ctx, { query, paddock, species, farm } = {}) {
  const farms = pickFarms(ctx, farm);
  let rows = await liveMobs(ctx, farms);
  const qTokens = norm(query).split(" ").filter(Boolean);
  const pad = norm(paddock);
  const sp = norm(species);
  rows = rows.filter((m) => {
    if (pad && !norm(m.paddock).includes(pad)) return false;
    if (sp && !norm(m.species).startsWith(sp.replace(/s$/, ""))) return false;
    if (qTokens.length) {
      const hay = norm([m.name, m.species, m.type, m.breed, m.ageClass, m.mgmtGroup, m.paddock].join(" "));
      if (!qTokens.every((t) => hay.includes(t.replace(/s$/, "")))) return false;
    }
    return true;
  });
  rows.sort((a, b) => (norm(a.paddock) === pad ? -1 : 0) - (norm(b.paddock) === pad ? -1 : 0) || String(a.name).localeCompare(String(b.name)));
  return { count: rows.length, mobs: rows.slice(0, 40).map((m) => mobView(ctx, m)), ...(rows.length > 40 ? { note: "Only the first 40 are shown — narrow the search." } : {}) };
}

export async function get_mob(ctx, { mob_id }) {
  const [m] = await ctx.db.select().from(mobs).where(and(eq(mobs.id, Number(mob_id)), inArray(mobs.farmId, ids(ctx.farms))));
  if (!m) return { error: "No such mob" };
  const history = await ctx.db.select().from(mobHistory).where(eq(mobHistory.mobId, m.id)).orderBy(desc(mobHistory.id)).limit(20);
  return {
    ...mobView(ctx, m), archived: m.archived, dse_per_head: m.dse != null ? Number(m.dse) : null, notes: m.desc || null,
    recent_history: history.map((h) => ({ date: h.date, action: h.action, detail: String(h.detail || "").slice(0, 300), by: h.authorName })),
  };
}

export async function list_paddocks(ctx, { farm } = {}) {
  const farms = pickFarms(ctx, farm);
  if (!farms.length) return { paddocks: [] };
  const pads = await ctx.db.select().from(paddocks).where(inArray(paddocks.farmId, ids(farms)));
  const live = await liveMobs(ctx, farms);
  const out = pads.map((p) => {
    const inside = live.filter((m) => m.farmId === p.farmId && m.paddock === p.name);
    return {
      farm: farmName(ctx, p.farmId), name: p.name, ha: p.ha != null ? Number(p.ha) : null,
      head: inside.reduce((s, m) => s + (m.count || 0), 0),
      mobs: inside.map((m) => ({ id: m.id, name: m.name, species: m.species, head: m.count })),
    };
  });
  out.sort((a, b) => a.farm.localeCompare(b.farm) || String(a.name).localeCompare(String(b.name), undefined, { numeric: true }));
  return { count: out.length, paddocks: out.slice(0, 120) };
}

export async function farm_summary(ctx) {
  const live = await liveMobs(ctx, ctx.farms);
  const pads = ctx.farms.length ? await ctx.db.select().from(paddocks).where(inArray(paddocks.farmId, ids(ctx.farms))) : [];
  return {
    farms: ctx.farms.map((f) => {
      const ms = live.filter((m) => m.farmId === f.id);
      const bySpecies = {};
      ms.forEach((m) => { const k = m.species || "Unknown"; bySpecies[k] = (bySpecies[k] || 0) + (m.count || 0); });
      return { farm: f.name, mobs: ms.length, paddocks: pads.filter((p) => p.farmId === f.id).length, head_by_species: bySpecies };
    }),
  };
}

export async function withholding_status(ctx, { farm } = {}) {
  const rows = await liveMobs(ctx, pickFarms(ctx, farm));
  const list = rows.map((m) => mobView(ctx, m)).filter((v) => v.in_withholding);
  return { count: list.length, today: ctx.today, mobs: list.slice(0, 60) };
}

export async function list_inventory(ctx, { kind, farm } = {}) {
  const farms = pickFarms(ctx, farm);
  if (!farms.length) return { items: [] };
  if (kind === "spray") {
    const rows = await ctx.db.select().from(sprayInventory).where(inArray(sprayInventory.farmId, ids(farms)));
    return { items: rows.slice(0, 80).map((r) => ({ id: r.id, farm: farmName(ctx, r.farmId), title: r.title, last_used: r.treatmentDate, paddock: r.location, whp: r.whp, esi: r.esi })) };
  }
  const rows = await ctx.db.select().from(treatmentInventory).where(inArray(treatmentInventory.farmId, ids(farms)));
  return {
    items: rows.slice(0, 80).map((r) => {
      const start = Number(r.startingStock) || 0, used = Number(r.quantityUsed) || 0;
      return {
        id: r.id, farm: farmName(ctx, r.farmId), title: r.title, whp_meat: r.withholdingMeat, esi: r.withholdingESI, whp_wool: r.withholdingWool,
        dosage: r.dosage, unit: r.containerUnit, in_stock: start ? Math.max(0, start - used) : null, batch: r.batchNumber, expiry: r.expiryDate,
      };
    }),
  };
}

export async function spray_records(ctx, { paddock, since, farm } = {}) {
  const farms = pickFarms(ctx, farm);
  if (!farms.length) return { records: [] };
  const rows = await ctx.db.select().from(sprayInventory).where(inArray(sprayInventory.farmId, ids(farms)));
  const pad = norm(paddock);
  const list = rows
    .filter((r) => r.treatmentDate && (!since || r.treatmentDate >= since) && (!pad || norm(r.location).includes(pad)))
    .sort((a, b) => String(b.treatmentDate).localeCompare(String(a.treatmentDate)))
    .slice(0, 30)
    .map((r) => ({ date: r.treatmentDate, farm: farmName(ctx, r.farmId), product: r.title, paddocks: r.location, area_ha: r.areaTreated, rate: r.applicationRate, whp: r.whp, esi: r.esi, notes: r.notes }));
  return { count: list.length, records: list };
}

export async function rainfall_summary(ctx, { from, to, farm } = {}) {
  const farms = pickFarms(ctx, farm);
  if (!farms.length) return { farms: [] };
  const rows = await ctx.db.select().from(rainfallRecords).where(inArray(rainfallRecords.farmId, ids(farms)));
  return {
    farms: farms.map((f) => {
      const mine = rows.filter((r) => r.farmId === f.id && (!from || r.date >= from) && (!to || r.date <= to)).sort((a, b) => String(b.date).localeCompare(String(a.date)));
      return { farm: f.name, total_mm: Math.round(mine.reduce((s, r) => s + Number(r.mm || 0), 0) * 10) / 10, readings: mine.length, latest: mine.slice(0, 15).map((r) => ({ date: r.date, mm: Number(r.mm) })) };
    }),
  };
}

export async function mob_count_on_date(ctx, { date, species, farm } = {}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ""))) return { error: "date must be yyyy-mm-dd" };
  if (date > ctx.today) return { error: "That date is in the future — only today's current counts are known" };
  const farms = pickFarms(ctx, farm);
  if (!farms.length) return { error: "No such farm" };
  const all = await ctx.db.select().from(mobs).where(inArray(mobs.farmId, ids(farms)));
  const hist = all.length ? await ctx.db.select().from(mobHistory).where(inArray(mobHistory.mobId, all.map((m) => m.id))) : [];
  const byMob = new Map();
  hist.forEach((h) => { if (!byMob.has(h.mobId)) byMob.set(h.mobId, []); byMob.get(h.mobId).push(h); });
  const withNames = all.map((m) => ({ ...m, farmName: farmName(ctx, m.farmId) }));
  const out = countsOnDate(withNames, byMob, date, { species });
  if (date === ctx.today) out.caveat = "That's today — these are the current counts.";
  return out;
}

// ── Weekly workflow planner (read only) ──
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ISO = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
const addDaysISO = (iso, n) => { const d = new Date(iso + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const weekdayOf = (iso) => WEEKDAYS[new Date(iso + "T00:00:00Z").getUTCDay()];
const MAX_DAYS = 31, MAX_JOBS = 150;

// Does a planner staff name ("Rob", or a full name from staffDetails) match what was asked for?
function staffMatches(name, details, want) {
  const w = norm(want);
  if (!w) return true;
  const d = details?.[name];
  const names = [norm(name), norm(d ? `${d.first || ""} ${d.last || ""}` : "")].filter(Boolean);
  const wFirst = w.split(" ")[0];
  return names.some((n) => n === w || n.split(" ")[0] === wFirst || n.includes(w));
}

export async function workflow_jobs(ctx, { from, to, staff, farm, status } = {}) {
  const start = from || ctx.today;
  const end = to || start;
  if (!ISO.test(start) || !ISO.test(end)) return { error: "from/to must be yyyy-mm-dd" };
  if (end < start) return { error: "'to' is before 'from'" };
  if (addDaysISO(start, MAX_DAYS - 1) < end) return { error: `Ask for ${MAX_DAYS} days or fewer at a time` };
  const wantStaff = String(staff || "").trim().toLowerCase() === "me" ? (ctx.user?.name || "") : staff;
  const farmWant = norm(farm);
  const state = await loadState(ctx.db);
  // Managers see the working list; workers see what has been published to staff (as the planner does)
  const published = Array.isArray(state.published) ? state.published : [];
  const source = ctx.canAct ? state.tasks : (published.length ? published : state.tasks);
  const mine = (t) => !wantStaff || (t.assignedStaff || []).some((n) => staffMatches(n, state.staffDetails, wantStaff));
  const farmOk = (t) => !farmWant || norm(t.farm).includes(farmWant);
  const stOk = (t) => status === "open" ? !t.completed : status === "done" ? !!t.completed : true;

  const rows = source.filter((t) => ISO.test(String(t.date || "")) && t.date >= start && t.date <= end && mine(t) && farmOk(t) && stOk(t))
    .map((t) => ({ date: t.date, farm: t.farm, paddock: t.paddock || undefined, job: t.content, notes: t.notes || undefined, staff: t.assignedStaff || [], done: !!t.completed, repeats: t.recur && t.recur !== "none" ? t.recur : undefined }));

  // Weekly repeating jobs only become real jobs when someone opens that week in the planner — list the ones not made yet
  if (ctx.canAct && status !== "done") {
    for (let d = start < ctx.today ? ctx.today : start; d <= end; d = addDaysISO(d, 1)) {
      const wd = weekdayOf(d);
      for (const tpl of arr(state.recurTemplates)) {
        if (tpl.weeklyDay !== wd || source.some((t) => t.series === tpl.series && t.date === d)) continue;
        if (!mine(tpl) || !farmOk(tpl)) continue;
        rows.push({ date: d, farm: tpl.farm, paddock: tpl.paddock || undefined, job: tpl.content, notes: tpl.notes || undefined, staff: tpl.assignedStaff || [], done: false, repeats: "weekly", from_weekly_template: true });
      }
    }
  }
  rows.sort((a, b) => a.date.localeCompare(b.date) || String(a.farm).localeCompare(String(b.farm)));
  const days = [];
  for (const r of rows.slice(0, MAX_JOBS)) {
    const { date, ...job } = r;
    let day = days[days.length - 1];
    if (!day || day.date !== date) { day = { date, weekday: weekdayOf(date), jobs: [] }; days.push(day); }
    day.jobs.push(job);
  }
  const out = { from: start, to: end, total_jobs: rows.length, open_jobs: rows.filter((r) => !r.done).length, days };
  if (rows.length > MAX_JOBS) out.note = `Only the first ${MAX_JOBS} jobs are shown — narrow the dates or the person.`;
  if (!rows.length && wantStaff) out.known_staff = arr(state.staff).slice(0, 60);
  if (ctx.canAct && published.length && JSON.stringify(state.tasks) !== JSON.stringify(published)) out.unpublished_changes = "The planner has changes that haven't been published to staff yet; this list includes them.";
  return out;
}
const arr = (v) => (Array.isArray(v) ? v : []);

export const READ_HANDLERS = { workflow_jobs,  find_mobs, get_mob, list_paddocks, farm_summary, withholding_status, list_inventory, spray_records, rainfall_summary, mob_count_on_date };
