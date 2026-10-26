import React from "react";
import { KINDS, KIND_LABEL, statusOf, localToday } from "./withholding.js";

const niceDate = (iso) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

// Withholding summary for Mob Details: meat WHP, export ESI and (sheep) wool WHP,
// each with the date it clears and how long is left.
export function WithholdingCard({ mob, isSheep, today = localToday() }) {
  const s = statusOf(mob, today);
  const kinds = KINDS.filter((k) => k !== "wool" || isSheep);
  const anyActive = kinds.some((k) => s[k].active);
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-3" data-testid="withholding-card">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-slate-400 font-semibold">WITHHOLDING</div>
        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${anyActive ? "bg-rose-100 text-rose-700" : "bg-green-100 text-green-700"}`}>
          {anyActive ? "In withholding" : "All clear ✓"}
        </span>
      </div>
      <div className="space-y-1.5">
        {kinds.map((k) => (
          <div key={k} className="flex items-start justify-between gap-3 text-sm">
            <span className="text-slate-500 flex-shrink-0">{KIND_LABEL[k]}</span>
            {s[k].active ? (
              <span className="text-right font-semibold text-rose-600">
                until {niceDate(s[k].until)} · {s[k].daysLeft} day{s[k].daysLeft === 1 ? "" : "s"} left
                {k === "wool" && s.woolNote && <span className="block text-[11px] font-normal text-slate-400">{s.woolNote}</span>}
              </span>
            ) : (
              <span className="font-semibold text-green-700">Clear</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
