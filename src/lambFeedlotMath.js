// Lamb feedlot maths — ported function-for-function from the original single-file
// "Kurra-Wirra Feedlot Tracker". Plain functions (no React, no network, no globals)
// so the numbers can be checked against the original tool.
//
// Differences from the original, all deliberate:
//  - parsePaste reads EIDs more carefully (the original mis-read a 15-digit EID
//    followed by a space and a weight, e.g. "982123456789012 41.2") and reports
//    Excel scientific-notation rows ("9.82E+14") instead of silently skipping them
//  - mobStats takes the mob's lambs directly (no global lookups)
//  - "Unattributed" lambs are flagged (UNATTR_ID) so screens can keep their
//    cost-free "margin" out of averages and rankings

export const UNATTR_ID = "UNATTR";

export const todayStr = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`; // local date, not UTC — "today" must match the farm's day
};

export function daysBetween(d1, d2) {
  const a = new Date(d1 + "T00:00:00"), b = new Date(d2 + "T00:00:00");
  return Math.max(0, Math.round((b - a) / 86400000));
}

export const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

export function fmtEid(e) {
  return e.length >= 15 ? e.slice(0, 3) + " " + e.slice(3, 9) + " " + e.slice(9) : e;
}

export function money(v, dec) {
  dec = dec === undefined ? 2 : dec;
  const sign = v < 0 ? "−" : "+";
  return sign + "$" + Math.abs(v).toFixed(dec);
}

// Economics of one SOLD lamb. mobAvgInWt = average induction weight of the mob's
// lambs that have one (used when this lamb was pasted without a weight).
export function animalEcon(a, m, settings, mobAvgInWt) {
  const s = settings;
  const days = daysBetween(m.inDate, a.saleDate);
  let costIn = 0;
  if (m.costBasis === "perhead") costIn = m.costRate || 0;
  else if (m.costBasis === "perkg") {
    const w = a.inWt != null ? a.inWt : (mobAvgInWt || 0);
    costIn = w * (m.costRate || 0);
  }
  const feed = days * (s.feedCost || 0);
  const revenue = (a.saleWt || 0) * (a.price || 0) - (s.levies || 0);
  return { days, costIn, feed, revenue, margin: revenue - costIn - feed };
}

// anims = this mob's lambs only
export function mobStats(m, settings, anims, today = todayStr()) {
  const s = settings;
  const sold = anims.filter((a) => a.sold);
  const inducted = anims.length;
  const onFarm = inducted - sold.length;
  const closed = inducted > 0 && onFarm === 0;
  const currentDays = daysBetween(m.inDate, today);
  const inWts = anims.map((a) => a.inWt).filter((x) => x != null);
  const avgInWt = avg(inWts);
  let totMargin = 0, totDays = 0, totRev = 0, totExitLW = 0, nExit = 0;
  for (const a of sold) {
    const e = animalEcon(a, m, s, avgInWt);
    totMargin += e.margin; totDays += e.days; totRev += e.revenue;
    const lw = a.saleWtType === "cw" ? (a.saleWt / ((s.dressing || 47) / 100)) : a.saleWt;
    if (lw) { totExitLW += lw; nExit++; }
  }
  const nSold = sold.length;
  const profitHd = nSold ? totMargin / nSold : null;
  const avgDays = nSold ? totDays / nSold : null;
  const profitDay = (nSold && avgDays) ? profitHd / avgDays : null;
  const avgExitLW = nExit ? totExitLW / nExit : null;
  const gain = (avgExitLW != null && avgInWt != null) ? avgExitLW - avgInWt : null;
  const feedAccrued = onFarm * currentDays * (s.feedCost || 0);
  const avgRevenueHd = nSold ? totRev / nSold : null; // sale income per head after levies (used for Unattributed)
  return {
    anims, sold, inducted, onFarm, closed, currentDays, avgInWt,
    nSold, profitHd, avgDays, profitDay, totMargin, avgExitLW, gain, feedAccrued, avgRevenueHd,
  };
}

// Group lambs by mob once (instead of filtering the whole list for every mob)
export function groupByMob(animals) {
  const map = new Map();
  for (const a of animals) {
    let list = map.get(a.mobId);
    if (!list) map.set(a.mobId, (list = []));
    list.push(a);
  }
  return map;
}

// ── Paste parsing ────────────────────────────────────────────────────────────
// Excel/CSV rows → {eid, wt, price}. Tab / comma / semicolon / space separated.
// An EID is 14–16 digits; it may be written in groups ("982 000412 887301").
const SCI = /\d[eE]\+?\d/;
const isDigits = (s) => /^\d+$/.test(s);

// Space-separated line: join leading digit-only groups into one EID, stopping as soon
// as there are 15 digits so the weight that follows can never be swallowed into it.
function spaceCells(line) {
  const tokens = line.split(/\s+/).filter((t) => t !== "");
  const out = [];
  let i = 0;
  while (i < tokens.length) {
    if (isDigits(tokens[i])) {
      let acc = tokens[i];
      let j = i + 1;
      while (acc.length < 15 && j < tokens.length && isDigits(tokens[j]) && (acc + tokens[j]).length <= 16) {
        acc += tokens[j]; j++;
      }
      if (acc.length >= 14 && acc.length <= 16) { out.push(acc); i = j; continue; }
    }
    out.push(tokens[i]);
    i++;
  }
  return out;
}

export function parsePaste(text, mode) {
  // mode: 'induct' -> {eid, wt|null}; 'sale' -> {eid, wt|null, price|null}
  const rows = []; const skipped = []; let sciCount = 0;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (SCI.test(line)) sciCount++;
    let cells = line.split(/\t|,|;/).map((c) => c.trim()).filter((c) => c !== "");
    if (cells.length <= 1) {
      cells = spaceCells(line);
    } else {
      // an EID written in groups inside its own cell: "982 000412 887301"
      cells = cells.map((c) => {
        if (/^[\d ]+$/.test(c)) {
          const squashed = c.replace(/ /g, "");
          if (squashed.length >= 14 && squashed.length <= 16) return squashed;
        }
        return c;
      });
    }
    let eid = null; const nums = [];
    for (const c of cells) {
      const digits = c.replace(/[^\d]/g, "");
      if (!eid && digits.length >= 14 && digits.length <= 16 && !/\./.test(c)) { eid = digits; continue; }
      const n = parseFloat(c.replace(/[^0-9.\-]/g, ""));
      if (!isNaN(n)) nums.push(n);
    }
    if (!eid) { skipped.push(raw.trim()); continue; }
    let wt = null, price = null;
    if (mode === "induct") {
      wt = nums.find((n) => n >= 5 && n <= 150) ?? null;
    } else {
      // first plausible number = weight, next plausible = price
      const cand = nums.filter((n) => n > 0);
      if (cand.length >= 1) wt = cand[0];
      if (cand.length >= 2) price = cand[1];
      if (wt != null && (wt < 5 || wt > 200)) wt = null;
      if (price != null && (price <= 0 || price > 30)) price = null;
    }
    rows.push({ eid, wt, price });
  }
  // dedupe within paste
  const seen = new Set(); const deduped = []; let dupCount = 0;
  for (const r of rows) {
    if (seen.has(r.eid)) { dupCount++; continue; }
    seen.add(r.eid); deduped.push(r);
  }
  return { rows: deduped, dupCount, skipped, sciCount };
}
