import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  UNATTR_ID, todayStr, daysBetween, avg, fmtEid, money,
  mobStats, animalEcon, groupByMob, parsePaste,
} from "./lambFeedlotMath.js";

// Lamb feedlot tracker — Admin only. Ported from the standalone "Kurra-Wirra Feedlot
// Tracker" HTML tool: Mobs · Induct · Sales · Profit · Settings. Data lives in the farm
// database (the server refuses anyone who isn't an Admin), not in a browser.

const CARD = "bg-white rounded-2xl p-4 border border-slate-100 shadow-sm";
const INPUT = "w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white text-sm";
const LABEL = "text-xs text-slate-400 font-semibold block mb-1";
const BTN_DARK = "bg-stone-800 text-white rounded-2xl py-3 font-semibold text-sm";
const BTN_LIGHT = "bg-white border border-slate-200 text-slate-700 rounded-2xl py-3 font-semibold text-sm";
const NOTE = "text-xs text-slate-500 leading-relaxed rounded-xl px-3 py-2.5 bg-stone-100";
const NOTE_WARN = "text-xs text-amber-800 leading-relaxed rounded-xl px-3 py-2.5 bg-amber-50";
const NOTE_BAD = "text-xs text-rose-800 leading-relaxed rounded-xl px-3 py-2.5 bg-rose-50";
const NOTE_GOOD = "text-xs text-green-800 leading-relaxed rounded-xl px-3 py-2.5 bg-green-50";

const isUnattr = (m) => m.id === UNATTR_ID;
const posNeg = (v) => (v == null ? "text-slate-300" : v >= 0 ? "text-green-700" : "text-rose-600");
const showMoney = (v, dec) => (v == null ? "—" : money(v, dec));
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

function download(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function LambFeedlotScreen({ setTab, showToast, api, isAdmin }) {
  const [data, setData] = useState(null); // { settings, mobs, animals }
  const [error, setError] = useState("");
  const [view, setView] = useState("mobs");
  const [detailId, setDetailId] = useState(null);

  const reload = async () => {
    try {
      const d = await api.getLambFeedlot();
      setData(d);
      setError("");
      return d;
    } catch (err) {
      setError(err.message || "Couldn't load the feedlot data");
      return null;
    }
  };
  useEffect(() => { if (isAdmin) reload(); }, []);

  const byMob = useMemo(() => (data ? groupByMob(data.animals) : new Map()), [data]);
  const stats = useMemo(() => {
    const out = new Map();
    if (!data) return out;
    const today = todayStr();
    for (const m of data.mobs) out.set(m.id, mobStats(m, data.settings, byMob.get(m.id) || [], today));
    return out;
  }, [data, byMob]);

  if (!isAdmin) return <div className="p-8 text-center text-slate-400 text-sm">The Lamb Feedlot is for Admin accounts only.</div>;
  if (!data) {
    return error ? (
      <div className="p-6 text-center">
        <div className="text-slate-600 mb-3">{error}</div>
        <button onClick={reload} className={`${BTN_DARK} px-6`}>Try again</button>
        <button onClick={() => setTab("home")} className="block mx-auto mt-3 text-slate-400 text-sm">← Home</button>
      </div>
    ) : <div className="flex items-center justify-center min-h-screen text-slate-400">Loading Lamb Feedlot…</div>;
  }

  const go = (v) => { setView(v); setDetailId(null); window.scrollTo(0, 0); };
  const openMob = (id) => { setView("mobs"); setDetailId(id); window.scrollTo(0, 0); };
  const tabs = [["mobs", "🐑 Mobs"], ["induct", "＋ Induct"], ["sales", "💲 Sales"], ["profit", "📊 Profit"], ["settings", "⚙️ Settings"]];
  const common = { data, byMob, stats, reload, showToast, api, go, openMob };
  const detailMob = detailId ? data.mobs.find((m) => m.id === detailId) : null;

  return (
    <div className="pb-24 bg-stone-50 min-h-screen">
      <div className="bg-white border-b border-stone-100 px-5 pt-5 pb-4">
        <button onClick={() => setTab("home")} className="text-slate-500 text-sm mb-3 flex items-center gap-1">← Home</button>
        <div className="text-2xl font-bold tracking-tight">🐑 Lamb Feedlot</div>
        <div className="text-slate-400 text-sm mt-0.5">Admin only · mobs, sales & profit</div>
      </div>
      <div className="flex gap-1 px-4 py-3 overflow-x-auto">
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => go(id)}
            className={`px-4 py-2 rounded-2xl text-sm font-semibold flex-shrink-0 border ${view === id ? "bg-stone-800 text-white border-stone-800" : "bg-white text-stone-600 border-stone-200"}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="px-4 space-y-3">
        {view === "mobs" && !detailMob && <MobsView {...common} />}
        {view === "mobs" && detailMob && <MobDetail {...common} mob={detailMob} />}
        {view === "induct" && <InductView {...common} />}
        {view === "sales" && <SalesView {...common} />}
        {view === "profit" && <ProfitView {...common} />}
        {view === "settings" && <SettingsView {...common} />}
      </div>
    </div>
  );
}

// ── Mobs list ────────────────────────────────────────────────────────────────
function StatBox({ n, label, tone }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 text-center">
      <div className={`text-xl font-extrabold leading-none ${tone || "text-slate-800"}`}>{n}</div>
      <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold mt-1.5 leading-tight">{label}</div>
    </div>
  );
}

function Metric({ value, label, tone }) {
  return (
    <div className="text-center">
      <div className={`text-base font-extrabold ${tone || "text-slate-800"}`}>{value}</div>
      <div className="text-[9.5px] uppercase tracking-wide text-slate-400 font-semibold mt-0.5 leading-tight" dangerouslySetInnerHTML={{ __html: label }} />
    </div>
  );
}

function MobsView({ data, stats, openMob, go }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const all = data.mobs.map((m) => ({ m, st: stats.get(m.id) }));
  const real = all.filter((x) => !isUnattr(x.m)); // Unattributed has no cost-in, so it stays out of every average
  const onFeed = all.reduce((a, x) => a + x.st.onFarm, 0);
  const openMobs = real.filter((x) => !x.st.closed && x.st.inducted > 0).length;
  const sold = real.filter((x) => x.st.nSold > 0);
  const totSold = sold.reduce((a, x) => a + x.st.nSold, 0);
  const avgHd = totSold ? sold.reduce((a, x) => a + x.st.totMargin, 0) / totSold : null;
  const openOn = real.filter((x) => x.st.onFarm > 0);
  const onFeedReal = openOn.reduce((a, x) => a + x.st.onFarm, 0);
  const avgDaysCur = onFeedReal ? Math.round(openOn.reduce((a, x) => a + x.st.currentDays * x.st.onFarm, 0) / onFeedReal) : null;

  let list = all.filter(({ m, st }) => {
    switch (filter) {
      case "open": return !st.closed;
      case "closed": return st.closed;
      case "home": return m.type === "home";
      case "bought": return m.type === "bought";
      case "profit": return !isUnattr(m) && st.profitHd != null && st.profitHd >= 0;
      case "loss": return !isUnattr(m) && st.profitHd != null && st.profitHd < 0;
      default: return true;
    }
  });
  const query = q.toLowerCase().trim();
  if (query) {
    const digits = query.replace(/\s/g, "");
    list = list.filter(({ m, st }) => {
      if (`${m.name} ${m.id} ${m.src}`.toLowerCase().includes(query)) return true;
      return /^\d{4,}$/.test(digits) && st.anims.some((a) => a.eid.includes(digits));
    });
  }
  list.sort((a, b) => (isUnattr(a.m) ? 1 : 0) - (isUnattr(b.m) ? 1 : 0)
    || (a.st.closed ? 1 : 0) - (b.st.closed ? 1 : 0)
    || (b.m.inDate > a.m.inDate ? 1 : -1));

  const chips = [["all", "All"], ["open", "Open"], ["closed", "Closed"], ["home", "Home-grown"], ["bought", "Bought"], ["profit", "In profit"], ["loss", "At a loss"]];

  return (
    <>
      <div className="grid grid-cols-4 gap-2">
        <StatBox n={onFeed.toLocaleString()} label="On feed" />
        <StatBox n={openMobs} label="Open mobs" tone="text-amber-600" />
        <StatBox n={avgDaysCur ?? "—"} label="Avg days on feed" />
        <StatBox n={avgHd == null ? "—" : money(avgHd, 2)} label="Realised $/hd" tone={avgHd == null ? "" : avgHd >= 0 ? "text-green-700" : "text-rose-600"} />
      </div>

      <div className="flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search mob, EID or source" className={INPUT} />
        <button onClick={() => setShowFilters((s) => !s)}
          className={`px-4 rounded-xl text-sm font-semibold border flex-shrink-0 ${showFilters ? "bg-stone-800 text-white border-stone-800" : "bg-white text-slate-700 border-slate-200"}`}>
          Filter
        </button>
      </div>
      {showFilters && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${filter === id ? "bg-amber-500 text-white border-amber-500" : "bg-white text-slate-500 border-slate-200"}`}>
              {label}
            </button>
          ))}
        </div>
      )}
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wide px-1">
        {filter === "all" && !query ? "Mobs" : `${plural(list.length, "mob", "mobs")} shown`}
      </div>

      {data.mobs.length === 0 && (
        <div className={`${CARD} text-center text-slate-500 text-sm leading-relaxed`}>
          No mobs yet.<br />Go to <b>Induct</b>, set up a mob and paste your EIDs straight from Excel — or bring in your old tool's data from <b>Settings → Import backup</b>.
        </div>
      )}
      {data.mobs.length > 0 && list.length === 0 && <div className="text-center text-slate-400 text-sm py-6">No mobs match. Clear the search or filter.</div>}

      {list.map(({ m, st }) => {
        const pct = st.inducted ? Math.round((st.nSold / st.inducted) * 100) : 0;
        const un = isUnattr(m);
        return (
          <button key={m.id} onClick={() => openMob(m.id)} className={`${CARD} w-full text-left`}>
            <div className="text-xs text-slate-400">{m.id} · in {m.inDate}</div>
            <div className="text-lg font-bold text-slate-800 leading-tight">{m.name}</div>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-xs text-slate-500">
              {un
                ? <span className="px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-500">Income only</span>
                : <span className={`px-2 py-0.5 rounded-full font-bold ${m.type === "home" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{m.type === "home" ? "Home-grown" : "Bought"}</span>}
              <span className={`px-2 py-0.5 rounded-full font-bold ${st.closed ? "bg-slate-100 text-slate-500" : "bg-amber-100 text-amber-700"}`}>{st.closed ? "Closed" : "Open"}</span>
              <span>{m.src}</span>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span><b className="text-slate-700">{st.nSold}</b> of {st.inducted} sold</span>
                <span><b className="text-slate-700">{pct}%</b> turned off</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-green-600 rounded-full" style={{ width: `${pct}%` }} /></div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-dashed border-slate-200">
              <Metric value={st.nSold ? Math.round(st.avgDays) : st.currentDays} label={st.nSold ? "Avg days<br>on feed (sold)" : "Days on feed<br>(current)"} />
              {un ? (
                <>
                  <Metric value={showMoney(st.avgRevenueHd, 2)} label="Income $/head<br>(no cost-in)" />
                  <Metric value="—" label="$/day<br>on feed" />
                </>
              ) : (
                <>
                  <Metric value={showMoney(st.profitHd, 2)} tone={posNeg(st.profitHd)} label="Realised<br>$/head" />
                  <Metric value={showMoney(st.profitDay, 2)} tone={posNeg(st.profitDay)} label="$/day<br>on feed" />
                </>
              )}
            </div>
          </button>
        );
      })}
    </>
  );
}

// ── Mob detail ───────────────────────────────────────────────────────────────
function MobDetail({ mob: m, data, stats, reload, showToast, api, go }) {
  const st = stats.get(m.id);
  const s = data.settings;
  const un = isUnattr(m);
  const [q, setQ] = useState("");
  const [visible, setVisible] = useState(100);
  const [form, setForm] = useState({ name: m.name, src: m.src, inDate: m.inDate, costRate: String(m.costRate), costBasis: m.costBasis });
  const [busy, setBusy] = useState(false);

  const costLbl = m.costBasis === "perkg" ? `$${m.costRate.toFixed(2)} /kg LW` : m.costBasis === "perhead" ? `$${m.costRate.toFixed(2)} /head` : "No cost-in";
  const digits = q.replace(/\s/g, "");
  const anims = st.anims
    .filter((a) => !digits || a.eid.includes(digits))
    .sort((a, b) => (a.sold ? 1 : 0) - (b.sold ? 1 : 0) || a.eid.localeCompare(b.eid));

  const save = async () => {
    setBusy(true);
    try {
      await api.updateLambMob(m.id, { name: form.name, src: form.src, inDate: form.inDate, costBasis: form.costBasis, costRate: Number(form.costRate) || 0 });
      await reload();
      showToast("Mob saved ✓");
    } catch (err) { showToast(err.message || "Couldn't save the mob"); }
    setBusy(false);
  };
  const remove = async () => {
    if (!window.confirm(`Delete "${m.name}" and all ${st.inducted} of its lambs? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await api.deleteLambMob(m.id);
      await reload();
      showToast("Mob deleted");
      go("mobs");
    } catch (err) { showToast(err.message || "Couldn't delete the mob"); setBusy(false); }
  };

  const ledger = [
    ["Cost-in basis", costLbl],
    ["Avg induction wt", st.avgInWt != null ? `${st.avgInWt.toFixed(1)} kg` : "—"],
    st.avgExitLW != null && ["Avg exit wt (LW equiv.)", `${st.avgExitLW.toFixed(1)} kg`],
    st.gain != null && ["Avg gain (LW equiv.)", `${st.gain >= 0 ? "+" : "−"}${Math.abs(st.gain).toFixed(1)} kg`, posNeg(st.gain)],
    ["Days on feed — on-farm lambs", `${st.currentDays} days`],
    st.nSold > 0 && ["Avg days on feed — sold", `${Math.round(st.avgDays)} days`],
    st.onFarm > 0 && ["Feed cost accrued (on-farm, unrealised)", `$${st.feedAccrued.toFixed(0)}`],
    st.nSold > 0 && !un && ["Total realised margin", money(st.totMargin, 0), posNeg(st.totMargin), true],
    st.nSold > 0 && !un && ["Realised margin / day on feed", showMoney(st.profitDay, 2), posNeg(st.profitDay), true],
    st.nSold > 0 && un && ["Total sale income (after levies)", money(st.totMargin, 0), "", true],
  ].filter(Boolean);

  return (
    <>
      <button onClick={() => go("mobs")} className="text-sm font-semibold text-stone-600">‹ All mobs</button>

      <div className={CARD}>
        <div className="text-xs text-slate-400">{m.id} · inducted {m.inDate}</div>
        <div className="text-xl font-bold text-slate-800">{m.name}</div>
        <div className="text-xs text-slate-500 mt-1">
          {un ? "Income only — no cost-in known" : `${m.type === "home" ? "Home-grown" : "Bought"} · ${st.closed ? "Closed" : "Open"} · from ${m.src || "—"}`}
        </div>
      </div>

      {st.nSold > 0 ? (
        <div className="bg-stone-800 text-white rounded-2xl p-4">
          <div className="text-[11px] uppercase tracking-wide opacity-70">{un ? "Sale income · no cost-in known" : "Realised profit · sold lambs only"}</div>
          <div className="text-3xl font-extrabold mt-0.5">
            {un ? showMoney(st.avgRevenueHd, 2) : showMoney(st.profitHd, 2)}<span className="text-sm font-medium opacity-80"> /head</span>
          </div>
          <div className="text-xs opacity-80 mt-1">
            {st.nSold} sold · avg {Math.round(st.avgDays)} days on feed{un ? "" : ` · ${showMoney(st.profitDay, 2)} /day`}
          </div>
        </div>
      ) : (
        <div className="bg-stone-800 text-white rounded-2xl p-4">
          <div className="text-[11px] uppercase tracking-wide opacity-70">Nothing sold yet</div>
          <div className="text-3xl font-extrabold mt-0.5">{st.currentDays}<span className="text-sm font-medium opacity-80"> days on feed</span></div>
          <div className="text-xs opacity-80 mt-1">Profit shows after the first sale sheet is pasted in</div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-2">
        <StatBox n={st.inducted} label="Inducted" />
        <StatBox n={st.nSold} label="Sold" tone="text-green-700" />
        <StatBox n={st.onFarm} label="On farm" tone="text-amber-600" />
        <StatBox n={st.nSold ? Math.round(st.avgDays) : st.currentDays} label={st.nSold ? "Avg days (sold)" : "Days on feed"} />
      </div>

      <div className={CARD}>
        <div className="font-bold text-slate-800 mb-2">Mob ledger</div>
        {ledger.map(([label, value, tone, big], i) => (
          <div key={i} className="flex justify-between gap-3 py-2.5 border-b border-slate-100 last:border-0 text-sm">
            <span className="text-slate-500">{label}</span>
            <span className={`font-semibold text-right ${big ? "text-base" : ""} ${tone || "text-slate-800"}`}>{value}</span>
          </div>
        ))}
      </div>
      <div className={NOTE}>
        Profit is <b>realised only</b> — lambs still on farm are excluded until a sale sheet is pasted for them. Feed ${s.feedCost.toFixed(2)}/day and levies ${s.levies.toFixed(2)}/hd come from Settings.
      </div>

      {!un && (
        <div className={`${CARD} space-y-2`}>
          <div className="font-bold text-slate-800">Edit mob</div>
          <div><label className={LABEL}>Mob name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={INPUT} /></div>
          <div><label className={LABEL}>Source</label><input value={form.src} onChange={(e) => setForm({ ...form, src: e.target.value })} className={INPUT} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={LABEL}>Induction date</label><input type="date" value={form.inDate} onChange={(e) => setForm({ ...form, inDate: e.target.value })} className={INPUT} /></div>
            <div><label className={LABEL}>Cost rate ($)</label><input type="number" inputMode="decimal" step="0.01" value={form.costRate} onChange={(e) => setForm({ ...form, costRate: e.target.value })} className={INPUT} /></div>
          </div>
          <div>
            <label className={LABEL}>Cost basis</label>
            <select value={form.costBasis} onChange={(e) => setForm({ ...form, costBasis: e.target.value })} className={INPUT}>
              <option value="perkg">$ / kg liveweight</option>
              <option value="perhead">$ / head</option>
              <option value="none">No cost-in</option>
            </select>
          </div>
          <button onClick={save} disabled={busy} className={`${BTN_LIGHT} w-full ${busy ? "opacity-50" : ""}`}>Save changes</button>
        </div>
      )}
      <button onClick={remove} disabled={busy} className="w-full bg-white border border-rose-300 text-rose-600 rounded-2xl py-3 font-semibold text-sm">
        Delete mob &amp; its {st.inducted} lambs
      </button>

      <div className={CARD}>
        <div className="font-bold text-slate-800 mb-2">Lambs ({st.inducted})</div>
        <input value={q} onChange={(e) => { setQ(e.target.value); setVisible(100); }} placeholder="Find EID (last digits work)" className={INPUT} />
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-slate-400 text-left">
                <th className="py-2 pr-2">EID</th><th className="pr-2 text-right">In kg</th><th className="pr-2">Status</th>
                <th className="pr-2 text-right">Days</th><th className="pr-2 text-right">Sale wt</th><th className="pr-2 text-right">$/kg</th><th className="text-right">Margin</th>
              </tr>
            </thead>
            <tbody>
              {anims.slice(0, visible).map((a) => {
                if (a.sold) {
                  const e = animalEcon(a, m, s, st.avgInWt);
                  return (
                    <tr key={a.eid} className="border-t border-slate-100 whitespace-nowrap">
                      <td className="py-2 pr-2 font-mono text-slate-500">{fmtEid(a.eid)}</td>
                      <td className="pr-2 text-right">{a.inWt != null ? a.inWt.toFixed(1) : "—"}</td>
                      <td className="pr-2">Sold {a.saleDate}</td>
                      <td className="pr-2 text-right">{e.days}</td>
                      <td className="pr-2 text-right">{a.saleWt.toFixed(1)} kg {a.saleWtType === "cw" ? "HSCW" : "LW"}</td>
                      <td className="pr-2 text-right">${(a.price || 0).toFixed(2)}</td>
                      <td className={`text-right font-semibold ${posNeg(un ? null : e.margin)}`}>{un ? money(e.revenue, 2) : money(e.margin, 2)}</td>
                    </tr>
                  );
                }
                return (
                  <tr key={a.eid} className="border-t border-slate-100 whitespace-nowrap">
                    <td className="py-2 pr-2 font-mono text-slate-500">{fmtEid(a.eid)}</td>
                    <td className="pr-2 text-right">{a.inWt != null ? a.inWt.toFixed(1) : "—"}</td>
                    <td className="pr-2 text-amber-600 font-semibold">On farm</td>
                    <td className="pr-2 text-right">{st.currentDays}</td>
                    <td className="pr-2 text-right text-slate-300">—</td><td className="pr-2 text-right text-slate-300">—</td><td className="text-right text-slate-300">—</td>
                  </tr>
                );
              })}
              {anims.length === 0 && <tr><td colSpan={7} className="py-3 text-slate-400">No lambs match.</td></tr>}
            </tbody>
          </table>
        </div>
        {anims.length > visible && (
          <button onClick={() => setVisible((v) => v + 100)} className={`${BTN_LIGHT} w-full mt-2`}>Show more ({anims.length - visible} more)</button>
        )}
      </div>
    </>
  );
}

// ── Induct ───────────────────────────────────────────────────────────────────
function PasteBox({ boxRef, label, placeholder }) {
  // Uncontrolled on purpose: pasting thousands of EIDs into a controlled field re-renders on every keystroke
  return (
    <div>
      <label className={LABEL}>{label}</label>
      <textarea ref={boxRef} placeholder={placeholder} spellCheck={false}
        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 bg-white text-xs font-mono leading-relaxed min-h-[160px]" />
    </div>
  );
}

function ReconCell({ n, label, tone }) {
  return (
    <div className={`rounded-xl py-2.5 text-center ${tone}`}>
      <div className="text-xl font-extrabold">{n}</div>
      <div className="text-[10px] uppercase tracking-wide font-semibold mt-0.5">{label}</div>
    </div>
  );
}

function InductView({ data, reload, showToast, api, openMob }) {
  const pasteRef = useRef(null);
  const [target, setTarget] = useState("__new__");
  const [form, setForm] = useState({ name: "", src: "", type: "bought", inDate: todayStr(), costBasis: "perkg", costRate: "" });
  const [parsed, setParsed] = useState(null);
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState(false);
  const known = useMemo(() => new Set(data.animals.map((a) => a.eid)), [data.animals]);

  const preview = () => {
    const p = parsePaste(pasteRef.current.value, "induct");
    setParsed({ ...p, fresh: p.rows.filter((r) => !known.has(r.eid)), existing: p.rows.filter((r) => known.has(r.eid)) });
    setDone(null);
  };

  const commit = async () => {
    if (!parsed || !parsed.fresh.length || busy) return;
    if (target === "__new__" && !form.name.trim()) { showToast("Give the mob a name first"); return; }
    setBusy(true);
    try {
      const payload = { animals: parsed.fresh.map((r) => ({ eid: r.eid, inWt: r.wt })) };
      if (target === "__new__") {
        payload.mob = { name: form.name, src: form.src, type: form.type, inDate: form.inDate || todayStr(), costBasis: form.costBasis, costRate: Number(form.costRate) || 0 };
      } else payload.mobId = target;
      const res = await api.inductLambs(payload);
      await reload();
      pasteRef.current.value = "";
      setParsed(null);
      if (target === "__new__") { setTarget(res.mob.id); setForm({ ...form, name: "", src: "", costRate: "" }); }
      setDone({ mob: res.mob, inducted: res.inducted, skipped: res.skipped });
    } catch (err) { showToast(err.message || "Couldn't induct those lambs"); }
    setBusy(false);
  };

  const withWt = parsed ? parsed.fresh.filter((r) => r.wt != null) : [];

  return (
    <>
      <div className={`${CARD} space-y-2`}>
        <div className="font-bold text-slate-800">Mob details</div>
        <div>
          <label className={LABEL}>Add to</label>
          <select value={target} onChange={(e) => setTarget(e.target.value)} className={INPUT}>
            <option value="__new__">＋ New mob</option>
            {data.mobs.filter((m) => !isUnattr(m)).map((m) => <option key={m.id} value={m.id}>Add to: {m.name}</option>)}
          </select>
        </div>
        {target === "__new__" && (
          <>
            <div><label className={LABEL}>Mob name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Hassall July lambs" className={INPUT} /></div>
            <div>
              <label className={LABEL}>Source</label>
              <div className="grid grid-cols-2 gap-2">
                {[["bought", "Bought"], ["home", "Home-grown"]].map(([id, label]) => (
                  <button key={id} onClick={() => setForm({ ...form, type: id })}
                    className={`py-2.5 rounded-xl text-sm font-semibold border ${form.type === id ? "bg-stone-800 text-white border-stone-800" : "bg-white text-slate-500 border-slate-200"}`}>{label}</button>
                ))}
              </div>
            </div>
            <div><label className={LABEL}>Property / vendor</label><input value={form.src} onChange={(e) => setForm({ ...form, src: e.target.value })} placeholder="e.g. Boorowa saleyards" className={INPUT} /></div>
            <div><label className={LABEL}>Induction date (day 1 on feed)</label><input type="date" value={form.inDate} onChange={(e) => setForm({ ...form, inDate: e.target.value })} className={INPUT} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={LABEL}>Cost-in basis</label>
                <select value={form.costBasis} onChange={(e) => setForm({ ...form, costBasis: e.target.value })} className={INPUT}>
                  <option value="perkg">$ / kg liveweight</option><option value="perhead">$ / head</option><option value="none">No cost-in ($0)</option>
                </select>
              </div>
              <div><label className={LABEL}>Rate ($)</label><input type="number" inputMode="decimal" step="0.01" value={form.costRate} onChange={(e) => setForm({ ...form, costRate: e.target.value })} placeholder="e.g. 4.80" className={INPUT} /></div>
            </div>
          </>
        )}
      </div>
      <div className={NOTE}>Days on feed for every lamb in the mob counts from the <b>induction date</b>. Cost-in on $/kg uses each lamb's own induction weight (the mob average is used for any lamb pasted without a weight).</div>

      <div className={`${CARD} space-y-3`}>
        <PasteBox boxRef={pasteRef} label="Paste EIDs from Excel — the EID column, plus the liveweight column if you have it"
          placeholder={"982123456789012\t41.2\n982123456789013\t38.9\n982123456789014\n\nWeights are optional — rows without one still go in."} />
        <button onClick={preview} className={`${BTN_LIGHT} w-full`}>Preview paste</button>

        {parsed && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <ReconCell n={parsed.rows.length} label="Rows" tone="bg-slate-100 text-slate-700" />
              <ReconCell n={parsed.fresh.length} label="To induct" tone="bg-green-50 text-green-700" />
              <ReconCell n={parsed.existing.length} label="Already in" tone={parsed.existing.length ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-700"} />
            </div>
            {withWt.length > 0 && (
              <div className={NOTE_GOOD}>
                {withWt.length} of {parsed.fresh.length} with liveweight · avg <b>{(avg(withWt.map((r) => r.wt)) || 0).toFixed(1)} kg</b>
                {parsed.fresh.length > withWt.length ? ` · ${parsed.fresh.length - withWt.length} without weight (still inducted)` : ""}
              </div>
            )}
            {parsed.sciCount > 0 && (
              <div className={NOTE_BAD}><b>{plural(parsed.sciCount, "row looks", "rows look")} like Excel scientific notation</b> (e.g. 9.82E+14) — Excel has already cut the EID's digits off, so they can't be read. Format the EID column as a Number with 0 decimals (or Text) in Excel and copy it again.</div>
            )}
            {parsed.dupCount > 0 && <div className={NOTE_WARN}>{plural(parsed.dupCount, "duplicate EID row", "duplicate EID rows")} in the paste — kept the first.</div>}
            {parsed.skipped.length > 0 && <div className={NOTE_WARN}>{plural(parsed.skipped.length, "line", "lines")} skipped (no EID found) — header rows are skipped automatically.</div>}
            {parsed.existing.length > 0 && (
              <div className={NOTE_BAD}><b>{plural(parsed.existing.length, "EID is", "EIDs are")} already in the system</b> and will be skipped: {parsed.existing.slice(0, 5).map((r) => fmtEid(r.eid)).join(", ")}{parsed.existing.length > 5 ? " …" : ""}</div>
            )}
            {parsed.fresh.length > 0 && (
              <div className="overflow-x-auto max-h-56 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead><tr className="text-[10px] uppercase tracking-wide text-slate-400 text-left"><th className="py-1.5">EID</th><th className="text-right">Liveweight</th></tr></thead>
                  <tbody>
                    {parsed.fresh.slice(0, 12).map((r) => (
                      <tr key={r.eid} className="border-t border-slate-100"><td className="py-1.5 font-mono text-slate-500">{fmtEid(r.eid)}</td><td className="text-right font-semibold">{r.wt != null ? `${r.wt.toFixed(1)} kg` : "—"}</td></tr>
                    ))}
                    {parsed.fresh.length > 12 && <tr><td colSpan={2} className="py-1.5 text-slate-400">… and {parsed.fresh.length - 12} more</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
            {parsed.fresh.length > 0 && (
              <button onClick={commit} disabled={busy} className={`${BTN_DARK} w-full ${busy ? "opacity-50" : ""}`}>
                {busy ? "Inducting…" : `Induct ${plural(parsed.fresh.length, "lamb", "lambs")}`}
              </button>
            )}
          </>
        )}
      </div>

      {done && (
        <div className={NOTE_GOOD}>
          <b>{plural(done.inducted, "lamb", "lambs")} inducted into {done.mob.name}.</b> Day 1 on feed = {done.mob.inDate}.{done.skipped ? ` ${done.skipped} were already in and skipped.` : ""}{" "}
          <button onClick={() => openMob(done.mob.id)} className="underline font-semibold">View mob ›</button>
        </div>
      )}
    </>
  );
}

// ── Sales ────────────────────────────────────────────────────────────────────
function SalesView({ data, reload, showToast, api, go }) {
  const pasteRef = useRef(null);
  const [form, setForm] = useState({ saleDate: todayStr(), buyer: "", wtType: "lw", price: "" });
  const [parsed, setParsed] = useState(null);
  const [addUnmatched, setAddUnmatched] = useState(false);
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState(false);
  const index = useMemo(() => new Map(data.animals.map((a) => [a.eid, a])), [data.animals]);

  const preview = () => {
    const p = parsePaste(pasteRef.current.value, "sale");
    const defPrice = parseFloat(form.price) || null;
    const matched = [], alreadySold = [], unmatched = [], noWeight = [];
    for (const r of p.rows) {
      const a = index.get(r.eid);
      const price = r.price != null ? r.price : defPrice;
      if (!a) { unmatched.push({ ...r, price }); continue; }
      if (a.sold) { alreadySold.push(r); continue; }
      if (r.wt == null) { noWeight.push(r); continue; }
      matched.push({ ...r, price, mobId: a.mobId });
    }
    setParsed({ ...p, matched, unmatched, alreadySold, noWeight });
    setDone(null);
  };

  const priced = parsed ? parsed.matched.filter((r) => r.price != null) : [];
  const unattrOk = parsed ? parsed.unmatched.filter((r) => r.wt != null && r.price != null) : [];
  const canCommit = !!parsed && (priced.length > 0 || (addUnmatched && unattrOk.length > 0));

  const commit = async () => {
    if (!canCommit || busy) return;
    setBusy(true);
    try {
      const res = await api.recordLambSales({
        saleDate: form.saleDate || todayStr(), buyer: form.buyer, saleWtType: form.wtType,
        rows: priced.map((r) => ({ eid: r.eid, saleWt: r.wt, price: r.price })),
        unattributed: addUnmatched ? unattrOk.map((r) => ({ eid: r.eid, saleWt: r.wt, price: r.price })) : [],
      });
      await reload();
      pasteRef.current.value = "";
      setParsed(null);
      setAddUnmatched(false);
      setDone(res);
    } catch (err) { showToast(err.message || "Couldn't record the sale"); }
    setBusy(false);
  };

  const byMob = {};
  if (parsed) for (const r of priced) (byMob[r.mobId] = byMob[r.mobId] || []).push(r);
  const noPrice = parsed ? parsed.matched.length - priced.length : 0;

  return (
    <>
      <div className={`${CARD} space-y-2`}>
        <div className="font-bold text-slate-800">Sale details</div>
        <div><label className={LABEL}>Sale / kill date</label><input type="date" value={form.saleDate} onChange={(e) => setForm({ ...form, saleDate: e.target.value })} className={INPUT} /></div>
        <div><label className={LABEL}>Buyer / processor (optional)</label><input value={form.buyer} onChange={(e) => setForm({ ...form, buyer: e.target.value })} placeholder="e.g. Gundagai Meats" className={INPUT} /></div>
        <div>
          <label className={LABEL}>Weights pasted are</label>
          <div className="grid grid-cols-2 gap-2">
            {[["lw", "Liveweight"], ["cw", "Carcass (HSCW)"]].map(([id, label]) => (
              <button key={id} onClick={() => setForm({ ...form, wtType: id })}
                className={`py-2.5 rounded-xl text-sm font-semibold border ${form.wtType === id ? "bg-stone-800 text-white border-stone-800" : "bg-white text-slate-500 border-slate-200"}`}>{label}</button>
            ))}
          </div>
        </div>
        <div><label className={LABEL}>Default price ($/kg) — used when a row has no price column</label><input type="number" inputMode="decimal" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="e.g. 4.20" className={INPUT} /></div>
      </div>
      <div className={NOTE}>Every row is matched back to its mob by <b>EID</b>. Revenue per head = pasted weight × $/kg, minus levies &amp; freight. Days on feed = sale date − mob induction date.</div>

      <div className={`${CARD} space-y-3`}>
        <PasteBox boxRef={pasteRef} label="Paste the sale sheet from Excel — columns: EID, weight, and optionally $/kg per row"
          placeholder={"982123456789012\t52.4\t4.20\n982123456789013\t49.8\t4.20\n982123456789014\t50.1"} />
        <button onClick={preview} className={`${BTN_LIGHT} w-full`}>Preview &amp; match EIDs</button>

        {parsed && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <ReconCell n={parsed.rows.length} label="On sheet" tone="bg-slate-100 text-slate-700" />
              <ReconCell n={parsed.matched.length} label="Matched" tone="bg-green-50 text-green-700" />
              <ReconCell n={parsed.unmatched.length} label="Unmatched" tone={parsed.unmatched.length ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-700"} />
            </div>
            {noPrice > 0 && <div className={NOTE_BAD}><b>{plural(noPrice, "matched row has", "matched rows have")} no $/kg.</b> Add a price column or set the default price, then preview again.</div>}
            {parsed.noWeight.length > 0 && <div className={NOTE_WARN}>{plural(parsed.noWeight.length, "matched row", "matched rows")} skipped — no weight found.</div>}
            {parsed.alreadySold.length > 0 && <div className={NOTE_WARN}>{plural(parsed.alreadySold.length, "EID", "EIDs")} already recorded as sold — skipped.</div>}
            {parsed.dupCount > 0 && <div className={NOTE_WARN}>{plural(parsed.dupCount, "duplicate EID row", "duplicate EID rows")} in the paste — kept the first.</div>}
            {parsed.sciCount > 0 && <div className={NOTE_BAD}><b>{plural(parsed.sciCount, "row looks", "rows look")} like Excel scientific notation</b> (e.g. 9.82E+14) — the EID digits are already lost. Format the EID column as a Number with 0 decimals (or Text) in Excel and copy again.</div>}
            {parsed.skipped.length > 0 && <div className={NOTE_WARN}>{plural(parsed.skipped.length, "line", "lines")} skipped (no EID found).</div>}

            {priced.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="text-[10px] uppercase tracking-wide text-slate-400 text-left"><th className="py-1.5">Mob</th><th className="text-right">Head</th><th className="text-right">Avg wt</th><th className="text-right">Days on feed</th></tr></thead>
                  <tbody>
                    {Object.keys(byMob).map((id) => {
                      const m = data.mobs.find((x) => x.id === id);
                      const rs = byMob[id];
                      return (
                        <tr key={id} className="border-t border-slate-100">
                          <td className="py-1.5">{m ? m.name : id}</td><td className="text-right font-semibold">{rs.length}</td>
                          <td className="text-right font-semibold">{(avg(rs.map((r) => r.wt)) || 0).toFixed(1)} kg</td>
                          <td className="text-right font-semibold">{m ? daysBetween(m.inDate, form.saleDate || todayStr()) : 0} d</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {parsed.unmatched.length > 0 && (
              <>
                <div className={NOTE_BAD}><b>{plural(parsed.unmatched.length, "EID", "EIDs")} not in the system</b> — no cost-in known: {parsed.unmatched.slice(0, 6).map((r) => fmtEid(r.eid)).join(", ")}{parsed.unmatched.length > 6 ? " …" : ""}</div>
                <label className="flex items-start gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={addUnmatched} onChange={(e) => setAddUnmatched(e.target.checked)} className="mt-0.5 w-4 h-4" />
                  <span>Record them anyway in an <b>Unattributed</b> mob (income counted, no cost-in).{unattrOk.length < parsed.unmatched.length ? ` ${plural(parsed.unmatched.length - unattrOk.length, "row has", "rows have")} no weight or price and can't be recorded.` : ""}</span>
                </label>
              </>
            )}

            {canCommit && (
              <button onClick={commit} disabled={busy} className={`${BTN_DARK} w-full ${busy ? "opacity-50" : ""}`}>
                {busy ? "Recording…" : `Record sale of ${plural(priced.length, "matched head", "matched head")}${addUnmatched && unattrOk.length ? ` + ${unattrOk.length} unattributed` : ""}`}
              </button>
            )}
          </>
        )}
      </div>

      {done && (
        <div className={done.notSold > 0 ? NOTE_WARN : NOTE_GOOD}>
          <b>{done.sold} head recorded sold{done.unattributed ? ` + ${done.unattributed} unattributed` : ""}.</b> Mob profitability and days on feed are updated.
          {done.notSold > 0 ? ` ${done.notSold} could not be recorded (already sold or not found) — someone may have just recorded them.` : ""}{" "}
          <button onClick={() => go("mobs")} className="underline font-semibold">View mobs ›</button>
        </div>
      )}
    </>
  );
}

// ── Profit ───────────────────────────────────────────────────────────────────
function ProfitView({ data, stats, openMob }) {
  const [mode, setMode] = useState("head");
  const real = data.mobs.filter((m) => !isUnattr(m)).map((m) => ({ m, st: stats.get(m.id) })).filter((x) => x.st.nSold > 0);
  const val = (x) => (mode === "head" ? x.st.profitHd : x.st.profitDay);
  const lbl = mode === "head" ? "per head" : "per day";
  const mobsSorted = [...real].sort((a, b) => val(b) - val(a));

  const bySrc = {};
  for (const x of real) {
    const k = x.m.src || "—";
    const e = (bySrc[k] = bySrc[k] || { n: 0, margin: 0, days: 0, mobs: 0, type: x.m.type });
    e.n += x.st.nSold; e.margin += x.st.totMargin; e.days += x.st.avgDays * x.st.nSold; e.mobs++;
  }
  const srcArr = Object.keys(bySrc).map((k) => {
    const e = bySrc[k];
    const perHead = e.margin / e.n, avgD = e.days / e.n;
    return { name: k, sub: `${e.type === "home" ? "home-grown" : "bought"} · ${plural(e.mobs, "mob", "mobs")} · ${e.n} sold`, v: mode === "head" ? perHead : (avgD ? perHead / avgD : 0) };
  }).sort((a, b) => b.v - a.v);

  const un = data.mobs.find(isUnattr);
  const unSt = un && stats.get(un.id);

  const Row = ({ i, title, sub, v, onClick }) => (
    <button onClick={onClick} disabled={!onClick} className={`${CARD} w-full flex items-center gap-3 text-left`}>
      <div className="text-xl font-bold text-slate-200 w-6 text-center flex-shrink-0">{i + 1}</div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-slate-800 text-sm truncate">{title}</div>
        <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className={`text-base font-extrabold ${posNeg(v)}`}>{money(v, 2)}</div>
        <div className="text-[9.5px] uppercase tracking-wide text-slate-400">{lbl}</div>
      </div>
    </button>
  );

  return (
    <>
      <div className="grid grid-cols-2 gap-1 bg-slate-100 rounded-xl p-1">
        {[["head", "Margin / head"], ["day", "Margin / day on feed"]].map(([id, label]) => (
          <button key={id} onClick={() => setMode(id)} className={`py-2 rounded-lg text-xs font-semibold ${mode === id ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"}`}>{label}</button>
        ))}
      </div>
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wide px-1">By source</div>
      {srcArr.length ? srcArr.map((r, i) => <Row key={r.name} i={i} title={r.name} sub={r.sub} v={r.v} />) : <div className="text-center text-slate-400 text-sm py-4">No realised sales yet.</div>}
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wide px-1 pt-1">By mob (realised)</div>
      {mobsSorted.length
        ? mobsSorted.map((x, i) => <Row key={x.m.id} i={i} title={x.m.name} sub={`${x.m.src} · ${x.st.nSold}/${x.st.inducted} sold · ${Math.round(x.st.avgDays)} days on feed`} v={val(x)} onClick={() => openMob(x.m.id)} />)
        : <div className="text-center text-slate-400 text-sm py-4">Nothing sold yet — rankings appear after the first sale.</div>}
      {unSt && unSt.nSold > 0 && (
        <div className={NOTE}>
          Left out of the rankings: <b>{plural(unSt.nSold, "unattributed lamb", "unattributed lambs")}</b> (sale income only — they have no cost-in or feed cost, so counting them would make the averages look far better than they are).
        </div>
      )}
    </>
  );
}

// ── Settings ─────────────────────────────────────────────────────────────────
function SettingsView({ data, reload, showToast, api }) {
  const s = data.settings;
  const fileRef = useRef(null);
  const [form, setForm] = useState({ dressing: String(s.dressing), feedCost: String(s.feedCost), levies: String(s.levies) });
  const [busy, setBusy] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const saveRates = async () => {
    setBusy(true);
    try {
      await api.saveLambSettings({ dressing: Number(form.dressing), feedCost: Number(form.feedCost), levies: Number(form.levies) });
      await reload();
      showToast("Rates saved ✓");
    } catch (err) { showToast(err.message || "Couldn't save"); }
    setBusy(false);
  };

  const exportJson = () => {
    const backup = {
      settings: { dressing: s.dressing, feedCost: s.feedCost, levies: s.levies },
      mobs: data.mobs,
      animals: data.animals,
    };
    download(`kurra-wirra-feedlot-${todayStr()}.json`, JSON.stringify(backup, null, 1), "application/json");
  };

  const exportCsv = () => {
    const byId = new Map(data.mobs.map((m) => [m.id, m]));
    const byMob = groupByMob(data.animals);
    const today = todayStr();
    const avgIn = new Map(data.mobs.map((m) => [m.id, avg((byMob.get(m.id) || []).map((a) => a.inWt).filter((x) => x != null))]));
    const head = "eid,mob,source,type,induction_date,in_wt_kg,status,sale_date,sale_wt_kg,wt_type,price_per_kg,days_on_feed,margin_per_head\n";
    const lines = data.animals.map((a) => {
      const m = byId.get(a.mobId) || {};
      let days = "", margin = "";
      if (a.sold && m.inDate) { const e = animalEcon(a, m, s, avgIn.get(m.id)); days = e.days; margin = e.margin.toFixed(2); }
      else if (m.inDate) days = daysBetween(m.inDate, today);
      return [a.eid, `"${m.name || ""}"`, `"${m.src || ""}"`, m.type || "", m.inDate || "", a.inWt ?? "", a.sold ? "sold" : "on_farm",
        a.saleDate || "", a.saleWt ?? "", a.saleWtType || "", a.price ?? "", days, margin].join(",");
    });
    download(`kurra-wirra-lambs-${todayStr()}.csv`, head + lines.join("\n"), "text/csv");
  };

  const onFile = async (file) => {
    if (!file) return;
    let backup;
    try { backup = JSON.parse(await file.text()); } catch { showToast("Couldn't read that file — is it a Feedlot Tracker backup?"); return; }
    if (!window.confirm("Add this backup to the farm database? Lambs and mobs already here are skipped and nothing is deleted or changed.")) return;
    setBusy(true);
    try {
      const res = await api.importLambBackup(backup);
      await reload();
      setImportResult(res);
    } catch (err) { showToast(err.message || "Couldn't import that file"); }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <>
      <div className={CARD}>
        <div className="font-bold text-slate-800 mb-3">Feedlot rates</div>
        <div className="space-y-3">
          {[["dressing", "Dressing %", "Converts carcass weight to liveweight equivalent for gain reporting.", "0.5"],
            ["feedCost", "Feed cost ($/head/day)", "Charged for each day on feed when a lamb is sold.", "0.01"],
            ["levies", "Levies + freight ($/head)", "Deducted from every head sold.", "0.05"]].map(([key, label, hint, step]) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <div className="min-w-0"><div className="text-sm font-semibold text-slate-700">{label}</div><div className="text-[11px] text-slate-400 leading-snug">{hint}</div></div>
              <input type="number" inputMode="decimal" step={step} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-24 border border-slate-200 rounded-xl px-2 py-2 text-right font-bold text-stone-800 flex-shrink-0" />
            </div>
          ))}
        </div>
        <button onClick={saveRates} disabled={busy} className={`${BTN_DARK} w-full mt-4 ${busy ? "opacity-50" : ""}`}>Save rates</button>
        <div className="text-[11px] text-slate-400 mt-2">Changing a rate re-works the figures for every sold lamb, including past sales.</div>
      </div>

      <div className={`${CARD} space-y-2`}>
        <div className="font-bold text-slate-800">Backup</div>
        <div className="text-xs text-slate-400">Everything is stored in the farm database. These are extra copies you can keep.</div>
        <button onClick={exportJson} className={`${BTN_LIGHT} w-full`}>⬇ Export backup file</button>
        <button onClick={exportCsv} className={`${BTN_LIGHT} w-full`}>▦ Export all lambs (CSV)</button>
      </div>

      <div className={`${CARD} space-y-2`}>
        <div className="font-bold text-slate-800">Bring in data from the old tracker</div>
        <div className="text-xs text-slate-400 leading-relaxed">
          In the old HTML tool go to <b>Settings → Export backup file</b>, then choose that file here. Mobs and lambs are added; anything already here is skipped, and nothing is ever deleted.
        </div>
        <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        <button onClick={() => fileRef.current?.click()} disabled={busy} className={`${BTN_LIGHT} w-full ${busy ? "opacity-50" : ""}`}>⬆ Import backup file</button>
        {importResult && (
          <div className={NOTE_GOOD}>
            <b>Import finished.</b> {plural(importResult.mobsAdded, "mob", "mobs")} and {plural(importResult.lambsAdded, "lamb", "lambs")} added
            {importResult.mobsAlreadyHere || importResult.lambsAlreadyHere ? ` · ${importResult.mobsAlreadyHere} mobs and ${importResult.lambsAlreadyHere} lambs were already here` : ""}
            {importResult.invalid ? ` · ${plural(importResult.invalid, "row was", "rows were")} skipped (not a valid EID, missing mob or incomplete sale)` : ""}
            {importResult.settingsApplied ? " · rates taken from the backup" : ""}.
          </div>
        )}
      </div>
    </>
  );
}
