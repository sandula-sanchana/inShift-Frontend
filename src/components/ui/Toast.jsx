import React from "react";
import { create } from "zustand";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export const useToast = create((set) => ({
  items: [],
  push: (t) =>
    set((s) => ({
      items: [{ id: crypto.randomUUID(), ...t }, ...s.items].slice(0, 4),
    })),
  remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
}));

/** Place once in root layout */
export function ToastHost() {
  const items = useToast((s) => s.items);
  const remove = useToast((s) => s.remove);

  return (
    <div className="fixed right-4 top-4 z-[100] w-[min(420px,calc(100vw-2rem))] space-y-3">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="rounded-2xl bg-white shadow-soft ring-1 ring-slate-200 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">{t.title || "Notice"}</div>
                {t.message ? <div className="mt-1 text-sm text-slate-600">{t.message}</div> : null}
              </div>
              <button
                className="rounded-xl p-1 hover:bg-slate-100 text-slate-600"
                onClick={() => remove(t.id)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}