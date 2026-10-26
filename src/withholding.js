// Withholding periods — meat (WHP), export slaughter interval (ESI) and wool (WHP).
//
// A mob stores the DATE each withholding runs until (whpUntil / esiUntil / woolWhpUntil),
// and a treatment only ever pushes that date LATER. (It used to keep just the last
// treatment's date and days, so a short product given after a long one made the mob look
// clear while the long withholding was still running.)
//
// Mobs saved before this change only have lastTreatDate + whpDays + esiDays; those are
// still read, so nothing needs migrating.
//
// A withholding of N days from a treatment on date D runs until D + N and the mob is
// clear on that day — the same rule the map pins already used.

const FIELD = { meat: "whpUntil", esi: "esiUntil", wool: "woolWhpUntil" };
export const KINDS = ["meat", "esi", "wool"];
export const KIND_LABEL = { meat: "Meat WHP", esi: "Export ESI", wool: "Wool WHP" };

export function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const isoDay = (v) => {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(v)) return null;
  return v.slice(0, 10);
};

export function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a, b) {
  return Math.round((new Date(b + "T00:00:00Z") - new Date(a + "T00:00:00Z")) / 86400000);
}

// Reads what someone typed from a product label: "21 days", "6 weeks", "3 months",
// "14d", "7-14 days" (the longer end — never understate a withholding), "Nil", 21
export function parseDays(v) {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) && v > 0 ? Math.ceil(v) : 0;
  const s = String(v).trim().toLowerCase();
  if (!s || /^(nil|none|n\/?a|no|-+)\b/.test(s)) return 0;
  const range = s.match(/(\d+(?:\.\d+)?)\s*(?:-|–|—|to)\s*(\d+(?:\.\d+)?)/);
  const first = s.match(/(\d+(?:\.\d+)?)/);
  if (!first) return 0;
  const n = range ? Math.max(Number(range[1]), Number(range[2])) : Number(first[1]);
  const unit = s.slice((range ? s.indexOf(range[0]) + range[0].length : first.index + first[0].length)).trim();
  let mult = 1;
  if (/^(w\b|wk|wks|week)/.test(unit)) mult = 7;
  else if (/^(mo\b|mos\b|mth|month)/.test(unit)) mult = 30;
  return Math.ceil(n * mult);
}

const laterOf = (a, b) => (!a ? b || null : !b ? a : a >= b ? a : b);

// From the older fields (meat and ESI only — wool is new)
function legacyUntil(mob, kind) {
  if (kind === "wool") return null;
  const days = Number(kind === "meat" ? mob?.whpDays : mob?.esiDays);
  const d = isoDay(mob?.lastTreatDate);
  if (!d || !(days > 0)) return null;
  return addDays(d, Math.round(days));
}

export function untilOf(mob, kind) {
  return laterOf(isoDay(mob?.[FIELD[kind]]), legacyUntil(mob, kind));
}

export function statusOf(mob, today = localToday()) {
  const out = {};
  for (const k of KINDS) {
    const until = untilOf(mob, k);
    const active = !!until && until > today;
    out[k] = { until, active, daysLeft: active ? daysBetween(today, until) : 0 };
  }
  out.any = KINDS.some((k) => out[k].active);
  out.woolNote = out.wool.active ? (mob?.woolWhpNote || null) : null;
  return out;
}

// What to save on a mob after a treatment. Only ever moves a date later.
export function treatmentPatch(mob, { date, meatDays = 0, esiDays = 0, woolDays = 0, productNames = "" }) {
  const patch = {};
  const apply = (kind, days) => {
    if (!(days > 0)) return null;
    const candidate = addDays(date, days);
    const current = untilOf(mob, kind);
    const next = laterOf(current, candidate);
    patch[FIELD[kind]] = next;
    return next === candidate && candidate !== current ? "later" : null;
  };
  apply("meat", meatDays);
  apply("esi", esiDays);
  if (apply("wool", woolDays) === "later") {
    patch.woolWhpNote = `${productNames || "treatment"} on ${date}`;
    patch.woolWhpFrom = date; // when the withholding that decides the end date started
  }
  return patch;
}

// Is shearing on `date` inside this mob's wool withholding? Only if the treatment had
// already happened by then (a shearing dated before the treatment isn't affected).
// It looks at the withholding that runs longest; an earlier, shorter one that was
// running on a backdated date isn't tracked separately.
export function woolConflict(mob, date) {
  const until = untilOf(mob, "wool");
  if (!until || !(date < until)) return null;
  const from = isoDay(mob?.woolWhpFrom);
  if (from && date < from) return null;
  return { until, note: mob?.woolWhpNote || null };
}

// Short text for the Livestock list, e.g. "Meat 12d · Wool 30d"
export function withholdingText(mob, today = localToday()) {
  const s = statusOf(mob, today);
  return KINDS.filter((k) => s[k].active)
    .map((k) => `${k === "meat" ? "Meat" : k === "esi" ? "ESI" : "Wool"} ${s[k].daysLeft}d`)
    .join(" · ");
}
