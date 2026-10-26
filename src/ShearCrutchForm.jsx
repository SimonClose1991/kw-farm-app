import React, { useState, useMemo } from "react";
import { SHEAR_TYPES, buildShearingEntries, woolWarnings } from "./shearing.js";
import { localToday } from "./withholding.js";
import CheckRow from "./CheckRow.jsx";

// Shearing / crutching form for the mob action sheet. Records the same event for the
// open mob and, optionally, other sheep mobs picked from a dropdown — each with its own
// head count, bales, wool weight and cost. Own component so typing here doesn't
// re-render the whole app.

const INPUT = "w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white text-sm";
const SMALL = "w-full border border-slate-200 rounded-lg px-2 py-2 bg-white text-sm";
const LABEL = "text-[11px] font-semibold text-slate-500 block mb-0.5";
const niceDate = (iso) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

const blankRow = (m) => ({ mobId: m.id, head: String(m.count ?? ""), bales: "", woolKg: "", cost: "" });

function MobRow({ mob, row, type, onChange, onRemove }) {
  const set = (k) => (e) => onChange({ ...row, [k]: e.target.value });
  const verb = type === "Shearing" ? "shorn" : "crutched";
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="min-w-0">
          <div className="font-semibold text-slate-800 text-sm truncate">{mob.name}</div>
          <div className="text-[11px] text-slate-400">{Number(mob.count).toLocaleString()} head in mob</div>
        </div>
        {onRemove && <button type="button" onClick={onRemove} className="text-rose-500 text-lg px-2 flex-shrink-0" aria-label={`Remove ${mob.name}`}>✕</button>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div><label className={LABEL}>Head {verb}</label><input type="number" inputMode="numeric" value={row.head} onChange={set("head")} className={SMALL} /></div>
        <div><label className={LABEL}>Bales</label><input type="number" inputMode="numeric" value={row.bales} onChange={set("bales")} placeholder="optional" className={SMALL} /></div>
        <div><label className={LABEL}>Wool weight (kg)</label><input type="number" inputMode="decimal" value={row.woolKg} onChange={set("woolKg")} placeholder="optional" className={SMALL} /></div>
        <div><label className={LABEL}>Cost ($)</label><input type="number" inputMode="decimal" value={row.cost} onChange={set("cost")} placeholder="optional" className={SMALL} /></div>
      </div>
    </div>
  );
}

export default function ShearCrutchForm({ mob, sheepMobs, userName, onSave }) {
  const [type, setType] = useState("Shearing");
  const [date, setDate] = useState(localToday());
  const [contractor, setContractor] = useState("");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState([blankRow(mob)]);
  const [override, setOverride] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const allById = useMemo(() => new Map([mob, ...sheepMobs].map((m) => [m.id, m])), [mob, sheepMobs]);
  const chosen = rows.map((r) => allById.get(r.mobId)).filter(Boolean);
  const addable = sheepMobs.filter((m) => m.id !== mob.id && !rows.some((r) => r.mobId === m.id));
  const warnings = woolWarnings(type, date, chosen);
  const totalHead = rows.reduce((s, r) => s + (Number(r.head) || 0), 0);

  const updateRow = (i, next) => { setRows((rs) => rs.map((r, j) => (j === i ? next : r))); setError(""); };

  const save = async () => {
    if (busy) return;
    setError("");
    let entries;
    try {
      entries = buildShearingEntries({ type, date, contractor, notes, rows, mobs: chosen, override: override && warnings.length > 0, recordedBy: userName });
    } catch (err) { setError(err.message); return; }
    setBusy(true);
    try { await onSave({ type, date, entries }); }
    catch (err) { setError(err.message || "Couldn't save"); }
    setBusy(false);
  };

  return (
    <div className="space-y-3 mb-2" data-testid="shear-form">
      <div className="grid grid-cols-2 gap-2">
        {SHEAR_TYPES.map((t) => (
          <button key={t} type="button" onClick={() => { setType(t); setOverride(false); setError(""); }}
            className={`py-2.5 rounded-xl text-sm font-bold border ${type === t ? "bg-red-900 text-white border-red-900" : "bg-white text-slate-500 border-slate-200"}`}>
            {t === "Shearing" ? "✂️ Shearing" : "✂️ Crutching"}
          </button>
        ))}
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-600 block mb-1">Date</label>
        <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setError(""); }} className={INPUT} />
      </div>

      <MobRow mob={mob} row={rows[0]} type={type} onChange={(r) => updateRow(0, r)} />
      {rows.slice(1).map((r, i) => (
        <MobRow key={r.mobId} mob={allById.get(r.mobId)} row={r} type={type}
          onChange={(next) => updateRow(i + 1, next)}
          onRemove={() => { setRows((rs) => rs.filter((x) => x.mobId !== r.mobId)); setError(""); }} />
      ))}

      {addable.length > 0 && (
        <div>
          <label className="text-sm font-semibold text-slate-600 block mb-1">Also apply to other mobs</label>
          <select value="" onChange={(e) => { const m = allById.get(Number(e.target.value)); if (m) { setRows((rs) => [...rs, blankRow(m)]); setError(""); } }} className={INPUT}>
            <option value="">Add another mob…</option>
            {addable.map((m) => <option key={m.id} value={m.id}>{m.name} ({Number(m.count).toLocaleString()} hd)</option>)}
          </select>
        </div>
      )}

      <div>
        <label className="text-sm font-semibold text-slate-600 block mb-1">Contractor / shearer</label>
        <input value={contractor} onChange={(e) => setContractor(e.target.value)} placeholder="optional" className={INPUT} />
      </div>
      <div>
        <label className="text-sm font-semibold text-slate-600 block mb-1">Notes</label>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Pre-lamb shear" className={INPUT} />
      </div>

      {warnings.length > 0 && (
        <div className="rounded-xl border-2 border-rose-300 bg-rose-50 p-3" data-testid="wool-warning">
          <div className="text-sm font-bold text-rose-700 mb-1">⚠ Inside a wool withholding period</div>
          <ul className="text-xs text-rose-700 space-y-1 mb-2">
            {warnings.map((w) => (
              <li key={w.mob.id}><b>{w.mob.name}</b> — wool WHP runs until {niceDate(w.until)}{w.note ? ` (${w.note})` : ""}</li>
            ))}
          </ul>
          <CheckRow checked={override} onChange={setOverride} tone="rose">
            <span className="text-xs font-semibold text-rose-800">I understand — record the shearing anyway (this is noted in the mob's history)</span>
          </CheckRow>
        </div>
      )}

      {error && <div className="text-sm font-semibold text-rose-600 bg-rose-50 rounded-xl px-3 py-2">{error}</div>}

      <div className="text-xs text-slate-400 text-center">{rows.length} mob{rows.length === 1 ? "" : "s"} · {totalHead.toLocaleString()} head</div>
      <button type="button" onClick={save} disabled={busy || (warnings.length > 0 && !override)}
        className={`w-full rounded-2xl py-3.5 font-bold text-white bg-red-900 ${busy || (warnings.length > 0 && !override) ? "opacity-50" : ""}`}>
        {busy ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
