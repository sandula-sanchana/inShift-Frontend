import React from "react";
import { cn } from "../../lib/cn";

export function Button({
  asChild = false,
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition " +
    "focus:outline-none focus:ring-2 focus:ring-slate-900/20 disabled:opacity-60 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 shadow-soft",
    secondary: "bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50 shadow-softer",
    ghost: "bg-transparent text-slate-900 hover:bg-slate-100",
    danger: "bg-rose-600 text-white hover:bg-rose-500 shadow-soft",
    success: "bg-emerald-600 text-white hover:bg-emerald-500 shadow-soft",
  };
  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-5 py-3 text-base",
  };

  const Comp = asChild ? "span" : "button";
  return (
    <Comp
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled}
      {...props}
    />
  );
}