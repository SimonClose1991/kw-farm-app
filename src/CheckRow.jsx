import React from "react";

// A tick-box with a label. The app's global CSS turns native <input type="checkbox">
// into an invisible zero-size control (`input { appearance: none }`), so ticks are
// drawn by hand here instead.
export default function CheckRow({ checked, onChange, children, tone = "slate" }) {
  const ring = tone === "rose" ? "border-rose-400" : "border-slate-400";
  return (
    <button type="button" role="checkbox" aria-checked={checked} onClick={() => onChange(!checked)}
      className="flex items-start gap-2.5 text-left w-full">
      <span className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 text-xs font-extrabold leading-none ${checked ? "bg-red-900 border-red-900 text-white" : `bg-white ${ring}`}`}>
        {checked ? "✓" : ""}
      </span>
      <span className="flex-1">{children}</span>
    </button>
  );
}
