// "How many did I have on <date>?" — rebuilt from each mob's history.
//
// The app never stores a count-over-time, only the mob's CURRENT count plus history lines, so this
// is a best-effort reconstruction and says how sure it is:
//   high      anchored on a Recount on/before the date, and rolling forward from it lands exactly on today's count
//   estimate  worked backwards from today's count (or the roll-forward doesn't match today's count,
//             i.e. somebody changed the count without a record) — probably right, not guaranteed
//   unknown   a Recount after the date hides what the count was before it, and nothing earlier anchors it
//
// History wording this understands (what the app writes today — see submitAction / onSplit in App.jsx):
//   Recount   "New head count: 125"            |  "Recounted to 0 — mob archived"
//   Death     "Number of deaths: 2, Cause: …"
//   Sale      "Number sold: 5, …"
//   Move      "Split: 15 head moved to B, 85 remain in A"   (source mob, count already reduced)
//             "Received 15 head split from A"               (existing mob that took the split)
//   Transfer  "Transferred 10 head to <farm>"

const iso = (d) => {
  if (!d) return null;
  if (typeof d === "string") return d.slice(0, 10);
  try { return d.toISOString().slice(0, 10); } catch { return null; }
};

// One history row -> { date, id, kind: "abs"|"delta"|"merge", value } or null when it doesn't change the count
export function parseCountEvent(row) {
  const action = String(row.action || "");
  const detail = String(row.detail || "");
  const base = { date: iso(row.date), id: row.id ?? 0 };
  let m;
  if (action === "Recount") {
    if (/recounted to 0/i.test(detail)) return { ...base, kind: "abs", value: 0 };
    if ((m = detail.match(/New head count:\s*(\d+)/i))) return { ...base, kind: "abs", value: Number(m[1]) };
    return null;
  }
  if (action === "Death" && (m = detail.match(/Number of deaths:\s*(\d+)/i))) return { ...base, kind: "delta", value: -Number(m[1]) };
  if (action === "Sale" && (m = detail.match(/Number sold:\s*(\d+)/i))) return { ...base, kind: "delta", value: -Number(m[1]) };
  if (action === "Transfer" && (m = detail.match(/^Transferred\s+(\d+)\s+head to/i))) return { ...base, kind: "delta", value: -Number(m[1]) };
  if (action === "Move") {
    if ((m = detail.match(/^Split:\s*(\d+)\s+head moved/i))) return { ...base, kind: "delta", value: -Number(m[1]) };
    if ((m = detail.match(/^Received\s+(\d+)\s+head split from/i))) return { ...base, kind: "delta", value: Number(m[1]) };
  }
  if (action === "Merge") return { ...base, kind: "merge", value: 0 };
  return null;
}

// A split-off / copied mob is created with a COPY of its parent's history, then one marker line:
//   "Split 15 head from A" (count known)   |   "Copied from X" (count not in the text)
// Everything copied in before the marker belongs to the parent, so it must not be replayed for this mob.
function creationMarker(rows) {
  let marker = null;
  for (const r of rows || []) {
    const detail = String(r.detail || "");
    let m;
    if (r.action === "Move" && (m = detail.match(/^Splits+(d+)s+head from/i))) marker = { id: r.id ?? 0, date: iso(r.date), value: Number(m[1]) };
    else if (r.action === "Copy" && /^Copied from/i.test(detail)) marker = { id: r.id ?? 0, date: iso(r.date), value: null };
  }
  return marker;
}

// Count of ONE mob at the end of `date` (yyyy-mm-dd).
// mob: { count, createdAt }, history: rows of { date, action, detail, id }
export function countAtDate(mob, history, date) {
  const created = iso(mob.createdAt);
  if (created && created > date) return { count: 0, confidence: "high", note: "not on the books yet" };

  const marker = creationMarker(history);
  const ownRows = marker ? (history || []).filter((r) => (r.id ?? 0) > marker.id) : (history || []);
  const events = ownRows.map(parseCountEvent).filter(Boolean);
  if (marker && marker.value != null) events.push({ date: marker.date, id: marker.id, kind: "abs", value: marker.value });
  events.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id - b.id));
  const current = Number(mob.count) || 0;
  const hasMerge = events.some((e) => e.kind === "merge");

  // Roll forward from an anchor (a Recount on/before the date) to `until`
  const forward = (startIdx, until) => {
    let c = events[startIdx].value;
    for (let i = startIdx + 1; i < events.length; i++) {
      const e = events[i];
      if (until && e.date > until) break;
      if (e.kind === "abs") c = e.value; else if (e.kind === "delta") c += e.value;
    }
    return c;
  };

  let anchor = -1;
  for (let i = 0; i < events.length; i++) if (events[i].kind === "abs" && events[i].date <= date) anchor = i;

  if (anchor >= 0) {
    const atDate = forward(anchor, date);
    const nowPredicted = forward(anchor, null);
    const consistent = nowPredicted === current;
    return {
      count: Math.max(0, atDate),
      confidence: consistent && !hasMerge ? "high" : "estimate",
      note: consistent ? (hasMerge ? "mob has been merged with another — check" : null)
        : `history adds up to ${nowPredicted} now but the mob says ${current} — the count was changed without a record`,
    };
  }

  // No Recount on/before the date: undo everything after it, newest first
  let c = current;
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    if (e.date <= date) break;
    if (e.kind === "abs") return { count: null, confidence: "unknown", note: "a recount after that date hides the earlier number" };
    if (e.kind === "delta") c -= e.value;
  }
  return { count: Math.max(0, c), confidence: "estimate", note: hasMerge ? "mob has been merged with another — check" : null };
}

// Whole-farm answer. mobs: rows incl. archived; historyByMob: Map(mobId -> rows)
export function countsOnDate(mobs, historyByMob, date, { species } = {}) {
  const want = species ? String(species).toLowerCase() : null;
  const rows = [];
  for (const mob of mobs) {
    const sp = String(mob.species || "Unknown");
    if (want && !(sp.toLowerCase() === want || sp.toLowerCase() === want + "s" || sp.toLowerCase().startsWith(want))) continue;
    const r = countAtDate(mob, historyByMob.get(mob.id) || [], date);
    rows.push({ id: mob.id, farm: mob.farmName, name: mob.name, species: sp, paddock: mob.paddock, count: r.count, confidence: r.confidence, note: r.note });
  }
  const known = rows.filter((r) => r.count != null);
  const total = known.reduce((s, r) => s + r.count, 0);
  const bySpecies = {};
  known.forEach((r) => { bySpecies[r.species] = (bySpecies[r.species] || 0) + r.count; });
  const byFarm = {};
  known.forEach((r) => { byFarm[r.farm] = (byFarm[r.farm] || 0) + r.count; });
  const shaky = rows.filter((r) => r.confidence !== "high");
  const unknown = rows.filter((r) => r.confidence === "unknown");
  return {
    date, total, bySpecies, byFarm,
    mobsCounted: known.filter((r) => r.count > 0).length,
    unreliable: shaky.filter((r) => r.count !== 0 || r.confidence === "unknown").map((r) => ({ mob: r.name, farm: r.farm, count: r.count, confidence: r.confidence, note: r.note })).slice(0, 25),
    unknownCount: unknown.length,
    caveat: shaky.length
      ? `${shaky.length} mob(s) could only be estimated from history${unknown.length ? ` and ${unknown.length} could not be worked out (left out of the total)` : ""}, so treat the total as approximate.`
      : "Every mob could be traced from its recount history.",
    mobs: rows.filter((r) => r.count !== 0).slice(0, 60).map((r) => ({ mob: r.name, farm: r.farm, species: r.species, count: r.count, confidence: r.confidence })),
  };
}
