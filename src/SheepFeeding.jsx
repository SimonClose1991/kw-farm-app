import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  num, rationPct, adjustPercent, penDailyKg, penFeedKg, splitFor, activeOnly, totalHead,
  mixerLoad, loadBreakdown, mixTotalPerHead, eventKg, runTotals, formatKg,
} from "./sheepFeedMath.js";

// Sheep feedlot: Feed Run · Ration · Pens · History · Settings (Admin only).
// Rebuilt from the Kurra-Wirra Replit feed manager. Everything here is its own
// component (not inlined in App) so typing in a box only re-renders this screen.

const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
const fmtTime = (iso) => new Date(iso).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" });

const CARD = "bg-white rounded-2xl p-4 border border-slate-100 shadow-sm";
const INPUT = "w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white text-sm";
const LABEL = "text-xs text-slate-400 font-semibold block mb-1";
const BTN_DARK = "bg-stone-800 text-white rounded-2xl py-3 font-semibold text-sm";
const BTN_LIGHT = "bg-white border border-slate-200 text-slate-700 rounded-2xl py-3 font-semibold text-sm";

const DEFAULT_SETTINGS = { splitAm: 0.6, splitPm: 0.4, bufferPercent: 0, ingredients: [] };

const freshRun = (feeder, period, settings) => ({
  startedAt: new Date().toISOString(),
  feeder: feeder || "",
  period,
  splitFraction: splitFor(period, settings),
  events: [],
  penIndex: 0,
});

export default function SheepFeedingScreen({ setTab, showToast, api, isAdmin, canEdit, currentAccount }) {
  const [sheepTab, setSheepTab] = useState("run");
  const [pens, setPens] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [history, setHistory] = useState([]);
  // The in-progress run lives up here so it survives flicking between tabs
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const load = () => {
    setLoading(true);
    setLoadError("");
    Promise.all([api.getSheepPens(), api.getSheepSettings(), api.getSheepHistory(), api.getSheepCurrentRun()])
      .then(([p, s, h, r]) => {
        const st = { ...DEFAULT_SETTINGS, ...(s || {}) };
        setPens(p);
        setSettings(st);
        setHistory(h);
        const feeder = currentAccount?.name || "";
        setRun(r ? {
          startedAt: r.startedAt, feeder: r.feeder || feeder, period: r.period,
          splitFraction: num(r.splitFraction), events: Array.isArray(r.events) ? r.events : [], penIndex: num(r.penIndex),
        } : freshRun(feeder, "AM", st));
      })
      .catch((err) => setLoadError(err.message || "Couldn't load the feedlot data"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen text-slate-400">Loading Sheep Feeding…</div>;
  if (loadError || !run) return (
    <div className="p-6 text-center">
      <div className="text-slate-600 mb-3">{loadError || "Couldn't load the feedlot data"}</div>
      <button onClick={load} className={`${BTN_DARK} px-6`}>Try again</button>
      <button onClick={() => setTab("home")} className="block mx-auto mt-3 text-slate-400 text-sm">← Home</button>
    </div>
  );

  const tabs = [
    { id: "run", label: "🏃 Feed Run" },
    { id: "ration", label: "🧮 Ration" },
    { id: "pens", label: "🐑 Pens" },
    { id: "history", label: "📋 History" },
    ...(isAdmin ? [{ id: "settings", label: "⚙️ Settings" }] : []),
  ];
  const activeTab = sheepTab === "settings" && !isAdmin ? "run" : sheepTab;

  return (
    <div className="pb-24 bg-stone-50 min-h-screen">
      <div className="bg-white border-b border-stone-100 px-5 pt-5 pb-4">
        <button onClick={() => setTab("home")} className="text-slate-500 text-sm mb-3 flex items-center gap-1">← Home</button>
        <div className="text-2xl font-bold tracking-tight">🐑 Sheep Feeding</div>
        <div className="text-slate-400 text-sm mt-0.5">Feedlot runs, rations & pens</div>
      </div>
      <div className="flex gap-1 px-4 py-3 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setSheepTab(t.id)}
            className={`px-4 py-2 rounded-2xl text-sm font-semibold flex-shrink-0 border ${activeTab === t.id ? "bg-stone-800 text-white border-stone-800" : "bg-white text-stone-600 border-stone-200"}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="px-4 space-y-3">
        {activeTab === "run" && (
          <FeedRunTab pens={pens} setPens={setPens} settings={settings} run={run} setRun={setRun}
            setHistory={setHistory} showToast={showToast} api={api} />
        )}
        {activeTab === "ration" && <RationTab pens={pens} settings={settings} isAdmin={isAdmin} />}
        {activeTab === "pens" && (
          <PensTab pens={pens} setPens={setPens} settings={settings} canEdit={canEdit} showToast={showToast} api={api} />
        )}
        {activeTab === "history" && (
          <HistoryTab history={history} setHistory={setHistory} canEdit={canEdit} showToast={showToast} api={api} />
        )}
        {activeTab === "settings" && isAdmin && (
          <SettingsTab pens={pens} setPens={setPens} settings={settings} setSettings={setSettings}
            history={history} showToast={showToast} api={api} />
        )}
      </div>
    </div>
  );
}

// ── Feed Run ─────────────────────────────────────────────────────────────────
function FeedRunTab({ pens, setPens, settings, run, setRun, setHistory, showToast, api }) {
  const [override, setOverride] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [syncWarn, setSyncWarn] = useState(false);
  const saveChain = useRef(Promise.resolve()); // keeps progress saves in the order they were made

  const activePens = useMemo(() => activeOnly(pens), [pens]);
  const index = Math.min(run.penIndex, activePens.length);
  const pen = activePens[index] || null;

  useEffect(() => { setOverride(""); }, [pen?.id]);
  useEffect(() => { setNoteDraft(pen?.notes || ""); }, [pen?.id, pen?.notes]);

  // Progress is saved to the server after every action, so the run can be picked
  // up again after a reload or on another phone
  const persist = (next) => {
    setRun(next);
    saveChain.current = saveChain.current
      .then(() => api.saveSheepCurrentRun(next))
      .then(() => setSyncWarn(false))
      .catch(() => setSyncWarn(true));
  };

  const thisFeedKg = pen ? penFeedKg(pen, run.splitFraction) : 0;

  const saveNote = async () => {
    if (!pen) return;
    const text = noteDraft.trim();
    if (text === (pen.notes || "")) return;
    try {
      await api.adjustSheepPenRation(pen.id, { notes: text });
      setPens((prev) => prev.map((p) => (p.id === pen.id ? { ...p, notes: text || null } : p)));
    } catch (err) { showToast(err.message || "Couldn't save the note"); }
  };

  const handleFed = () => {
    if (!pen) return;
    const kg = override.trim() ? Number(override) : thisFeedKg;
    if (!Number.isFinite(kg) || kg <= 0) { showToast("Enter a valid kg amount"); return; }
    saveNote();
    const ev = {
      penId: pen.id, penName: pen.name, ration: pen.ration, headCount: num(pen.headCount),
      kgPerHead: num(pen.kgPerHead), rationPercent: rationPct(pen), totalKg: kg,
      at: new Date().toISOString(), ...(noteDraft.trim() ? { notes: noteDraft.trim() } : {}),
    };
    persist({
      ...run,
      startedAt: run.events.length === 0 ? ev.at : run.startedAt, // clock starts at the first pen fed
      events: [...run.events, ev],
      penIndex: index + 1,
    });
    setOverride("");
  };

  const handleSkip = () => persist({ ...run, penIndex: Math.min(index + 1, activePens.length) });

  const handleUndo = () => {
    if (run.events.length === 0) {
      if (run.penIndex > 0) persist({ ...run, penIndex: run.penIndex - 1 });
      return;
    }
    const last = run.events[run.events.length - 1];
    const at = activePens.findIndex((p) => p.id === last.penId);
    persist({ ...run, events: run.events.slice(0, -1), penIndex: at >= 0 ? at : Math.max(0, index - 1) });
  };

  // +5% / −5% changes the pen's saved ration and clears its note (the note was the
  // reminder to make this change)
  const adjust = async (delta) => {
    if (!pen) return;
    const next = adjustPercent(pen.rationPercent == null ? 100 : pen.rationPercent, delta);
    const before = pens;
    setPens(pens.map((p) => (p.id === pen.id ? { ...p, rationPercent: next, notes: null } : p)));
    setNoteDraft("");
    try {
      await api.adjustSheepPenRation(pen.id, { rationPercent: next, notes: null });
    } catch (err) {
      setPens(before);
      showToast(err.message || "Couldn't change the ration");
    }
  };

  const setPeriod = (p) => {
    const next = { ...run, period: p, splitFraction: splitFor(p, settings) };
    if (run.penIndex > 0) persist(next); else setRun(next);
  };

  const startAgain = (feeder, period) => setRun(freshRun(feeder, period, settings));

  // Goes through the same queue as progress saves, so a progress save still in
  // flight can't land after the clear and bring a finished run back to life
  const clearServerRun = () => {
    saveChain.current = saveChain.current.then(() => api.clearSheepCurrentRun()).catch(() => {});
    return saveChain.current;
  };

  const handleFinish = async () => {
    if (saving || run.events.length === 0) return;
    setSaving(true);
    try {
      const created = await api.addSheepHistory({
        startedAt: run.startedAt, finishedAt: new Date().toISOString(), feeder: run.feeder,
        period: run.period, splitFraction: run.splitFraction, events: run.events,
      });
      setHistory((prev) => [created, ...prev]);
      await clearServerRun();
      startAgain(run.feeder, run.period);
      showToast("Feed run saved to History ✓");
    } catch (err) {
      showToast(err.message || "Couldn't save the run — it's still here, try again");
    }
    setSaving(false);
  };

  const handleCancel = async () => {
    if (!window.confirm("Cancel this feed run? All progress will be lost.")) return;
    await clearServerRun();
    startAgain(run.feeder, run.period);
  };

  const feederInput = (
    <input value={run.feeder} onChange={(e) => setRun({ ...run, feeder: e.target.value })}
      onBlur={() => { if (run.events.length > 0 || run.penIndex > 0) persist(run); }}
      placeholder="Your name" className={INPUT} />
  );

  if (activePens.length === 0) {
    return <div className={`${CARD} text-center text-slate-400 text-sm py-8`}>No active pens. Add or switch on pens in the Pens tab.</div>;
  }

  // ── Run complete ──
  if (!pen) {
    const t = runTotals(run.events);
    return (
      <div className={CARD}>
        <div className="text-xl font-bold text-slate-800">Feed run complete</div>
        <div className="text-sm text-slate-400 mb-3">All active pens have been gone through.</div>
        <label className={LABEL}>Feeder</label>
        <div className="mb-3">{feederInput}</div>
        <div className="bg-slate-50 rounded-xl p-3 text-center mb-3">
          <div className="text-xs text-slate-400 font-semibold">This run ({run.period} · {Math.round(run.splitFraction * 100)}%)</div>
          <div className="text-3xl font-extrabold text-slate-800">{formatKg(t.totalKg)}</div>
          <div className="text-xs text-slate-400">{run.events.length} pen{run.events.length !== 1 ? "s" : ""} fed</div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {Object.entries(t.byRation).map(([r, kg]) => (
            <div key={r} className="bg-slate-50 rounded-xl px-3 py-2">
              <div className="text-xs text-slate-400">{r}</div>
              <div className="font-bold text-slate-700">{formatKg(kg)}</div>
            </div>
          ))}
        </div>
        {run.events.length === 0 && <div className="text-xs text-amber-600 mb-2">Nothing has been fed yet — tap Review to go back through the pens.</div>}
        <div className="space-y-2">
          <button onClick={handleFinish} disabled={saving || run.events.length === 0}
            className={`${BTN_DARK} w-full ${saving || run.events.length === 0 ? "opacity-50" : ""}`}>
            {saving ? "Saving…" : "Save to History & start a new run"}
          </button>
          <button onClick={() => persist({ ...run, penIndex: 0 })} className={`${BTN_LIGHT} w-full`}>Review</button>
          <button onClick={handleCancel} className="w-full text-rose-500 text-sm font-semibold py-2">Cancel feed</button>
        </div>
      </div>
    );
  }

  // ── Feeding a pen ──
  const upNext = activePens.slice(index + 1, index + 5);
  const pct = rationPct(pen);
  return (
    <>
      <div className={CARD}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-1">
            {["AM", "PM"].map((p) => (
              <button key={p} onClick={() => setPeriod(p)} disabled={run.events.length > 0}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border ${run.period === p ? "bg-stone-800 text-white border-stone-800" : "bg-white text-stone-600 border-stone-200"} ${run.events.length > 0 && run.period !== p ? "opacity-40" : ""}`}>
                {p}
              </button>
            ))}
          </div>
          <div className="text-xs text-slate-400 font-semibold">{index + 1} of {activePens.length} · {Math.round((index / activePens.length) * 100)}%</div>
        </div>
        <label className={LABEL}>Feeder</label>
        {feederInput}
        {run.events.length > 0 && (
          <div className="text-xs text-slate-400 mt-2">In progress since {fmtTime(run.startedAt)} · AM/PM is locked once feeding starts (Undo back to the start to change it)</div>
        )}
        {syncWarn && <div className="text-xs text-amber-600 mt-2">⚠ Couldn't save progress to the server — check your signal. Keep going; it will retry on the next tap.</div>}
      </div>

      <div className={`${CARD} text-center`}>
        <div className="text-2xl font-bold text-slate-800">{pen.name}</div>
        <div className="text-sm text-slate-400">{pen.ration} · {num(pen.headCount).toLocaleString()} head · {run.period} feed</div>
        <div className="text-xs text-slate-400 mt-4">Amount to feed</div>
        <div className="text-6xl font-black text-slate-800 leading-tight">{formatKg(thisFeedKg)}</div>
        <div className="text-xs text-slate-400 mt-1">
          {num(pen.headCount)} × {num(pen.kgPerHead).toFixed(2)} × {pct}% × {Math.round(run.splitFraction * 100)}%
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4 text-left">
          <div>
            <label className={LABEL}>Override kg</label>
            <input type="number" step="any" inputMode="decimal" value={override} onChange={(e) => setOverride(e.target.value)}
              placeholder={String(Math.round(thisFeedKg))} className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Pen note</label>
            <input value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} onBlur={saveNote}
              placeholder="e.g. UP" className={INPUT} />
          </div>
        </div>
        {pen.notes && (
          <div className="mt-2 text-xs text-amber-600 font-medium text-left">📝 Note: {pen.notes} — clears when you change the ration with +5% / −5%</div>
        )}

        <button onClick={handleFed} className="w-full mt-4 bg-green-600 text-white rounded-2xl py-4 text-2xl font-extrabold active:bg-green-700">✓ FED</button>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button onClick={() => adjust(5)} className="bg-sky-600 text-white rounded-2xl py-3 font-bold">▲ +5%</button>
          <button onClick={() => adjust(-5)} className="bg-sky-600 text-white rounded-2xl py-3 font-bold">▼ −5%</button>
          <button onClick={handleUndo} className={BTN_LIGHT}>← Undo</button>
          <button onClick={handleSkip} className={BTN_LIGHT}>Skip →</button>
        </div>
        <div className="flex items-center justify-between mt-3">
          <button onClick={handleCancel} className="text-rose-500 text-xs font-semibold">Cancel feed</button>
          <div className="text-xs text-slate-400 font-semibold">Ration now {pct}%</div>
        </div>
      </div>

      <div className={CARD}>
        <div className="text-xs font-bold text-slate-400 uppercase mb-2">Up next</div>
        {upNext.length === 0 && <div className="text-sm text-slate-400">Last pen — nothing left after this.</div>}
        <div className="space-y-2">
          {upNext.map((p, i) => (
            <div key={p.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2.5">
              <div className="min-w-0">
                <div className="font-semibold text-slate-700 text-sm truncate">#{index + i + 2} {p.name}</div>
                <div className="text-xs text-slate-400">{p.ration}</div>
              </div>
              <div className="font-bold text-slate-700">{formatKg(penFeedKg(p, run.splitFraction))}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Ration (mixer wagon) ─────────────────────────────────────────────────────
function RationTab({ pens, settings, isAdmin }) {
  const [period, setPeriod] = useState("AM");
  const [target, setTarget] = useState("");
  const ingredients = settings.ingredients || [];
  const split = splitFor(period, settings);
  const load = mixerLoad(pens, ingredients, split, settings.bufferPercent);
  const breakdown = loadBreakdown(target, ingredients);
  const active = activeOnly(pens);
  const noIngredients = ingredients.length === 0;

  return (
    <>
      <div className={CARD}>
        <div className="font-bold text-slate-800">Mixer wagon ration</div>
        <div className="text-xs text-slate-400 mb-3">How much of each ingredient to load for the active pens</div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[["AM", `AM (${Math.round(splitFor("AM", settings) * 100)}%)`], ["PM", `PM (${Math.round(splitFor("PM", settings) * 100)}%)`], ["ALL", "All day"]].map(([id, label]) => (
            <button key={id} onClick={() => setPeriod(id)}
              className={`py-2 rounded-xl text-xs font-semibold border ${period === id ? "bg-stone-800 text-white border-stone-800" : "bg-white text-stone-600 border-stone-200"}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 text-center mb-3">
          <div className="bg-slate-50 rounded-xl p-2"><div className="text-xs text-slate-400">Active pens</div><div className="text-xl font-extrabold text-slate-800">{active.length}</div></div>
          <div className="bg-slate-50 rounded-xl p-2"><div className="text-xs text-slate-400">Head</div><div className="text-xl font-extrabold text-slate-800">{totalHead(pens).toLocaleString()}</div></div>
          <div className="bg-slate-50 rounded-xl p-2"><div className="text-xs text-slate-400">Effective</div><div className="text-xl font-extrabold text-stone-800">{load.effectiveHead.toLocaleString("en-AU", { maximumFractionDigits: 1 })}</div></div>
        </div>
        <div className="text-xs text-slate-400 mb-3">Effective head counts each pen at its ration % (a pen on 110% counts as 1.1 per head).</div>

        {noIngredients ? (
          <div className="text-sm text-slate-400 py-2">No ingredients set up yet.{isAdmin ? " Add them in Settings." : " Ask an Admin to add them in Settings."}</div>
        ) : (
          <div className="space-y-2">
            {load.rows.map((r, i) => (
              <div key={i} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2.5">
                <div><div className="font-semibold text-slate-700">{r.name}</div><div className="text-xs text-slate-400">{r.kgPerHead} kg/head</div></div>
                <div className="text-xl font-extrabold text-slate-800">{formatKg(r.amount)}</div>
              </div>
            ))}
            <div className="flex items-center justify-between bg-stone-800 text-white rounded-xl px-4 py-3">
              <div className="font-semibold">Total mixer load</div>
              <div className="text-2xl font-extrabold">{formatKg(load.total)}</div>
            </div>
          </div>
        )}
        {!noIngredients && (
          <div className="text-xs text-slate-400 mt-3">
            {period === "ALL" ? "100%" : `${Math.round(split * 100)}%`} × {load.effectiveHead.toLocaleString("en-AU", { maximumFractionDigits: 1 })} effective head × ingredient kg/head
            {num(settings.bufferPercent) > 0 ? ` × ${(1 + num(settings.bufferPercent) / 100).toFixed(2)} buffer (+${num(settings.bufferPercent)}%)` : ""}
          </div>
        )}
      </div>

      <div className={CARD}>
        <div className="font-bold text-slate-800">Load calculator</div>
        <div className="text-xs text-slate-400 mb-3">Got a set load size? Enter it to see the split per ingredient.</div>
        <label className={LABEL}>Target total (kg)</label>
        <input type="number" inputMode="decimal" step="100" min="0" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. 6000" className={INPUT} />
        {num(target) > 0 && (noIngredients || mixTotalPerHead(ingredients) <= 0) && (
          <div className="text-sm text-slate-400 mt-3">{noIngredients ? "No ingredients set up yet." : "All ingredients are 0 kg/head — update the mix in Settings."}</div>
        )}
        {breakdown.length > 0 && (
          <div className="space-y-2 mt-3">
            {breakdown.map((r, i) => (
              <div key={i} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2.5">
                <div><div className="font-semibold text-slate-700">{r.name}</div><div className="text-xs text-slate-400">{r.kgPerHead} kg/head</div></div>
                <div className="text-xl font-extrabold text-slate-800">{formatKg(r.amount)}</div>
              </div>
            ))}
            <div className="text-xs text-slate-400">Each ingredient's share = its kg/head ÷ the total kg/head × your target.</div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Pens ─────────────────────────────────────────────────────────────────────
const penToDraft = (p) => ({
  name: p.name || "", ration: p.ration || "",
  headCount: String(num(p.headCount)), kgPerHead: String(num(p.kgPerHead)),
  rationPercent: String(rationPct(p)),
});

// Compared as numbers, so "1.50" typed vs 1.5 saved doesn't count as an unsaved edit
const sameDraft = (a, b) =>
  a.name === b.name && a.ration === b.ration &&
  num(a.headCount) === num(b.headCount) && num(a.kgPerHead) === num(b.kgPerHead) &&
  num(a.rationPercent, 100) === num(b.rationPercent, 100);

function PenCard({ pen, index, total, canEdit, onSave, onToggle, onMove, onDelete }) {
  const [draft, setDraft] = useState(() => penToDraft(pen));
  const [busy, setBusy] = useState(false);
  const pristine = sameDraft(draft, penToDraft(pen));
  // Pick up changes made elsewhere (e.g. +5% in a feed run) unless there are unsaved edits
  const saved = useRef(penToDraft(pen));
  useEffect(() => {
    const incoming = penToDraft(pen);
    if (sameDraft(draft, saved.current)) setDraft(incoming);
    saved.current = incoming;
  }, [pen.name, pen.ration, pen.headCount, pen.kgPerHead, pen.rationPercent]);

  const dailyKg = penDailyKg({ headCount: draft.headCount, kgPerHead: draft.kgPerHead, rationPercent: draft.rationPercent });
  const set = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }));

  const save = async () => {
    if (!draft.name.trim()) { onSave(null, "Pen name can't be blank"); return; }
    setBusy(true);
    await onSave(pen.id, {
      name: draft.name, ration: draft.ration, headCount: num(draft.headCount),
      kgPerHead: num(draft.kgPerHead), rationPercent: num(draft.rationPercent, 100),
    });
    setBusy(false);
  };

  if (!canEdit) {
    return (
      <div className={`${CARD} ${pen.active ? "" : "opacity-60"}`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="font-bold text-slate-800">{pen.name}</div>
            <div className="text-xs text-slate-400">{pen.ration} · {num(pen.headCount).toLocaleString()} head · {num(pen.kgPerHead)} kg/head · {rationPct(pen)}%</div>
            {pen.notes && <div className="text-xs text-amber-600 mt-1">📝 {pen.notes}</div>}
          </div>
          <div className="text-right">
            <div className="font-bold text-slate-700">{formatKg(penDailyKg(pen))}</div>
            <div className="text-xs text-slate-400">per day · {pen.active ? "Active" : "Inactive"}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${CARD} ${pen.active ? "" : "opacity-70"}`}>
      <div className="flex items-start justify-between mb-2 gap-2">
        <div className="flex flex-col">
          <button onClick={() => onMove(pen.id, -1)} disabled={index === 0} className="text-slate-400 disabled:opacity-20 leading-none px-1">▲</button>
          <button onClick={() => onMove(pen.id, 1)} disabled={index === total - 1} className="text-slate-400 disabled:opacity-20 leading-none px-1 mt-1">▼</button>
        </div>
        <div className="flex-1 min-w-0">
          <label className={LABEL}>Name</label>
          <input value={draft.name} onChange={set("name")} className={INPUT} />
        </div>
        <button onClick={() => onToggle(pen)}
          className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${pen.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
          {pen.active ? "Active" : "Inactive"}
        </button>
      </div>
      <div className="mb-2">
        <label className={LABEL}>Type</label>
        <input value={draft.ration} onChange={set("ration")} placeholder="Grower, Finisher…" className={INPUT} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div><label className={LABEL}>Head</label><input type="number" inputMode="numeric" value={draft.headCount} onChange={set("headCount")} className={`${INPUT} text-center font-bold`} /></div>
        <div><label className={LABEL}>kg/head/day</label><input type="number" inputMode="decimal" step="any" value={draft.kgPerHead} onChange={set("kgPerHead")} className={`${INPUT} text-center font-bold`} /></div>
        <div><label className={LABEL}>Ration %</label><input type="number" inputMode="numeric" value={draft.rationPercent} onChange={set("rationPercent")} className={`${INPUT} text-center font-bold`} /></div>
      </div>
      {pen.notes && <div className="text-xs text-amber-600 mt-2">📝 {pen.notes}</div>}
      <div className="flex items-center justify-between mt-3">
        <div className="text-xs text-slate-400">Daily total <span className="font-bold text-slate-700">{formatKg(dailyKg)}</span></div>
        <div className="flex gap-2">
          <button onClick={() => onDelete(pen)} className="text-rose-500 text-xs font-semibold px-2">Delete</button>
          {!pristine && <button onClick={save} disabled={busy} className={`${BTN_DARK} px-4 py-1.5 ${busy ? "opacity-50" : ""}`}>{busy ? "Saving…" : "Save"}</button>}
        </div>
      </div>
    </div>
  );
}

function PensTab({ pens, setPens, settings, canEdit, showToast, api }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", ration: "Grower", headCount: "", kgPerHead: "" });
  const defaultKg = Math.round(mixTotalPerHead(settings.ingredients) * 10000) / 10000;

  const onSave = async (id, fields) => {
    if (id === null) { showToast(fields); return; }
    try {
      const updated = await api.updateSheepPen(id, fields);
      setPens((prev) => prev.map((p) => (p.id === id ? updated : p)));
      showToast("Pen saved ✓");
    } catch (err) { showToast(err.message || "Couldn't save the pen"); }
  };

  const onToggle = async (pen) => {
    try {
      const updated = await api.updateSheepPen(pen.id, { active: !pen.active });
      setPens((prev) => prev.map((p) => (p.id === pen.id ? updated : p)));
    } catch (err) { showToast(err.message || "Couldn't change the pen"); }
  };

  const onMove = async (id, dir) => {
    const i = pens.findIndex((p) => p.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= pens.length) return;
    const before = pens;
    const next = [...pens];
    [next[i], next[j]] = [next[j], next[i]];
    setPens(next);
    try { await api.reorderSheepPens(next.map((p) => p.id)); }
    catch (err) { setPens(before); showToast(err.message || "Couldn't reorder"); }
  };

  const onDelete = async (pen) => {
    if (!window.confirm(`Delete "${pen.name}"? Its past feed runs stay in History.`)) return;
    try {
      await api.deleteSheepPen(pen.id);
      setPens((prev) => prev.filter((p) => p.id !== pen.id));
      showToast("Pen deleted");
    } catch (err) { showToast(err.message || "Couldn't delete the pen"); }
  };

  const addPen = async () => {
    if (!form.name.trim()) { showToast("Give the pen a name"); return; }
    try {
      const created = await api.createSheepPen({
        name: form.name, ration: form.ration || "Grower", headCount: num(form.headCount),
        kgPerHead: form.kgPerHead === "" ? defaultKg : num(form.kgPerHead), rationPercent: 100, active: true,
      });
      setPens((prev) => [...prev, created]);
      setForm({ name: "", ration: "Grower", headCount: "", kgPerHead: "" });
      setAdding(false);
      showToast("Pen added ✓");
    } catch (err) { showToast(err.message || "Couldn't add the pen"); }
  };

  const dailyTotal = activeOnly(pens).reduce((s, p) => s + penDailyKg(p), 0);

  return (
    <>
      <div className={`${CARD} grid grid-cols-2 gap-3 text-center`}>
        <div><div className="text-xs text-slate-400 font-semibold">Active head</div><div className="text-2xl font-extrabold text-slate-800">{totalHead(pens).toLocaleString()}</div></div>
        <div><div className="text-xs text-slate-400 font-semibold">Daily total</div><div className="text-2xl font-extrabold text-slate-800">{formatKg(dailyTotal)}</div></div>
      </div>
      {!canEdit && <div className="text-xs text-slate-400 px-1">Only Admins and Managers can edit pens.</div>}
      {pens.length === 0 && <div className="text-center text-slate-400 py-6 text-sm">No pens yet.</div>}
      {pens.map((pen, i) => (
        <PenCard key={pen.id} pen={pen} index={i} total={pens.length} canEdit={canEdit}
          onSave={onSave} onToggle={onToggle} onMove={onMove} onDelete={onDelete} />
      ))}
      {canEdit && (adding ? (
        <div className={`${CARD} space-y-2`}>
          <div><label className={LABEL}>Pen name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={INPUT} /></div>
          <div><label className={LABEL}>Type</label><input value={form.ration} onChange={(e) => setForm({ ...form, ration: e.target.value })} className={INPUT} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={LABEL}>Head count</label><input type="number" inputMode="numeric" value={form.headCount} onChange={(e) => setForm({ ...form, headCount: e.target.value })} className={INPUT} /></div>
            <div><label className={LABEL}>kg/head/day</label><input type="number" inputMode="decimal" step="any" value={form.kgPerHead} onChange={(e) => setForm({ ...form, kgPerHead: e.target.value })} placeholder={defaultKg ? String(defaultKg) : "0"} className={INPUT} /></div>
          </div>
          {defaultKg > 0 && <div className="text-xs text-slate-400">Left blank, kg/head/day uses the total of your mix ingredients ({defaultKg}).</div>}
          <button onClick={addPen} className={`${BTN_DARK} w-full`}>Add pen</button>
          <button onClick={() => setAdding(false)} className="w-full text-slate-400 text-sm">Cancel</button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="w-full border-2 border-dashed border-slate-300 rounded-2xl py-3 text-slate-400 font-semibold text-sm">+ Add pen</button>
      ))}
    </>
  );
}

// ── History ──────────────────────────────────────────────────────────────────
function HistoryTab({ history, setHistory, canEdit, showToast, api }) {
  const [expanded, setExpanded] = useState(() => new Set());
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState("");
  const [visible, setVisible] = useState(30);

  const filtered = useMemo(() => history.filter((r) => {
    const t = new Date(r.startedAt).getTime();
    if (from && t < new Date(`${from}T00:00:00`).getTime()) return false;
    if (to && t > new Date(`${to}T23:59:59`).getTime()) return false; // include the whole end day
    if (type && !(r.events || []).some((e) => (e.ration || "").toLowerCase().includes(type.toLowerCase()))) return false;
    return true;
  }), [history, from, to, type]);

  const grandTotal = filtered.reduce((s, r) => s + runTotals(r.events).totalKg, 0);

  const toggle = (id) => setExpanded((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const del = async (r) => {
    if (!window.confirm("Delete this feed run from History?")) return;
    try {
      await api.deleteSheepHistory(r.id);
      setHistory((prev) => prev.filter((x) => x.id !== r.id));
      showToast("Run deleted");
    } catch (err) { showToast(err.message || "Couldn't delete the run"); }
  };

  return (
    <>
      <div className={CARD}>
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold text-slate-800">Feed run history</div>
          <div className="text-xs text-slate-400">{filtered.length} run{filtered.length !== 1 ? "s" : ""} ·<span className="font-bold text-slate-600">{formatKg(grandTotal)}</span></div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div><label className={LABEL}>From</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={INPUT} /></div>
          <div><label className={LABEL}>To</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={INPUT} /></div>
        </div>
        <label className={LABEL}>Ration type</label>
        <input value={type} onChange={(e) => setType(e.target.value)} placeholder="e.g. Grower" className={INPUT} />
      </div>
      {filtered.length === 0 && <div className="text-center text-slate-400 py-6 text-sm">{history.length === 0 ? "No feed runs recorded yet." : "No runs match those filters."}</div>}
      {filtered.slice(0, visible).map((r) => {
        const t = runTotals(r.events);
        const open = expanded.has(r.id);
        return (
          <div key={r.id} className={CARD}>
            <div className="flex items-start gap-2">
              <button onClick={() => toggle(r.id)} className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.period === "AM" ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"}`}>{r.period}</span>
                  <span className="font-bold text-slate-700">{fmtDate(r.startedAt)}</span>
                  <span className="text-xs text-slate-400">{fmtTime(r.startedAt)}</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">{r.feeder || "—"} · {(r.events || []).length} pens · {Math.round(num(r.splitFraction) * 100)}% split</div>
              </button>
              <div className="text-right flex-shrink-0">
                <div className="text-xl font-extrabold text-slate-800">{formatKg(t.totalKg)}</div>
                <button onClick={() => toggle(r.id)} className="text-xs text-slate-400">{open ? "Hide ▲" : "Details ▼"}</button>
              </div>
            </div>
            {open && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                {Object.keys(t.byRation).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {Object.entries(t.byRation).map(([k, kg]) => (
                      <span key={k} className="text-xs bg-slate-100 text-slate-600 rounded-full px-2.5 py-1">{k}: {formatKg(kg)}</span>
                    ))}
                  </div>
                )}
                <div className="space-y-1.5">
                  {(r.events || []).map((e, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl px-3 py-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">{e.penName}</span>
                        <span className="font-bold text-slate-700">{formatKg(eventKg(e))}</span>
                      </div>
                      <div className="text-xs text-slate-400">{[e.ration, e.at ? fmtTime(e.at) : null].filter(Boolean).join(" · ")}</div>
                      {e.notes && <div className="text-xs text-slate-500 italic mt-0.5">Note: {e.notes}</div>}
                    </div>
                  ))}
                </div>
                {canEdit && <button onClick={() => del(r)} className="mt-3 text-rose-500 text-xs font-semibold">Delete this run</button>}
              </div>
            )}
          </div>
        );
      })}
      {filtered.length > visible && (
        <button onClick={() => setVisible((v) => v + 30)} className={`${BTN_LIGHT} w-full`}>Show more ({filtered.length - visible} older)</button>
      )}
    </>
  );
}

// ── Settings (Admin only) ────────────────────────────────────────────────────
function SettingsTab({ pens, setPens, settings, setSettings, history, showToast, api }) {
  const [rows, setRows] = useState(() => (settings.ingredients || []).map((i) => ({ name: i.name, kg: num(i.kgPerHead) === 0 ? "" : String(i.kgPerHead) })));
  const [amPct, setAmPct] = useState(String(Math.round(num(settings.splitAm, 0.6) * 100)));
  const [buffer, setBuffer] = useState(String(num(settings.bufferPercent)));
  const [busy, setBusy] = useState(false);

  const draftTotal = rows.reduce((s, r) => s + num(r.kg), 0);
  const am = Math.max(0, Math.min(100, num(amPct)));

  const save = async (fields, okMsg) => {
    setBusy(true);
    try {
      const updated = await api.saveSheepSettings(fields);
      setSettings((prev) => ({ ...prev, ...updated }));
      showToast(okMsg);
      return true;
    } catch (err) { showToast(err.message || "Couldn't save"); return false; }
    finally { setBusy(false); }
  };

  const saveMix = () => {
    const ingredients = rows.map((r) => ({ name: r.name.trim(), kgPerHead: num(r.kg) }));
    if (ingredients.some((i) => !i.name)) { showToast("Every ingredient needs a name"); return; }
    save({ ingredients }, `Mix saved — ${draftTotal.toFixed(4)} kg/head/day`);
  };

  // Separate from Save Mix on purpose: saving the mix must never silently overwrite
  // amounts you've set differently on individual pens
  const applyToAllPens = async () => {
    const total = Math.round(mixTotalPerHead(settings.ingredients) * 10000) / 10000;
    if (!pens.length) { showToast("No pens to update"); return; }
    if (!window.confirm(`Set kg/head/day to ${total} on all ${pens.length} pens? Any pen you've set to a different amount will be overwritten.`)) return;
    setBusy(true);
    let done = 0;
    try {
      for (const p of pens) {
        const updated = await api.updateSheepPen(p.id, { kgPerHead: total });
        setPens((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
        done++;
      }
      showToast(`All ${done} pens set to ${total} kg/head/day ✓`);
    } catch (err) { showToast(`${err.message || "Stopped"} — ${done} of ${pens.length} pens updated`); }
    setBusy(false);
  };

  const exportCsv = () => {
    const esc = (v) => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const out = ["PENS", ["Pen Name", "Head Count", "Ration Type", "kg/Head/Day", "Ration %", "Active", "Notes"].map(esc).join(",")];
    pens.forEach((p) => out.push([p.name, p.headCount, p.ration, p.kgPerHead, rationPct(p), p.active ? "Yes" : "No", p.notes || ""].map(esc).join(",")));
    out.push("", "FEED HISTORY", ["Run Date", "Period", "Feeder", "Pen Name", "Ration Type", "kg Fed", "Split %"].map(esc).join(","));
    history.forEach((r) => (r.events || []).forEach((e) => out.push([
      new Date(r.startedAt).toLocaleDateString("en-AU"), r.period, r.feeder || "", e.penName, e.ration || "", eventKg(e), Math.round(num(r.splitFraction) * 100),
    ].map(esc).join(","))));
    const blob = new Blob([out.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kurra-wirra-sheep-feeding-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="text-xs text-slate-400 px-1">Settings are Admin-only.</div>

      <div className={CARD}>
        <div className="font-bold text-slate-800 mb-1">Mix ingredients</div>
        <div className="text-xs text-slate-400 mb-3">kg per head per day. Used by the Ration tab and as the default for new pens.</div>
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-[1fr_90px_32px] gap-2 items-center">
              <input value={r.name} onChange={(e) => setRows((p) => p.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder="e.g. Silage" className={INPUT} />
              <input type="text" inputMode="decimal" value={r.kg} onChange={(e) => setRows((p) => p.map((x, j) => (j === i ? { ...x, kg: e.target.value } : x)))} placeholder="0" className={`${INPUT} text-center`} />
              <button onClick={() => setRows((p) => p.filter((_, j) => j !== i))} className="text-rose-500 text-lg">✕</button>
            </div>
          ))}
          {rows.length === 0 && <div className="text-sm text-slate-400">No ingredients yet.</div>}
        </div>
        <div className="flex items-center justify-between mt-3">
          <button onClick={() => setRows((p) => [...p, { name: "", kg: "" }])} className="text-sm font-semibold text-slate-600">+ Add ingredient</button>
          <div className="text-xs text-slate-400">Total <span className="font-bold text-slate-700">{draftTotal.toFixed(4)}</span> kg/head/day</div>
        </div>
        <button onClick={saveMix} disabled={busy} className={`${BTN_DARK} w-full mt-3 ${busy ? "opacity-50" : ""}`}>Save mix</button>
        <button onClick={applyToAllPens} disabled={busy || (settings.ingredients || []).length === 0} className={`${BTN_LIGHT} w-full mt-2 ${busy || (settings.ingredients || []).length === 0 ? "opacity-50" : ""}`}>
          Apply saved total ({Math.round(mixTotalPerHead(settings.ingredients) * 10000) / 10000}) to all pens
        </button>
        <div className="text-xs text-slate-400 mt-2">Saving the mix doesn't touch your pens. "Apply to all pens" overwrites every pen's kg/head/day.</div>
      </div>

      <div className={CARD}>
        <div className="font-bold text-slate-800 mb-1">AM / PM split</div>
        <div className="text-xs text-slate-400 mb-3">How the day's feed is divided between the two runs.</div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className={LABEL}>AM (%)</label><input type="number" inputMode="numeric" min="0" max="100" value={amPct} onChange={(e) => setAmPct(e.target.value)} className={`${INPUT} text-center font-bold`} /></div>
          <div><label className={LABEL}>PM (%)</label><div className={`${INPUT} text-center font-bold bg-slate-50 text-slate-500`}>{100 - am}</div></div>
        </div>
        <button onClick={() => save({ splitAm: am / 100, splitPm: (100 - am) / 100 }, "Split saved ✓")} disabled={busy} className={`${BTN_DARK} w-full mt-3 ${busy ? "opacity-50" : ""}`}>Save split</button>
      </div>

      <div className={CARD}>
        <div className="font-bold text-slate-800 mb-1">Ration buffer</div>
        <div className="text-xs text-slate-400 mb-3">Extra % added to every ingredient in the mixer load, to cover boosts during runs. 10–15% is typical.</div>
        <label className={LABEL}>Buffer (%)</label>
        <input type="number" inputMode="decimal" min="0" max="100" value={buffer} onChange={(e) => setBuffer(e.target.value)} className={`${INPUT} text-center font-bold`} />
        <button onClick={() => save({ bufferPercent: num(buffer) }, "Buffer saved ✓")} disabled={busy} className={`${BTN_DARK} w-full mt-3 ${busy ? "opacity-50" : ""}`}>Save buffer</button>
      </div>

      <div className={CARD}>
        <div className="font-bold text-slate-800 mb-1">Export</div>
        <div className="text-xs text-slate-400 mb-3">A spreadsheet (CSV) of every pen and every feed run — handy as a backup.</div>
        <button onClick={exportCsv} className={`${BTN_LIGHT} w-full`}>⬇ Export pens & history</button>
      </div>
    </>
  );
}
