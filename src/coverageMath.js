// GPS spray / bait coverage maths. Pure functions — no React, no DOM except renderCoverage()
// which only needs a canvas. See GpsCoverage.jsx for the screen that uses this.
//
// How it works: the paddock is laid out on a small metric grid (cells of ~2 m). Every pair of
// GPS fixes while the machine is ON stamps a "swath" (a capsule of the chosen width) onto the
// grid. Each cell remembers how many separate passes covered it (0 / 1 / 2+), so the same grid
// gives both the picture (green = once, orange = twice) and the numbers (hectares, % of paddock,
// overlap).

const DEG = Math.PI / 180;

// ── Tunables ────────────────────────────────────────────────────────────────
export const MAX_ACCURACY_M = 25;   // ignore GPS fixes worse than this
export const MAX_GAP_S = 12;        // don't join fixes further apart in time than this
export const MAX_GAP_M = 40;        // …or in distance (phantom strips after a dropout)
const MIN_CELL_M = 1;               // grid resolution
const MAX_CELLS = 450000;           // coarsen the grid for very large paddocks

// ── Geometry helpers ────────────────────────────────────────────────────────
// Outer ring of a GeoJSON Polygon / MultiPolygon (or a Feature wrapping one) as [lng, lat] pairs
export function ringFromGeojson(gj) {
  if (!gj) return null;
  const g = gj.type === "Feature" ? gj.geometry : gj;
  if (!g) return null;
  let ring = null;
  if (g.type === "Polygon") ring = g.coordinates?.[0];
  else if (g.type === "MultiPolygon") ring = g.coordinates?.[0]?.[0];
  if (!ring || ring.length < 3) return null;
  return ring.map(([lng, lat]) => [Number(lng), Number(lat)]);
}

// Local flat-earth projection around (lat0, lng0): metres east (x) / north (y). Accurate to well
// under 0.1% over a paddock.
export function makeProjection(lat0, lng0) {
  const mLat = 111132.92 - 559.82 * Math.cos(2 * lat0 * DEG) + 1.175 * Math.cos(4 * lat0 * DEG);
  const mLng = 111412.84 * Math.cos(lat0 * DEG) - 93.5 * Math.cos(3 * lat0 * DEG);
  return {
    lat0, lng0,
    toXY: (lat, lng) => [(lng - lng0) * mLng, (lat - lat0) * mLat],
    toLL: (x, y) => [lat0 + y / mLat, lng0 + x / mLng],
  };
}

function pointInPoly(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// ── Coverage grid ───────────────────────────────────────────────────────────
// ring: [[lng, lat], …]. Returns the grid object that addSegment()/renderCoverage() work on.
export function createCoverage(ring) {
  const lat0 = ring.reduce((s, p) => s + p[1], 0) / ring.length;
  const lng0 = ring.reduce((s, p) => s + p[0], 0) / ring.length;
  const proj = makeProjection(lat0, lng0);
  const poly = ring.map(([lng, lat]) => proj.toXY(lat, lng));
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  poly.forEach(([x, y]) => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); });
  const w = maxX - minX, h = maxY - minY;
  let cell = MIN_CELL_M;
  while ((w / cell) * (h / cell) > MAX_CELLS) cell *= 1.25;
  const nx = Math.max(1, Math.ceil(w / cell)), ny = Math.max(1, Math.ceil(h / cell));
  const mask = new Uint8Array(nx * ny);
  let maskCells = 0;
  for (let j = 0; j < ny; j++) {
    const cy = minY + (j + 0.5) * cell;
    for (let i = 0; i < nx; i++) {
      if (pointInPoly(minX + (i + 0.5) * cell, cy, poly)) { mask[j * nx + i] = 1; maskCells++; }
    }
  }
  const lastS = new Float32Array(nx * ny).fill(-1e9);
  return {
    proj, poly, minX, minY, maxX, maxY, cell, nx, ny,
    mask, maskCells,
    pass: new Uint8Array(nx * ny),   // 0, 1 or 2 (= 2 or more)
    lastS,                           // path distance (m) at which each cell was last stamped
    touched: 0,                      // cells covered at least once
    overlap: 0,                      // cells covered two or more times
    sMax: 0,                         // furthest path distance stamped so far (keeps separate riders' distances apart)
    version: 0,                      // bumps whenever the picture changes
  };
}

// Stamp one swath segment (x0,y0)→(x1,y1), width in metres, into the grid. sStart/sEnd are the
// distance travelled (while painting) at each end — used so the cells covered by the SAME
// continuous pass aren't counted again by the next step, only a genuine return pass is.
export function addSegment(cov, x0, y0, x1, y1, widthM, sStart, sEnd) {
  const { cell, nx, ny, minX, minY, mask, pass, lastS } = cov;
  const r = widthM / 2;
  const thr = Math.max(5, widthM * 0.75);
  const i0 = Math.max(0, Math.floor((Math.min(x0, x1) - r - minX) / cell));
  const i1 = Math.min(nx - 1, Math.floor((Math.max(x0, x1) + r - minX) / cell));
  const j0 = Math.max(0, Math.floor((Math.min(y0, y1) - r - minY) / cell));
  const j1 = Math.min(ny - 1, Math.floor((Math.max(y0, y1) + r - minY) / cell));
  const dx = x1 - x0, dy = y1 - y0;
  const len2 = dx * dx + dy * dy;
  let changed = false;
  for (let j = j0; j <= j1; j++) {
    const cy = minY + (j + 0.5) * cell;
    for (let i = i0; i <= i1; i++) {
      const c = j * nx + i;
      if (!mask[c]) continue;
      const cx = minX + (i + 0.5) * cell;
      let t = len2 > 0 ? ((cx - x0) * dx + (cy - y0) * dy) / len2 : 0;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const ex = cx - (x0 + t * dx), ey = cy - (y0 + t * dy);
      if (ex * ex + ey * ey > r * r) continue;
      if (sStart - lastS[c] > thr && pass[c] < 2) {
        pass[c]++;
        if (pass[c] === 1) cov.touched++; else cov.overlap++;
        changed = true;
      }
      lastS[c] = sEnd;
    }
  }
  if (sEnd > cov.sMax) cov.sMax = sEnd;
  if (changed) cov.version++;
  return changed;
}

export function coverageTotals(cov) {
  const ha = (n) => (n * cov.cell * cov.cell) / 10000;
  return {
    paddockHa: ha(cov.maskCells),
    coveredHa: ha(cov.touched),
    overlapHa: ha(cov.overlap),
    pct: cov.maskCells ? (cov.touched / cov.maskCells) * 100 : 0,
    overlapPct: cov.touched ? (cov.overlap / cov.touched) * 100 : 0,
  };
}

// ── Tracker: turns a stream of GPS fixes into stamped swaths ────────────────
// push({t (ms), lat, lng, acc}, widthM) paints from the previous fix to this one.
// breakStroke() ends the current stroke (machine switched OFF) so nothing joins across the gap.
export function createTracker(cov) {
  let prev = null;     // last fix used, in metres + time
  // distance travelled while painting. A new rider / session starts beyond everything already painted,
  // so ground another rider (or an earlier session) covered counts as a genuine second pass.
  let s = cov.sMax ? cov.sMax + 1000 : 0;
  const state = {
    gaps: 0, speed: 0,
    push(fix, widthM) {
      if (fix.acc != null && fix.acc > MAX_ACCURACY_M) return { used: false, changed: false };
      const [x, y] = cov.proj.toXY(fix.lat, fix.lng);
      if (!prev) { prev = { x, y, t: fix.t }; return { used: true, changed: false }; }
      const dt = (fix.t - prev.t) / 1000;
      const d = Math.hypot(x - prev.x, y - prev.y);
      if (dt > MAX_GAP_S || d > MAX_GAP_M || dt < 0) {   // dropout / app was in the background
        state.gaps++;
        prev = { x, y, t: fix.t };
        return { used: true, changed: false, gap: true };
      }
      // GPS wobble while standing still — wait until we've really moved
      if (d < Math.max(1.5, (fix.acc || 0) * 0.8)) return { used: true, changed: false };
      state.speed = dt > 0 ? d / dt : 0;
      const changed = addSegment(cov, prev.x, prev.y, x, y, widthM, s, s + d);
      s += d;
      prev = { x, y, t: fix.t };
      return { used: true, changed };
    },
    breakStroke() { prev = null; state.speed = 0; },
  };
  return state;
}

// ── Picture ─────────────────────────────────────────────────────────────────
// Paints the coverage into a canvas sized nx × ny (one pixel per cell, north at the top).
const ONCE = [22, 163, 74, 150];     // green
const TWICE = [234, 88, 12, 190];    // orange
export function renderCoverage(cov, canvas) {
  if (canvas.width !== cov.nx) canvas.width = cov.nx;
  if (canvas.height !== cov.ny) canvas.height = cov.ny;
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(cov.nx, cov.ny);
  const d = img.data;
  for (let j = 0; j < cov.ny; j++) {
    const row = (cov.ny - 1 - j) * cov.nx;
    for (let i = 0; i < cov.nx; i++) {
      const p = cov.pass[j * cov.nx + i];
      if (!p) continue;
      const col = p === 1 ? ONCE : TWICE;
      const o = (row + i) * 4;
      d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = col[3];
    }
  }
  ctx.putImageData(img, 0, 0);
}

// Lat/lng bounds of the grid (south-west, north-east) for placing the canvas on a map
export function coverageBounds(cov) {
  const [swLat, swLng] = cov.proj.toLL(cov.minX, cov.minY);
  const [neLat, neLng] = cov.proj.toLL(cov.minX + cov.nx * cov.cell, cov.minY + cov.ny * cov.cell);
  return { swLat, swLng, neLat, neLng };
}

// ── Saving / resuming a job ─────────────────────────────────────────────────
// A job is just its list of events; replaying them rebuilds the grid exactly. Every event carries
// the id of the session (rider / phone / app launch) that recorded it, so two people working the
// same paddock don't get their GPS points mixed into one path.
//   painted fix:  [timeMs, lat, lng, accuracyM, widthM, session]
//   machine OFF:  [timeMs, "b", session]
export const isBreak = (e) => e[1] === "b";
export const eventSession = (e) => String(isBreak(e) ? e[2] : e[5] ?? "");

// Rebuilds the coverage from saved events. Returns the tracker to carry on recording with for
// `mySession` (a fresh one, positioned after everything already painted, if it has no events yet).
export function replayEvents(cov, events, mySession) {
  const bySession = new Map();
  for (const e of events || []) {
    const k = eventSession(e);
    if (!bySession.has(k)) bySession.set(k, []);
    bySession.get(k).push(e);
  }
  const trackers = new Map();
  [...bySession.entries()].sort((a, b) => a[1][0][0] - b[1][0][0]).forEach(([k, list]) => {
    const tr = createTracker(cov);
    for (const e of list) {
      if (isBreak(e)) tr.breakStroke();
      else tr.push({ t: e[0], lat: e[1], lng: e[2], acc: e[3] }, e[4]);
    }
    trackers.set(k, tr);
  });
  return trackers.get(String(mySession ?? "")) || createTracker(cov);
}
