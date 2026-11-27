// Commodity usage for the sheep feedlot — plain functions (no React, no network) so the numbers can be
// checked on their own.
//
// A feed run records kg of MIXED ration fed per pen, not the ingredients. Each ingredient's kg is that
// kg × its share of the mix (the ingredient's kg/head ÷ the mix's total kg/head). The mix used is the
// copy saved with the run, so changing the mix in Settings never rewrites past totals; a run with no
// saved mix falls back to the mix passed in (today's).
import { num, eventKg, penDailyKg, activeOnly, totalHead } from "./sheepFeedMath.js";

const pad2 = (n) => String(n).padStart(2, "0");
export const dateKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
export const dayKeyOf = (iso) => dateKey(new Date(iso));
export const addDaysKey = (key, n) => { const [y, m, d] = key.split("-").map(Number); return dateKey(new Date(y, m - 1, d + n, 12)); };

// Australian financial year, 1 July – 30 June. offset 0 = the one containing `now`, -1 = the one before.
export function fyRange(now = new Date(), offset = 0) {
  const start = (now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1) + offset;
  return { from: `${start}-07-01`, to: `${start + 1}-06-30`, label: `FY ${start}/${String(start + 1).slice(2)}` };
}

export function mixShares(ingredients) {
  const list = (ingredients || []).filter((i) => i && String(i.name || "").trim());
  const total = list.reduce((s, i) => s + num(i.kgPerHead), 0);
  if (total <= 0) return [];
  return list.map((i) => ({ name: String(i.name).trim(), share: num(i.kgPerHead) / total }));
}

const addTo = (map, name, kg, loaded) => {
  const k = name.toLowerCase();
  const cur = map.get(k) || { name, kg: 0, loadedKg: 0 };
  cur.kg += kg;
  cur.loadedKg += loaded;
  map.set(k, cur);
};

// Commodity totals for runs whose start day falls in from..to (yyyy-mm-dd, inclusive; either may be "")
export function commodityUsage(runs, fallbackMix, { from = "", to = "" } = {}) {
  const map = new Map();
  const days = new Set();
  let fedKg = 0, loadedKg = 0, used = 0, assumedRuns = 0, unattributedKg = 0, anyBuffer = false;
  for (const r of runs || []) {
    const key = dayKeyOf(r.startedAt);
    if ((from && key < from) || (to && key > to)) continue;
    const kg = (r.events || []).reduce((s, e) => s + eventKg(e), 0);
    used += 1;
    days.add(key);
    const mix = r.mix && Array.isArray(r.mix.ingredients) ? r.mix : null;
    if (!mix || mix.assumed) assumedRuns += 1;
    const src = mix || fallbackMix || {};
    const buffer = 1 + num(src.bufferPercent) / 100;
    if (buffer > 1) anyBuffer = true;
    fedKg += kg;
    loadedKg += kg * buffer;
    const shares = mixShares(src.ingredients);
    if (!shares.length) { unattributedKg += kg; continue; }
    for (const s of shares) addTo(map, s.name, kg * s.share, kg * s.share * buffer);
  }
  const rows = [...map.values()].sort((a, b) => b.kg - a.kg).map((r) => ({ ...r, share: fedKg > 0 ? r.kg / fedKg : 0 }));
  return { rows, fedKg, loadedKg, runs: used, days: days.size, unattributedKg, assumedRuns, anyBuffer };
}

// What today's sheep numbers say each commodity should be per day (pen head × kg/head × ration %, split by the mix)
export function plannedDaily(pens, ingredients) {
  const active = activeOnly(pens || []);
  const totalKg = active.reduce((s, p) => s + penDailyKg(p), 0);
  const rows = mixShares(ingredients).map((s) => ({ name: s.name, kg: totalKg * s.share }));
  return { totalKg, rows, head: totalHead(pens || []), pens: active.length };
}

// Fed so far today, yesterday, and the average per FED day over the 7 days before today
export function dailyActuals(runs, fallbackMix, todayKey) {
  const yKey = addDaysKey(todayKey, -1);
  const today = commodityUsage(runs, fallbackMix, { from: todayKey, to: todayKey });
  const yesterday = commodityUsage(runs, fallbackMix, { from: yKey, to: yKey });
  const week = commodityUsage(runs, fallbackMix, { from: addDaysKey(todayKey, -7), to: yKey });
  const d = Math.max(1, week.days);
  return { today, yesterday, week, weekDays: week.days, weekAvgKg: week.fedKg / d, weekAvgRows: week.rows.map((r) => ({ name: r.name, kg: r.kg / d })) };
}
