import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    X,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Bell,
    Info
} from "lucide-react";
import { useToast } from "./toast-store.js";

const DEFAULT_DURATION = 4500;

function getToastMeta(variant) {
    switch (variant) {
        case "success":
            return {
                Icon: CheckCircle2,
                iconWrap: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
                cardBorder: "border-emerald-500/20",
                title: "text-emerald-200",
                glow: "from-emerald-500/15 to-transparent",
                progress: "from-emerald-400 via-emerald-500 to-emerald-600",
            };
        case "error":
            return {
                Icon: XCircle,
                iconWrap: "border-rose-500/20 bg-rose-500/10 text-rose-300",
                cardBorder: "border-rose-500/20",
                title: "text-rose-200",
                glow: "from-rose-500/15 to-transparent",
                progress: "from-rose-400 via-rose-500 to-rose-600",
            };
        case "warning":
            return {
                Icon: AlertTriangle,
                iconWrap: "border-amber-500/20 bg-amber-500/10 text-amber-300",
                cardBorder: "border-amber-500/20",
                title: "text-amber-200",
                glow: "from-amber-500/15 to-transparent",
                progress: "from-amber-400 via-amber-500 to-amber-600",
            };
        case "info":
            return {
                Icon: Info,
                iconWrap: "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
                cardBorder: "border-cyan-500/20",
                title: "text-cyan-200",
                glow: "from-cyan-500/15 to-transparent",
                progress: "from-cyan-400 via-cyan-500 to-cyan-600",
            };
        default:
            return {
                Icon: Bell,
                iconWrap: "border-indigo-500/20 bg-indigo-500/10 text-indigo-300",
                cardBorder: "border-white/10",
                title: "text-white",
                glow: "from-indigo-500/15 to-transparent",
                progress: "from-indigo-400 via-indigo-500 to-purple-500",
            };
    }
}

function ToastItem({ t, onClose }) {
    const meta = getToastMeta(t.variant);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            onClose(t.id);
        }, t.duration || DEFAULT_DURATION);

        return () => window.clearTimeout(timeout);
    }, [t.id, t.duration, onClose]);

    return (
        <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className={`relative overflow-hidden rounded-2xl border bg-[#0b1120]/95 shadow-2xl backdrop-blur-2xl ${meta.cardBorder}`}
        >
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-r ${meta.glow}`} />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.10),transparent_32%)]" />

            <div className="relative flex items-start justify-between gap-3 p-4">
                <div className="flex min-w-0 items-start gap-3">
                    <div className={`mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${meta.iconWrap}`}>
                        <meta.Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                        <div className={`text-sm font-semibold ${meta.title}`}>
                            {t.title || "Notice"}
                        </div>

                        {t.message ? (
                            <div className="mt-1 text-sm leading-6 text-slate-300">
                                {t.message}
                            </div>
                        ) : null}
                    </div>
                </div>

                <button
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
                    onClick={() => onClose(t.id)}
                    aria-label="Close"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <motion.div
                className={`h-[2px] bg-gradient-to-r ${meta.progress}`}
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: (t.duration || DEFAULT_DURATION) / 1000, ease: "linear" }}
            />
        </motion.div>
    );
}

export function ToastHost() {
    const items = useToast((s) => s.items);
    const remove = useToast((s) => s.remove);

    return (
        <div className="pointer-events-none fixed right-4 top-4 z-[100] w-[min(420px,calc(100vw-2rem))] space-y-3">
            <AnimatePresence>
                {items.map((t) => (
                    <div key={t.id} className="pointer-events-auto">
                        <ToastItem t={t} onClose={remove} />
                    </div>
                ))}
            </AnimatePresence>
        </div>
    );
}