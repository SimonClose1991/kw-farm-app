// When two mobs are merged the combined mob must carry whichever withholding runs
// LONGER — if one half was still in withholding, the whole mob is. (Merging used to keep
// only the target mob's fields, so a mob in withholding could merge into a clear one and
// "lose" it.) Mirrors the date rules in src/withholding.js.

const FIELDS = { meat: "whpUntil", esi: "esiUntil", wool: "woolWhpUntil" };

const isoDay = (v) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null);

function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Older mobs only have lastTreatDate + whpDays/esiDays
function legacyUntil(extra, kind) {
  if (kind === "wool") return null;
  const days = Number(kind === "meat" ? extra?.whpDays : extra?.esiDays);
  const d = isoDay(extra?.lastTreatDate);
  return d && days > 0 ? addDays(d, Math.round(days)) : null;
}

const untilOf = (extra, kind) => {
  const a = isoDay(extra?.[FIELDS[kind]]);
  const b = legacyUntil(extra, kind);
  return !a ? b : !b ? a : a >= b ? a : b;
};

// Returns the withholding fields to store on the merged mob (target's `extra` is kept as is
// for everything else).
export function mergedWithholding(sourceExtra, targetExtra) {
  const out = {};
  for (const kind of Object.keys(FIELDS)) {
    const s = untilOf(sourceExtra, kind);
    const t = untilOf(targetExtra, kind);
    const later = !s ? t : !t ? s : s >= t ? s : t;
    if (later) out[FIELDS[kind]] = later;
  }
  // The wool note/start date go with whichever side's wool withholding ends later
  const sw = untilOf(sourceExtra, "wool"), tw = untilOf(targetExtra, "wool");
  const winner = sw && (!tw || sw > tw) ? sourceExtra : targetExtra;
  if (out.woolWhpUntil && winner) {
    if (winner.woolWhpNote) out.woolWhpNote = winner.woolWhpNote;
    if (winner.woolWhpFrom) out.woolWhpFrom = winner.woolWhpFrom;
  }
  return out;
}
