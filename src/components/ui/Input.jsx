import React from "react";
import { cn } from "../../lib/cn";

export function Input({ label, hint, error, className = "", ...props }) {
  return (
    <label className="block">
      {label ? <div className="text-xs font-medium text-slate-600">{label}</div> : null}
      <input
        className={cn(
          "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none " +
            "focus:ring-2 focus:ring-slate-900/15",
          error ? "border-rose-300 focus:ring-rose-500/15" : "",
          className
        )}
        {...props}
      />
      {error ? <div className="mt-2 text-xs text-rose-600">{error}</div> : null}
      {hint ? <div className="mt-2 text-xs text-slate-500">{hint}</div> : null}
    </label>
  );
}