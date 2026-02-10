import React from "react";
import { cn } from "../../lib/cn";

export function Card({ className = "", children }) {
  return (
    <div className={cn("rounded-2xl bg-white shadow-soft ring-1 ring-slate-200", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ className = "", children }) {
  return <div className={cn("p-5 border-b border-slate-100", className)}>{children}</div>;
}

export function CardTitle({ className = "", children }) {
  return <div className={cn("text-base font-semibold text-slate-900", className)}>{children}</div>;
}

export function CardDescription({ className = "", children }) {
  return <div className={cn("mt-1 text-sm text-slate-600", className)}>{children}</div>;
}

export function CardContent({ className = "", children }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}