import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "../ui/Button";

export function EmptyState({
  title = "No data yet",
  description = "Connect your backend to see real data here.",
  actionLabel = "How to connect backend",
  onAction,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="rounded-2xl border border-slate-200 bg-slate-50 p-6"
    >
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200">
          <Sparkles className="h-5 w-5 text-slate-700" />
        </span>
        <div className="flex-1">
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-sm text-slate-600">{description}</div>
          {onAction ? (
            <div className="mt-4">
              <Button variant="secondary" onClick={onAction}>
                {actionLabel}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}