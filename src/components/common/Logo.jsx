import React from "react";
import { ShieldCheck } from "lucide-react";

export function LogoMark({ size = 36 }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-2xl bg-slate-900 text-white shadow-soft"
      style={{ width: size, height: size }}
    >
      <ShieldCheck className="h-5 w-5" />
    </span>
  );
}