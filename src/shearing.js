// Shearing / crutching records — validation and the text/patch saved for each mob.
// Plain functions (no React) so they can be checked on their own.
import { woolConflict, daysBetween, localToday } from "./withholding.js";

export const SHEAR_TYPES = ["Shearing", "Crutching"];

// "today", "5 days ago", "6 weeks ago", "10 months ago" — for "last shorn" on Mob Details
export function agoText(dateStr, today = localToday()) {
  const d = String(dateStr || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return "";
  const days = daysBetween(d, today);
  if (days < 0) return "dated in the future";
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 70) return `${Math.floor(days / 7)} weeks ago`;
  const months = Math.floor(days / 30.4);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

const isDate = (d) => {
  if (typeof d !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const t = new Date(d + "T00:00:00Z");
  return !isNaN(t.getTime()) && t.toISOString().slice(0, 10) === d;
};

// blank -> null (optional); otherwise a number inside the limits or an error
function optionalNumber(raw, label, max, integer = false) {
  if (raw === "" || raw === null || raw === undefined) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > max || (integer && !Number.isInteger(n))) {
    throw new Error(`${label} must be ${integer ? "a whole number" : "a number"} from 0 to ${max.toLocaleString("en-AU")}`);
  }
  return n;
}

// Which of the chosen mobs would be shorn inside a wool withholding (shearing only —
// crutching isn't checked). Returns [{ mob, until, note }]
export function woolWarnings(type, date, mobs) {
  if (type !== "Shearing" || !isDate(date)) return [];
  const out = [];
  for (const m of mobs) {
    const c = woolConflict(m, date);
    if (c) out.push({ mob: m, ...c });
  }
  return out;
}

const niceDate = (iso) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const num0 = (n) => n.toLocaleString("en-AU", { maximumFractionDigits: 0 });

// rows: [{ mobId, head, bales, woolKg, cost }] (strings straight from the inputs)
// Returns one entry per mob: { mobId, patch, detail }. Throws an Error with a plain-English
// message for the first problem found.
export function buildShearingEntries({ type, date, contractor, notes, rows, mobs, override = false, recordedBy = "" }) {
  if (!SHEAR_TYPES.includes(type)) throw new Error("Choose shearing or crutching");
  if (!isDate(date)) throw new Error("Enter a valid date");
  if (!rows || rows.length === 0) throw new Error("Pick at least one mob");
  const byId = new Map(mobs.map((m) => [m.id, m]));
  const seen = new Set();
  const warnings = woolWarnings(type, date, rows.map((r) => byId.get(r.mobId)).filter(Boolean));
  if (warnings.length && !override) {
    throw new Error("Some mobs are still inside a wool withholding period — tick the box to record it anyway");
  }
  const verb = type === "Shearing" ? "Shorn" : "Crutched";

  return rows.map((r) => {
    const mob = byId.get(r.mobId);
    if (!mob) throw new Error("A selected mob no longer exists — close this and try again");
    if (seen.has(mob.id)) throw new Error(`${mob.name} is in the list twice`);
    seen.add(mob.id);

    const head = Number(r.head);
    if (!Number.isInteger(head) || head < 1) throw new Error(`${mob.name}: enter how many head were ${verb.toLowerCase()}`);
    if (head > (Number(mob.count) || 0)) throw new Error(`${mob.name}: ${num0(head)} head is more than the mob's ${num0(Number(mob.count) || 0)}`);
    const bales = optionalNumber(r.bales, `${mob.name}: bales`, 100000);
    const woolKg = optionalNumber(r.woolKg, `${mob.name}: wool weight`, 10000000);
    const cost = optionalNumber(r.cost, `${mob.name}: cost`, 100000000);

    const parts = [`${verb} ${num0(head)} head`];
    if (bales !== null) parts.push(`${num0(bales)} bale${bales === 1 ? "" : "s"}`);
    if (woolKg !== null) parts.push(`${num0(woolKg)} kg wool${woolKg > 0 ? ` (avg ${(woolKg / head).toFixed(1)} kg/hd)` : ""}`);
    if (cost !== null) parts.push(`$${cost.toLocaleString("en-AU", { maximumFractionDigits: 2 })}`);
    if (String(contractor || "").trim()) parts.push(`Contractor: ${String(contractor).trim()}`);
    if (String(notes || "").trim()) parts.push(String(notes).trim());
    let detail = parts.join(" · ");
    const w = warnings.find((x) => x.mob.id === mob.id);
    if (w) {
      detail += `\n⚠ Shorn inside wool WHP — runs until ${niceDate(w.until)}${w.note ? ` (${w.note})` : ""}. Recorded anyway${recordedBy ? ` by ${recordedBy}` : ""}.`;
    }

    // "last shorn / crutched" only moves forward — a backdated entry must not overwrite a newer one
    const patch = {};
    const dateKey = type === "Shearing" ? "lastShornDate" : "lastCrutchedDate";
    const headKey = type === "Shearing" ? "lastShornHead" : "lastCrutchedHead";
    if (!mob[dateKey] || date >= String(mob[dateKey]).slice(0, 10)) {
      patch[dateKey] = date;
      patch[headKey] = head;
    }
    return { mobId: mob.id, patch, detail };
  });
}
