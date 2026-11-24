// Proposals: what the assistant WANTS to do. Nothing here writes to the database — each function
// checks the request against the real data and returns a card for the user to confirm. The browser
// carries out confirmed cards (src/assistantActions.js) using the same code paths as the app's own buttons.
import { and, eq, inArray } from "drizzle-orm";
import { mobs, paddocks, treatmentInventory } from "../db/schema.js";

export class ProposalError extends Error {}

const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const isoDate = (v, ctx) => {
  const d = v == null || v === "" ? ctx.today : String(v);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || Number.isNaN(Date.parse(d + "T00:00:00Z"))) throw new ProposalError(`"${v}" isn't a valid date — use yyyy-mm-dd`);
  if (d > ctx.today) throw new ProposalError(`${d} is in the future (today is ${ctx.today}) — records can't be dated ahead`);
  return d;
};
const wholeNumber = (v, label, { min = 0, max = 100000 } = {}) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) throw new ProposalError(`${label} must be a whole number${min ? ` of at least ${min}` : ""}`);
  return n;
};
const dmy = (d) => { const m = String(d).match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? `${m[3]}/${m[2]}/${m[1]}` : d; };

async function getMob(ctx, id) {
  const [m] = await ctx.db.select().from(mobs).where(and(eq(mobs.id, Number(id)), inArray(mobs.farmId, ctx.farms.map((f) => f.id))));
  if (!m) throw new ProposalError("I can't find that mob — search for it first with find_mobs");
  if (m.archived) throw new ProposalError(`${m.name} is archived, so I can't record anything against it`);
  return m;
}
const farmOf = (ctx, farmId) => ctx.farms.find((f) => f.id === farmId)?.name;
const mobLine = (m) => `${m.name} · ${m.paddock || "no paddock"} · ${m.count} head`;

// Exact paddock name from loose input; throws with close suggestions when it can't be sure
async function resolvePaddock(ctx, farmId, wanted) {
  const pads = await ctx.db.select().from(paddocks).where(eq(paddocks.farmId, farmId));
  const w = norm(wanted);
  if (!w) throw new ProposalError("Which paddock?");
  const exact = pads.filter((p) => norm(p.name) === w);
  if (exact.length === 1) return exact[0].name;
  const part = pads.filter((p) => norm(p.name).includes(w) || w.includes(norm(p.name)));
  if (part.length === 1) return part[0].name;
  const sugg = (part.length ? part : pads).slice(0, 6).map((p) => p.name);
  throw new ProposalError(`I can't tell which paddock "${wanted}" is on ${farmOf(ctx, farmId)}.${sugg.length ? ` Closest: ${sugg.join(", ")}.` : ""} Ask the user which one.`);
}

let seq = 0;
const card = (type, farm, mob, title, lines, data, extra = {}) => ({
  id: `p${++seq}_${Date.now().toString(36)}`, type, farm, mobId: mob?.id ?? null, mobName: mob?.name ?? null, title, lines, data, ...extra,
});

export async function propose_death(ctx, { mob_id, count, cause, date }) {
  const m = await getMob(ctx, mob_id);
  const n = wholeNumber(count, "Number of deaths", { min: 1 });
  if (n > m.count) throw new ProposalError(`${m.name} only has ${m.count} head, so ${n} deaths isn't possible`);
  const d = isoDate(date, ctx);
  const why = String(cause || "").trim().slice(0, 80);
  return card("death", farmOf(ctx, m.farmId), m, `Record ${n} death${n > 1 ? "s" : ""}`, [
    mobLine(m), `${m.count} → ${m.count - n} head`, ...(why ? [`Cause: ${why}`] : []), `Date: ${dmy(d)}`,
  ], { mobId: m.id, count: n, cause: why, date: d });
}

export async function propose_recount(ctx, { mob_id, new_count, date }) {
  const m = await getMob(ctx, mob_id);
  const n = wholeNumber(new_count, "New head count", { min: 0 });
  const d = isoDate(date, ctx);
  return card("recount", farmOf(ctx, m.farmId), m, n === 0 ? "Recount to 0 (archives the mob)" : `Recount to ${n}`, [
    mobLine(m), `${m.count} → ${n} head`, ...(n === 0 ? ["The mob is archived, not deleted — it can be restored from Archived mobs."] : []), `Date: ${dmy(d)}`,
  ], { mobId: m.id, newCount: n, date: d }, { warn: n === 0 });
}

export async function propose_move(ctx, { mob_id, to_paddock, date }) {
  const m = await getMob(ctx, mob_id);
  const to = await resolvePaddock(ctx, m.farmId, to_paddock);
  if (norm(to) === norm(m.paddock)) throw new ProposalError(`${m.name} is already in ${m.paddock}`);
  const d = isoDate(date, ctx);
  return card("move", farmOf(ctx, m.farmId), m, `Move ${m.name} to ${to}`, [mobLine(m), `${m.paddock || "?"} → ${to}`, `All ${m.count} head`, `Date: ${dmy(d)}`], { mobId: m.id, toPaddock: to, date: d });
}

export async function propose_split(ctx, { mob_id, count, to_paddock, date }) {
  const m = await getMob(ctx, mob_id);
  const n = wholeNumber(count, "Number to split off", { min: 1 });
  if (n >= m.count) throw new ProposalError(`${m.name} has ${m.count} head — splitting off ${n} is the whole mob, so propose a move instead`);
  const to = await resolvePaddock(ctx, m.farmId, to_paddock);
  if (norm(to) === norm(m.paddock)) throw new ProposalError(`${m.name} is already in ${m.paddock}`);
  const d = isoDate(date, ctx);
  const [existing] = await ctx.db.select().from(mobs).where(and(eq(mobs.farmId, m.farmId), eq(mobs.paddock, to), eq(mobs.name, m.name), eq(mobs.archived, false)));
  const joins = existing && existing.id !== m.id && existing.species === m.species ? existing : null;
  return card("split", farmOf(ctx, m.farmId), m, `Split ${n} off ${m.name} → ${to}`, [
    mobLine(m), `${m.paddock || "?"}: ${m.count} → ${m.count - n} head`,
    joins ? `${to}: joins the ${joins.name} already there (${joins.count} → ${joins.count + n})` : `${to}: new mob of ${n}, same name and details, with the same history`,
    `Date: ${dmy(d)}`,
  ], { mobId: m.id, count: n, toPaddock: to, date: d });
}

export async function propose_sale(ctx, { mob_id, count, price_per_head, date }) {
  const m = await getMob(ctx, mob_id);
  const n = wholeNumber(count, "Number sold", { min: 1 });
  if (n > m.count) throw new ProposalError(`${m.name} only has ${m.count} head, so selling ${n} isn't possible`);
  const d = isoDate(date, ctx);
  const price = price_per_head == null || price_per_head === "" ? null : Number(price_per_head);
  if (price != null && !(price >= 0 && price < 100000)) throw new ProposalError("Sale price per head doesn't look right");
  return card("sale", farmOf(ctx, m.farmId), m, `Record sale of ${n}`, [mobLine(m), `${m.count} → ${m.count - n} head`, ...(price != null ? [`$${price}/head`] : []), `Date: ${dmy(d)}`], { mobId: m.id, count: n, price, date: d });
}

export async function propose_weigh(ctx, { mob_id, average_weight_kg, date }) {
  const m = await getMob(ctx, mob_id);
  const kg = Number(average_weight_kg);
  if (!(kg > 0 && kg < 2000)) throw new ProposalError("Average weight must be a number of kg");
  const d = isoDate(date, ctx);
  return card("weigh", farmOf(ctx, m.farmId), m, `Record weigh: ${kg} kg average`, [mobLine(m), `Average weight ${kg} kg${m.lastWeight ? ` (last: ${Number(m.lastWeight)} kg)` : ""}`, `Date: ${dmy(d)}`], { mobId: m.id, avgKg: kg, date: d });
}

export async function propose_treat(ctx, { mob_id, products, date, notes, total_used, unit }) {
  const m = await getMob(ctx, mob_id);
  const wanted = Array.isArray(products) ? products.map((p) => String(p).trim()).filter(Boolean) : [];
  if (!wanted.length) throw new ProposalError("Which product was used? Check list_inventory for what's in stock");
  const d = isoDate(date, ctx);
  const inv = await ctx.db.select().from(treatmentInventory).where(eq(treatmentInventory.farmId, m.farmId));
  const chosen = [];
  for (const w of wanted) {
    const nw = norm(w);
    const byId = /^\d+$/.test(w) ? inv.filter((i) => String(i.id) === w) : [];
    const exact = inv.filter((i) => norm(i.title) === nw);
    const part = inv.filter((i) => norm(i.title).includes(nw) || nw.includes(norm(i.title)));
    const hit = byId.length ? byId : exact.length ? exact : part;
    if (hit.length === 0) throw new ProposalError(`"${w}" isn't in the animal-treatment inventory for ${farmOf(ctx, m.farmId)}. Available: ${inv.slice(0, 12).map((i) => i.title).join(", ") || "(none)"}`);
    if (hit.length > 1) throw new ProposalError(`"${w}" matches more than one product (${hit.slice(0, 6).map((i) => i.title).join(", ")}) — ask the user which`);
    if (!chosen.find((c) => c.id === hit[0].id)) chosen.push(hit[0]);
  }
  const used = total_used == null || total_used === "" ? null : Number(total_used);
  if (used != null && !(used > 0)) throw new ProposalError("Amount used must be a positive number");
  if (used != null && chosen.length > 1) throw new ProposalError("Amount used can only be given when there is one product");
  const note = String(notes || "").trim().slice(0, 120);
  const lines = [mobLine(m)];
  chosen.forEach((i) => lines.push(`${i.title} — WHP ${i.withholdingMeat || "nil"}${i.withholdingESI ? ` · ESI ${i.withholdingESI}` : ""}${i.withholdingWool ? ` · Wool ${i.withholdingWool}` : ""}`));
  lines.push(used != null ? `Stock used: ${used} ${unit || chosen[0].containerUnit || ""}`.trim() : "Stock levels won't change (no amount given)");
  if (note) lines.push(note);
  lines.push(`Date: ${dmy(d)}`);
  return card("treat", farmOf(ctx, m.farmId), m, `Treat ${m.name} with ${chosen.map((i) => i.title).join(" + ")}`, lines,
    { mobId: m.id, inventoryIds: chosen.map((i) => i.id), date: d, notes: note, totalUsed: used, unit: used != null ? (unit || chosen[0].containerUnit || "mL") : null });
}

export async function propose_rainfall(ctx, { farm, mm, date }) {
  const f = ctx.farms.length === 1 ? ctx.farms[0] : ctx.farms.find((x) => norm(x.name) === norm(farm)) || ctx.farms.find((x) => norm(x.name).includes(norm(farm)) && norm(farm));
  if (!f) throw new ProposalError(`Which farm? Options: ${ctx.farms.map((x) => x.name).join(", ")}`);
  const amount = Number(mm);
  if (!(amount >= 0 && amount <= 1000)) throw new ProposalError("Rainfall must be between 0 and 1000 mm");
  const d = isoDate(date, ctx);
  return card("rainfall", f.name, null, `Log ${amount} mm of rain`, [`${f.name}`, `${amount} mm on ${dmy(d)}`], { farm: f.name, mm: amount, date: d });
}

export const PROPOSE_HANDLERS = { propose_death, propose_recount, propose_move, propose_split, propose_sale, propose_weigh, propose_treat, propose_rainfall };
