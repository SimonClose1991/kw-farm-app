// Sheep feedlot maths — kept as plain functions (no React, no network) so the
// numbers can be checked on their own. Mirrors the formulas in the original
// Replit feed manager:
//   pen feed   = head × kg/head/day × ration% × AM/PM split
//   mixer load = Σ(head × ration%) × split × ingredient kg/head × (1 + buffer%)

export const num = (v, fallback = 0) => {
  if (v === null || v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// A null/undefined ration % means "untouched" = 100%. (0 is a real value: 0%.)
export const rationPct = (pen) => (pen.rationPercent == null ? 100 : num(pen.rationPercent, 100));

export const clampPercent = (v) => Math.max(0, Math.min(200, Math.round(num(v))));

export const adjustPercent = (current, delta) => clampPercent(num(current, 100) + delta);

// Whole day's feed for one pen
export const penDailyKg = (pen) => num(pen.headCount) * num(pen.kgPerHead) * (rationPct(pen) / 100);

// One feed (AM or PM) for one pen
export const penFeedKg = (pen, splitFraction) => penDailyKg(pen) * num(splitFraction);

export const splitFor = (period, settings) => {
  if (period === "ALL") return 1;
  return period === "PM" ? num(settings?.splitPm, 0.4) : num(settings?.splitAm, 0.6);
};

export const activeOnly = (pens) => pens.filter((p) => p.active);

export const totalHead = (pens) => activeOnly(pens).reduce((s, p) => s + num(p.headCount), 0);

// Head count weighted by each pen's ration % (a pen on 110% counts as 1.1 per head)
export const effectiveHead = (pens) =>
  activeOnly(pens).reduce((s, p) => s + num(p.headCount) * (rationPct(p) / 100), 0);

export const mixTotalPerHead = (ingredients) =>
  (ingredients || []).reduce((s, i) => s + num(i.kgPerHead), 0);

export function mixerLoad(pens, ingredients, splitFraction, bufferPercent) {
  const eff = effectiveHead(pens);
  const buffer = 1 + num(bufferPercent) / 100;
  const rows = (ingredients || []).map((i) => ({
    name: i.name,
    kgPerHead: num(i.kgPerHead),
    amount: eff * num(splitFraction) * num(i.kgPerHead) * buffer,
  }));
  return { effectiveHead: eff, rows, total: rows.reduce((s, r) => s + r.amount, 0) };
}

// "I've got a 6,000 kg wagon — how much of each?" Proportional to the ingredient ratios.
export function loadBreakdown(targetKg, ingredients) {
  const target = num(targetKg);
  const ratioTotal = mixTotalPerHead(ingredients);
  if (target <= 0 || ratioTotal <= 0) return [];
  return ingredients.map((i) => ({
    name: i.name,
    kgPerHead: num(i.kgPerHead),
    amount: target * (num(i.kgPerHead) / ratioTotal),
  }));
}

// New events store totalKg; runs recorded by the earlier cut-down screen stored kg
export const eventKg = (e) => num(e.totalKg ?? e.kg);

export function runTotals(events) {
  const byRation = {};
  let total = 0;
  for (const e of events || []) {
    const kg = eventKg(e);
    total += kg;
    if (e.ration) byRation[e.ration] = (byRation[e.ration] || 0) + kg;
  }
  return { totalKg: total, byRation };
}

export const formatKg = (n) => {
  const v = num(n);
  const shown = Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 10) / 10;
  return `${shown.toLocaleString("en-AU")} kg`;
};
