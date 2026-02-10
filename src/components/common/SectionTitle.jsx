import React from "react";
import { cn } from "../../lib/cn";

export function SectionTitle({ title, subtitle, right, className = "" }) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
      </div>
      {right}
    </div>
  );
}