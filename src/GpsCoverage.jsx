// GPS Run — full-screen "paint the paddock as you drive" for spraying / slug baiting from a bike.
// Pick a product + swath width, press Start; while ON the ground you cover is painted on the map
// (green once, orange where you went over it twice). Finish hands the totals back to the app so
// they can be saved as a normal Spray record. The maths lives in coverageMath.js.
//
// The job in progress is saved on the server as you go (and backed up on the phone when there's no
// signal), so someone else — or you, on another phone — can open the paddock and carry on.
import React, { useEffect, useRef, useState } from "react";
import {
  ringFromGeojson, createCoverage, createTracker, coverageTotals,
  renderCoverage, coverageBounds, replayEvents,
} from "./coverageMath.js";

const PENDING_KEY = (id) => `kw_gpsrun_${id}`;     // points not yet confirmed saved on the server
const WIDTHS_KEY = "kw_gps_widths";
const DEFAULT_WIDTH = 12;
const BATCH = 1500;                                  // points per upload (server accepts up to 2000)

// Local backup of points that haven't reached the server yet (e.g. no signal in the paddock)
const readPending = (id) => { try { const j = JSON.parse(localStorage.getItem(PENDING_KEY(id)) || "null"); return j && j.v === 2 && Array.isArray(j.pending) ? j : null; } catch { return null; } };
const writePending = (id, data) => { try { if (data.pending.length) localStorage.setItem(PENDING_KEY(id), JSON.stringify({ v: 2, ...data })); else localStorage.removeItem(PENDING_KEY(id)); } catch {} };
export const clearGpsJob = (id) => { try { localStorage.removeItem(PENDING_KEY(id)); } catch {} };
const readWidths = () => { try { return JSON.parse(localStorage.getItem(WIDTHS_KEY) || "{}") || {}; } catch { return {}; } };
const rememberWidth = (product, w) => { try { const m = readWidths(); const k = String(product || "").trim().toLowerCase(); if (k) m[k] = w; m._last = w; localStorage.setItem(WIDTHS_KEY, JSON.stringify(m)); } catch {} };
const widthFor = (product) => { const m = readWidths(); return m[String(product || "").trim().toLowerCase()] || m._last || DEFAULT_WIDTH; };

// Loads the Google Maps script once (shared with the main map, which uses the same script tag)
function loadGoogleMaps(apiKey) {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) return resolve(window.google.maps);
    const existing = document.getElementById("google-maps-js");
    let poll, timer;
    const done = (fn, v) => { clearInterval(poll); clearTimeout(timer); fn(v); };
    timer = setTimeout(() => done(reject, new Error("Map timed out")), 8000);
    if (existing) {
      poll = setInterval(() => { if (window.google?.maps) done(resolve, window.google.maps); }, 100);
      return;
    }
    if (!apiKey) return done(reject, new Error("No map key"));
    window.__gmapsCallbackGps = () => done(resolve, window.google.maps);
    const s = document.createElement("script");
    s.id = "google-maps-js";
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=geometry&callback=__gmapsCallbackGps`;
    s.async = true;
    s.onerror = () => done(reject, new Error("Map failed to load"));
    document.body.appendChild(s);
  });
}

// A fetch that never answers (bad signal) shouldn't leave the screen waiting forever
const withTimeout = (p, ms = 8000) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);
const fmtHa = (n) => (n >= 100 ? n.toFixed(0) : n.toFixed(2));
const accColour = (a) => (a == null ? "text-stone-400" : a <= 8 ? "text-green-400" : a <= 15 ? "text-amber-300" : "text-red-400");
const fmtWhen = (d) => { try { return new Date(d).toLocaleString([], { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }); } catch { return ""; } };

export default function GpsCoverage({ paddock, products = [], mapsKey, api, onClose, onFinish }) {
  const ring = React.useMemo(() => ringFromGeojson(paddock?.geojson), [paddock]);
  const SESSION = useRef(Math.random().toString(36).slice(2, 8)).current;   // tells riders / launches apart in the saved job
  const covRef = useRef(null);
  const trackerRef = useRef(null);
  const eventsRef = useRef([]);       // every point of the job: [0, sentRef) are on the server, the rest still to send
  const sentRef = useRef(0);
  const syncingRef = useRef(false);
  const widthRef = useRef(DEFAULT_WIDTH);
  const onRef = useRef(true);
  const phaseRef = useRef("setup");
  const productRef = useRef("");
  const followRef = useRef(true);
  const gpsRef = useRef(null);
  const renderedVer = useRef(-1);

  const [phase, setPhase] = useState("setup");        // "setup" | "run"
  const [loaded, setLoaded] = useState(false);        // finished checking the server for a job in progress
  const [product, setProduct] = useState("");
  const [widthM, setWidthM] = useState(DEFAULT_WIDTH);
  const [on, setOn] = useState(true);
  const [follow, setFollow] = useState(true);
  const [gps, setGps] = useState(null);               // { acc, speedKmh, lat, lng }
  const [gpsErr, setGpsErr] = useState("");
  const [totals, setTotals] = useState(null);
  const [gaps, setGaps] = useState(0);
  const [saved, setSaved] = useState(null);           // a job already in progress for this paddock
  const [syncState, setSyncState] = useState("");     // "" | "ok" | "offline"
  const [serverDown, setServerDown] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mapMode, setMapMode] = useState("loading");  // "loading" | "google" | "plain"
  const [wake, setWake] = useState("");               // "" | "on" | "off"
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [finishNote, setFinishNote] = useState("");

  const mapDivRef = useRef(null);
  const plainRef = useRef(null);
  const mapRef = useRef(null);       // { g, map, dot, swath, overlay }
  const covCanvasRef = useRef(null);
  const wakeRef = useRef(null);

  const syncTotals = () => {
    const cov = covRef.current; if (!cov) return;
    setTotals(coverageTotals(cov));
    setGaps(trackerRef.current?.gaps || 0);
  };

  // Rebuild the grid from a full list of points (job loaded from the server, or merged at Finish)
  const loadEvents = (events) => {
    const cov = createCoverage(ring);
    trackerRef.current = replayEvents(cov, events, SESSION);
    covRef.current = cov;
    eventsRef.current = events.slice();
    renderedVer.current = -1;
    syncTotals();
  };

  // ── Upload new points to the server (and keep a phone backup of whatever hasn't gone yet) ──
  const backup = () => writePending(paddock.id, { product: productRef.current, widthM: widthRef.current, pending: eventsRef.current.slice(sentRef.current) });
  const syncNow = async () => {
    if (!api || syncingRef.current) return false;
    syncingRef.current = true;
    try {
      while (sentRef.current < eventsRef.current.length) {
        const from = sentRef.current, batch = eventsRef.current.slice(from, from + BATCH);
        await api.appendGpsJob(paddock.id, { product: productRef.current, widthM: widthRef.current, events: batch });
        sentRef.current = from + batch.length;
      }
      setSyncState("ok");
      return true;
    } catch {
      setSyncState("offline");
      return false;
    } finally {
      syncingRef.current = false;
      backup();
    }
  };

  // ── Open: look for a job already in progress on the server ───────────────────
  useEffect(() => {
    if (!ring) return;
    let dead = false;
    (async () => {
      let local = readPending(paddock.id);
      let reachable = true, job = null;
      try {
        if (local?.pending.length && api) {              // points left over from a time we had no signal
          for (let i = 0; i < local.pending.length; i += BATCH) {
            await withTimeout(api.appendGpsJob(paddock.id, { product: local.product, widthM: local.widthM, events: local.pending.slice(i, i + BATCH) }), 15000);
          }
          writePending(paddock.id, { pending: [] }); local = null;
        }
        const r = api ? await withTimeout(api.getGpsJob(paddock.id)) : null;
        job = r && Array.isArray(r.events) && r.events.length ? r : null;
      } catch { reachable = false; }
      if (dead) return;
      const serverEvents = job?.events || [];
      const pending = local?.pending || [];            // only non-empty when the server couldn't be reached
      covCanvasRef.current = covCanvasRef.current || document.createElement("canvas");
      loadEvents([...serverEvents, ...pending]);
      sentRef.current = serverEvents.length;
      const w = job?.widthM || local?.widthM || widthFor("");
      setWidthM(w); widthRef.current = w;
      if (serverEvents.length || pending.length) {
        setSaved({
          product: job?.product || local?.product || "", widthM: w, pct: coverageTotals(covRef.current).pct,
          by: job?.updatedBy || job?.startedBy || "", at: job?.updatedAt || null,
        });
      }
      setServerDown(!reachable);
      setLoaded(true);
    })();
    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ring, paddock?.id]);

  useEffect(() => { widthRef.current = widthM; }, [widthM]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { productRef.current = product; }, [product]);
  useEffect(() => { followRef.current = follow; }, [follow]);

  // ── GPS ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) { setGpsErr("This device has no GPS"); return; }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsErr("");
        const f = { t: pos.timestamp || Date.now(), lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy };
        const tracker = trackerRef.current;
        if (phaseRef.current === "run" && onRef.current && tracker) {
          const r = tracker.push(f, widthRef.current);
          if (r.used) eventsRef.current.push([f.t, +f.lat.toFixed(6), +f.lng.toFixed(6), Math.round(f.acc || 0), widthRef.current, SESSION]);
        }
        const g = { lat: f.lat, lng: f.lng, acc: f.acc, speedKmh: (pos.coords.speed != null && pos.coords.speed >= 0 ? pos.coords.speed : (tracker?.speed || 0)) * 3.6 };
        gpsRef.current = g;
        setGps(g);
        const m = mapRef.current;
        if (m) {
          const ll = { lat: f.lat, lng: f.lng };
          m.dot.setPosition(ll); m.swath.setCenter(ll); m.swath.setRadius(widthRef.current / 2);
          if (followRef.current && phaseRef.current === "run") m.map.panTo(ll);
        }
      },
      (e) => setGpsErr(e.code === 1 ? "Location is blocked — allow it in Settings → Privacy → Location Services" : "Can't get a GPS fix yet…"),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Keep the screen awake while running ───────────────────────────────────
  useEffect(() => {
    if (phase !== "run") return;
    let cancelled = false;
    const ask = async () => {
      try {
        if (!navigator.wakeLock) { setWake("off"); return; }
        const l = await navigator.wakeLock.request("screen");
        if (cancelled) { l.release(); return; }
        wakeRef.current = l; setWake("on");
        l.addEventListener?.("release", () => { if (wakeRef.current === l) setWake("off"); });
      } catch { setWake("off"); }
    };
    ask();
    const vis = () => { if (document.visibilityState === "visible") ask(); };
    document.addEventListener("visibilitychange", vis);
    return () => { cancelled = true; document.removeEventListener("visibilitychange", vis); try { wakeRef.current?.release(); } catch {} wakeRef.current = null; };
  }, [phase]);

  // ── Autosave: upload to the server every 10 s; back up on the phone when leaving ──
  useEffect(() => {
    const tick = () => { if (phaseRef.current === "run" && eventsRef.current.length > sentRef.current) syncNow(); };
    const iv = setInterval(tick, 10000);
    const hide = () => { if (document.visibilityState === "hidden" && phaseRef.current === "run") { backup(); tick(); } };
    const leave = () => { if (phaseRef.current === "run") backup(); };
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("pagehide", leave);
    return () => {
      clearInterval(iv); document.removeEventListener("visibilitychange", hide); window.removeEventListener("pagehide", leave);
      if (phaseRef.current === "run") { backup(); syncNow(); }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Map (Google satellite; plain outline if it can't load) ────────────────
  useEffect(() => {
    if (!ring || !covRef.current || phase !== "run") return;
    let dead = false;
    loadGoogleMaps(mapsKey).then((g) => {
      if (dead || !mapDivRef.current) return;
      const cov = covRef.current;
      const b = coverageBounds(cov);
      const map = new g.Map(mapDivRef.current, {
        mapTypeId: "satellite", disableDefaultUI: true, zoomControl: true, gestureHandling: "greedy", tilt: 0, clickableIcons: false,
      });
      map.fitBounds({ south: b.swLat, west: b.swLng, north: b.neLat, east: b.neLng }, 30);
      new g.Polygon({ map, paths: ring.map(([lng, lat]) => ({ lat, lng })), strokeColor: "#facc15", strokeWeight: 2, fillOpacity: 0, clickable: false });
      // The coverage picture: one canvas pinned to the paddock's bounds
      class CovOverlay extends g.OverlayView {
        onAdd() { const c = covCanvasRef.current; c.style.position = "absolute"; c.style.pointerEvents = "none"; this.getPanes().overlayLayer.appendChild(c); }
        draw() {
          const pr = this.getProjection(); if (!pr) return;
          const sw = pr.fromLatLngToDivPixel(new g.LatLng(b.swLat, b.swLng)), ne = pr.fromLatLngToDivPixel(new g.LatLng(b.neLat, b.neLng));
          const c = covCanvasRef.current;
          c.style.left = sw.x + "px"; c.style.top = ne.y + "px"; c.style.width = (ne.x - sw.x) + "px"; c.style.height = (sw.y - ne.y) + "px";
        }
        onRemove() { covCanvasRef.current?.parentNode?.removeChild(covCanvasRef.current); }
      }
      const overlay = new CovOverlay(); overlay.setMap(map);
      const dot = new g.Marker({ map, clickable: false, zIndex: 999, icon: { path: g.SymbolPath.CIRCLE, scale: 8, fillColor: "#2563eb", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 3 } });
      const swath = new g.Circle({ map, radius: widthRef.current / 2, strokeColor: "#38bdf8", strokeWeight: 1, fillColor: "#38bdf8", fillOpacity: 0.12, clickable: false });
      map.addListener("dragstart", () => setFollow(false));
      const gp = gpsRef.current;
      if (gp) { dot.setPosition({ lat: gp.lat, lng: gp.lng }); swath.setCenter({ lat: gp.lat, lng: gp.lng }); }
      mapRef.current = { g, map, dot, swath, overlay };
      renderedVer.current = -1;
      setMapMode("google");
    }).catch(() => { if (!dead) setMapMode("plain"); });
    return () => { dead = true; if (mapRef.current) { try { mapRef.current.overlay.setMap(null); } catch {} mapRef.current = null; } };
  }, [ring, mapsKey, phase]);

  // Plain-background fallback: paddock outline + coverage + you
  const drawPlain = () => {
    const el = plainRef.current, cov = covRef.current; if (!el || !cov) return;
    const W = el.clientWidth, H = el.clientHeight; if (!W || !H) return;
    if (el.width !== W) el.width = W;
    if (el.height !== H) el.height = H;
    const ctx = el.getContext("2d");
    ctx.fillStyle = "#1c1917"; ctx.fillRect(0, 0, W, H);
    const pw = cov.maxX - cov.minX, ph = cov.maxY - cov.minY;
    const k = Math.min((W - 40) / pw, (H - 40) / ph);
    const ox = (W - pw * k) / 2, oy = (H - ph * k) / 2;
    const px = (x, y) => [ox + (x - cov.minX) * k, H - oy - (y - cov.minY) * k];
    ctx.drawImage(covCanvasRef.current, ox, oy, cov.nx * cov.cell * k, cov.ny * cov.cell * k);
    ctx.strokeStyle = "#facc15"; ctx.lineWidth = 2; ctx.beginPath();
    cov.poly.forEach(([x, y], i) => { const [a, b] = px(x, y); i ? ctx.lineTo(a, b) : ctx.moveTo(a, b); });
    ctx.closePath(); ctx.stroke();
    const gp = gpsRef.current;
    if (gp) { const [x, y] = cov.proj.toXY(gp.lat, gp.lng); const [a, b] = px(x, y); ctx.fillStyle = "#2563eb"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(a, b, 7, 0, 7); ctx.fill(); ctx.stroke(); }
  };

  // Refresh the picture + numbers about every 1.5 s
  useEffect(() => {
    const iv = setInterval(() => {
      const cov = covRef.current; if (!cov || !covCanvasRef.current) return;
      if (cov.version !== renderedVer.current) { renderCoverage(cov, covCanvasRef.current); renderedVer.current = cov.version; }
      syncTotals();
      if (mapRef.current) mapRef.current.swath.setRadius(widthRef.current / 2);
      else drawPlain();
    }, 1500);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {   // draw straight away when the picture first becomes available / after a resume
    const cov = covRef.current; if (!cov || !covCanvasRef.current) return;
    renderCoverage(cov, covCanvasRef.current); renderedVer.current = cov.version; drawPlain();
    mapRef.current?.overlay?.draw?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapMode, saved, phase, loaded]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const enterRun = () => {
    onRef.current = true; setOn(true); setFollow(true);
    phaseRef.current = "run"; setPhase("run");
    renderedVer.current = -1; syncTotals();
  };
  const start = async () => {                        // a brand-new job (replacing any saved one)
    const w = Number(widthM);
    if (!(w >= 0.5 && w <= 200)) return;
    setBusy(true);
    if (saved && api) { try { await api.deleteGpsJob(paddock.id); } catch {} }
    clearGpsJob(paddock.id);
    loadEvents([]); sentRef.current = 0; setSaved(null);
    widthRef.current = w; rememberWidth(product, w);
    setBusy(false); enterRun();
  };
  const resumeJob = () => {
    setProduct(saved.product); productRef.current = saved.product;
    setWidthM(saved.widthM); widthRef.current = saved.widthM;
    enterRun();
  };
  const discardJob = async () => {
    setBusy(true);
    if (api) { try { await api.deleteGpsJob(paddock.id); } catch {} }
    clearGpsJob(paddock.id);
    loadEvents([]); sentRef.current = 0; setSaved(null); setBusy(false);
  };
  const toggleOn = () => {
    const next = !onRef.current;
    onRef.current = next; setOn(next);
    if (!next) {
      trackerRef.current?.breakStroke();
      const ev = eventsRef.current;
      const last = ev[ev.length - 1];
      if (ev.length && !(last && last[1] === "b")) ev.push([Date.now(), "b", SESSION]);
      backup(); syncNow();
    }
  };
  const changeWidth = (d) => { const w = Math.max(0.5, Math.min(200, Math.round((Number(widthM) + d) * 10) / 10)); setWidthM(w); widthRef.current = w; rememberWidth(product, w); };
  const exitSaving = async () => {
    setBusy(true);
    backup();
    await Promise.race([syncNow(), new Promise((r) => setTimeout(r, 4000))]);
    setBusy(false); onClose();
  };
  // Finish: upload everything, then re-read the whole job from the server so the totals include anything
  // another rider added meanwhile, and only then ask for confirmation.
  const askFinish = async () => {
    setBusy(true); setFinishNote("");
    const synced = await syncNow();
    if (synced && api) {
      try {
        const r = await api.getGpsJob(paddock.id);
        if (r && Array.isArray(r.events) && r.events.length) { loadEvents(r.events); sentRef.current = r.events.length; }
      } catch { /* keep what we have */ }
    } else {
      setFinishNote("Not connected — this job is saved on this phone only, and these totals are just what this phone recorded.");
    }
    setBusy(false); setConfirmFinish(true);
  };
  const doFinish = () => {
    const t = coverageTotals(covRef.current);
    onFinish({ ...t, widthM: widthRef.current, product: productRef.current, gaps: trackerRef.current?.gaps || 0 });
  };

  // ── Screens ───────────────────────────────────────────────────────────────
  if (!ring) {
    return (
      <div className="fixed inset-0 z-[260] bg-stone-900 text-white flex flex-col items-center justify-center p-8 text-center">
        <div className="text-lg font-bold mb-2">{paddock?.name}</div>
        <div className="text-sm opacity-80 mb-6">This paddock has no boundary drawn yet. Draw its outline on the map first, then GPS Run can work out what's covered.</div>
        <button onClick={onClose} className="bg-white text-stone-900 rounded-2xl px-6 py-3 font-bold">Back</button>
      </div>
    );
  }

  const uniqueProducts = [...new Set(products.map((p) => String(p || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const t = totals || { coveredHa: 0, pct: 0, overlapHa: 0, overlapPct: 0, paddockHa: 0 };

  if (phase === "setup") {
    return (
      <div className="fixed inset-0 z-[260] bg-stone-50 flex flex-col">
        <div className="bg-stone-900 text-white px-4 py-3 flex items-center gap-3">
          <button onClick={onClose} className="text-2xl leading-none px-1" aria-label="Back">‹</button>
          <div className="flex-1 min-w-0">
            <div className="font-bold truncate">📍 GPS Run · {paddock.name}</div>
            <div className="text-xs opacity-70">{fmtHa(t.paddockHa)} ha</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-lg w-full mx-auto">
          {!loaded && <div className="text-sm text-slate-500">Checking for a job already in progress…</div>}
          {loaded && serverDown && (
            <div className="text-xs bg-amber-50 border border-amber-300 text-amber-900 rounded-xl px-3 py-2">
              Couldn't reach the server, so any job saved by someone else isn't shown. You can still start — it will be saved when you're back in signal.
            </div>
          )}
          {saved && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4">
              <div className="font-bold text-amber-900 mb-1">Job in progress</div>
              <div className="text-sm text-amber-900 mb-3">
                {saved.product || "No product"} · {saved.widthM} m swath · {Math.round(saved.pct)}% of the paddock done
                {saved.by ? ` · last saved by ${saved.by}` : ""}{saved.at ? ` · ${fmtWhen(saved.at)}` : ""}
              </div>
              <div className="flex gap-2">
                <button onClick={resumeJob} disabled={busy} className="flex-1 bg-amber-500 disabled:opacity-50 text-white rounded-xl py-2.5 font-bold">Pick up where it was left</button>
                <button disabled={busy} onClick={() => { if (window.confirm("Throw away the coverage recorded so far? This also removes it for everyone else.")) discardJob(); }} className="px-4 border border-amber-400 text-amber-900 rounded-xl font-semibold">Discard</button>
              </div>
            </div>
          )}
          <div>
            <label className="text-sm font-semibold text-slate-600 block mb-1">Product (spray / bait)</label>
            <input list="gps-products" value={product}
              onChange={(e) => { setProduct(e.target.value); const w = widthFor(e.target.value); setWidthM(w); }}
              placeholder="e.g. Slug bait, RoundUp"
              className="w-full border border-slate-200 rounded-xl px-3 py-3 bg-white text-base" />
            <datalist id="gps-products">{uniqueProducts.map((p) => <option key={p} value={p} />)}</datalist>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-600 block mb-1">Swath width (metres)</label>
            <div className="flex items-center gap-2">
              <button onClick={() => changeWidth(-1)} className="w-14 h-14 rounded-xl bg-white border border-slate-200 text-2xl font-bold">−</button>
              <input type="number" inputMode="decimal" value={widthM}
                onChange={(e) => setWidthM(e.target.value)}
                className="flex-1 min-w-0 w-full text-center border border-slate-200 rounded-xl px-3 py-3 bg-white text-2xl font-bold" />
              <button onClick={() => changeWidth(1)} className="w-14 h-14 rounded-xl bg-white border border-slate-200 text-2xl font-bold">+</button>
            </div>
            <div className="text-xs text-slate-500 mt-1">Width of the strip the spreader / sprayer covers. Remembered for each product.</div>
          </div>
          <div className="text-sm rounded-xl bg-white border border-slate-200 px-3 py-2.5 flex items-center justify-between">
            <span className="text-slate-600">GPS signal</span>
            {gpsErr ? <span className="text-red-600 font-semibold text-right">{gpsErr}</span>
              : gps ? <span className={`font-bold ${gps.acc <= 8 ? "text-green-600" : gps.acc <= 15 ? "text-amber-600" : "text-red-600"}`}>±{Math.round(gps.acc)} m</span>
              : <span className="text-slate-400">Waiting for GPS…</span>}
          </div>
          <div className="text-xs text-slate-500 leading-relaxed">
            Mount the phone centred on the bike, keep this screen open and the phone awake while you work (iPhones stop GPS when the screen turns off).
            Only the ground inside the paddock outline is counted. The job saves as you go, so anyone can open this paddock later and carry on.
          </div>
        </div>
        <div className="p-4 border-t border-stone-200 bg-white">
          <button onClick={start} disabled={!loaded || busy || !(Number(widthM) >= 0.5)}
            className="w-full bg-green-600 disabled:bg-slate-300 text-white rounded-2xl py-4 text-lg font-bold">
            {saved ? "Start a new job (replaces the saved one)" : "Start"}
          </button>
        </div>
      </div>
    );
  }

  // Running
  return (
    <div className="fixed inset-0 z-[260] bg-black flex flex-col">
      <div className="bg-stone-900 text-white px-3 pt-2 pb-2">
        <div className="flex items-center gap-2 mb-1.5">
          <button onClick={exitSaving} disabled={busy} className="text-xs border border-white/30 rounded-lg px-2.5 py-1">{busy ? "Saving…" : "Save & exit"}</button>
          <div className="flex-1 min-w-0 text-center text-xs font-semibold truncate opacity-90">{paddock.name}{product ? ` · ${product}` : ""}</div>
          <div className="text-right leading-tight">
            <div className={`text-xs font-bold ${accColour(gps?.acc)}`}>{gps ? `GPS ±${Math.round(gps.acc)}m` : "No GPS"}</div>
            <div className={`text-[10px] ${syncState === "offline" ? "text-amber-300" : "text-stone-400"}`}>{syncState === "ok" ? "☁ saved" : syncState === "offline" ? "☁ not synced yet" : ""}</div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-1 text-center">
          <div><div className="text-xl font-bold leading-tight">{fmtHa(t.coveredHa)}</div><div className="text-[10px] opacity-60">ha done</div></div>
          <div><div className="text-xl font-bold leading-tight">{Math.round(t.pct)}%</div><div className="text-[10px] opacity-60">of {fmtHa(t.paddockHa)} ha</div></div>
          <div><div className="text-xl font-bold leading-tight text-orange-400">{fmtHa(t.overlapHa)}</div><div className="text-[10px] opacity-60">ha twice</div></div>
          <div><div className="text-xl font-bold leading-tight">{Math.round(gps?.speedKmh || 0)}</div><div className="text-[10px] opacity-60">km/h</div></div>
        </div>
      </div>
      {(wake === "off" || gpsErr || gaps > 0) && (
        <div className="bg-amber-500 text-black text-xs font-semibold px-3 py-1.5">
          {gpsErr ? gpsErr
            : wake === "off" ? "Keep this screen open — if the phone locks, GPS stops and nothing is recorded (iPhone Settings → Display → Auto-Lock → Never)."
            : `GPS dropped out ${gaps} time${gaps > 1 ? "s" : ""} — short breaks aren't painted.`}
        </div>
      )}
      <div className="flex-1 relative min-h-0 bg-stone-900">
        {mapMode !== "plain" && <div ref={mapDivRef} className="absolute inset-0" />}
        {mapMode === "plain" && <canvas ref={plainRef} className="absolute inset-0 w-full h-full" />}
        {mapMode === "loading" && <div className="absolute inset-0 flex items-center justify-center text-white/70 text-sm pointer-events-none">Loading map…</div>}
        {mapMode === "plain" && <div className="absolute top-2 left-2 text-[10px] bg-black/60 text-white rounded px-2 py-1">Map not available — showing outline only</div>}
        <button onClick={() => { setFollow(true); const m = mapRef.current; if (m && gpsRef.current) m.map.panTo({ lat: gpsRef.current.lat, lng: gpsRef.current.lng }); }}
          className={`absolute right-3 bottom-3 w-12 h-12 rounded-full shadow-lg text-xl ${follow ? "bg-blue-600 text-white" : "bg-white text-blue-600"}`} aria-label="Follow me">◎</button>
        <div className="absolute left-3 bottom-3 text-[10px] bg-black/60 text-white rounded px-2 py-1 leading-tight">
          <span className="inline-block w-2 h-2 rounded-sm align-middle mr-1" style={{ background: "#16a34a" }} />once&nbsp;
          <span className="inline-block w-2 h-2 rounded-sm align-middle mr-1" style={{ background: "#ea580c" }} />twice
        </div>
      </div>
      <div className="bg-stone-900 px-3 pt-3 pb-4 space-y-3">
        <div className="flex items-center gap-2">
          <button onClick={() => changeWidth(-1)} className="w-11 h-11 rounded-xl bg-stone-700 text-white text-xl font-bold">−</button>
          <div className="text-white text-center w-20"><div className="text-xl font-bold leading-tight">{widthM} m</div><div className="text-[10px] opacity-60">swath</div></div>
          <button onClick={() => changeWidth(1)} className="w-11 h-11 rounded-xl bg-stone-700 text-white text-xl font-bold">+</button>
          <button onClick={toggleOn}
            className={`flex-1 h-14 rounded-2xl text-lg font-extrabold ${on ? "bg-green-600 text-white" : "bg-stone-600 text-white"}`}>
            {on ? "● ON — painting" : "❚❚ OFF — tap to paint"}
          </button>
        </div>
        <button onClick={askFinish} disabled={busy} className="w-full bg-white disabled:opacity-60 text-stone-900 rounded-2xl py-3 font-bold">{busy ? "Saving…" : "Finish & log"}</button>
      </div>
      {confirmFinish && (
        <div className="absolute inset-0 bg-black/60 flex items-end sm:items-center justify-center z-10">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 w-full max-w-md">
            <div className="text-lg font-bold mb-1">Finish this job?</div>
            <div className="text-sm text-slate-600 mb-4">
              <b>{fmtHa(t.coveredHa)} ha</b> covered — {Math.round(t.pct)}% of {paddock.name} ({fmtHa(t.paddockHa)} ha).
              {t.overlapHa > 0 ? ` ${fmtHa(t.overlapHa)} ha (${Math.round(t.overlapPct)}%) was gone over twice.` : ""}
              <br />You can still change the details on the next screen. The job stays saved until the spray record is saved.
              {finishNote && <div className="mt-2 text-amber-700 font-semibold">{finishNote}</div>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmFinish(false)} className="flex-1 border border-slate-300 rounded-xl py-3 font-semibold">Keep going</button>
              <button onClick={doFinish} className="flex-1 bg-green-600 text-white rounded-xl py-3 font-bold">Finish &amp; log</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
