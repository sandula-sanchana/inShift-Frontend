import React, { useEffect, useMemo, useState } from "react";
import {
    CalendarClock,
    Clock3,
    Coffee,
    ShieldCheck,
    TimerReset,
    RefreshCw,
    Loader2,
    AlertTriangle,
    CheckCircle2,
    Sparkles,
    Sunrise,
    Sunset,
    Info
} from "lucide-react";
import { api } from "../../../lib/api.js";
import { useToast } from "../../../components/ui/toast-store.js";

const SHIFT_ENDPOINT = "/v1/emp/shifts/default";

function Pill({ children, tone = "slate" }) {
    const tones = {
        slate: "border-white/10 bg-white/[0.05] text-slate-300",
        green: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
        yellow: "border-amber-500/20 bg-amber-500/10 text-amber-300",
        red: "border-rose-500/20 bg-rose-500/10 text-rose-300",
        indigo: "border-indigo-500/20 bg-indigo-500/10 text-indigo-300",
        purple: "border-purple-500/20 bg-purple-500/10 text-purple-300",
        cyan: "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
    };

    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
            {children}
        </span>
    );
}

function GlassCard({ children, className = "" }) {
    return (
        <div className={`rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-none ${className}`}>
            {children}
        </div>
    );
}

function StatCard({ title, value, hint, icon: Icon, tone = "indigo" }) {
    const tones = {
        indigo: "border-indigo-500/20 bg-indigo-500/5 text-indigo-300",
        emerald: "border-emerald-500/20 bg-emerald-500/5 text-emerald-300",
        amber: "border-amber-500/20 bg-amber-500/5 text-amber-300",
        cyan: "border-cyan-500/20 bg-cyan-500/5 text-cyan-300",
    };

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</div>
                    <div className="mt-3 text-2xl font-bold text-white">{value}</div>
                    <div className="mt-2 text-xs text-slate-400">{hint}</div>
                </div>

                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${tones[tone] || tones.indigo}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

function formatTime(value) {
    if (!value) return "--";
    return String(value).slice(0, 5);
}

function minutesToText(value) {
    if (value == null) return "--";
    if (value === 0) return "0 min";
    return `${value} min`;
}

export default function Shifts() {
    const toast = useToast((s) => s.push);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [shift, setShift] = useState(null);
    const [error, setError] = useState("");

    async function loadShift(silent = false) {
        try {
            if (silent) setRefreshing(true);
            else setLoading(true);

            setError("");

            const res = await api.get(SHIFT_ENDPOINT);
            const data = res?.data?.data ?? res?.data ?? null;
            setShift(data);
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.msg ||
                err?.response?.data?.data?.message ||
                err?.message ||
                "Could not load shift details.";

            setShift(null);
            setError(msg);

            if (silent) {
                toast({
                    title: "Shift refresh failed",
                    message: msg,
                    variant: "error",
                });
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
        loadShift();
    }, []);

    const totalWindowMinutes = useMemo(() => {
        if (!shift?.startTime || !shift?.endTime) return "--";
        const [sh, sm] = String(shift.startTime).split(":").map(Number);
        const [eh, em] = String(shift.endTime).split(":").map(Number);

        if (
            Number.isNaN(sh) || Number.isNaN(sm) ||
            Number.isNaN(eh) || Number.isNaN(em)
        ) {
            return "--";
        }

        const start = sh * 60 + sm;
        const end = eh * 60 + em;
        const diff = end - start;

        return diff > 0 ? `${diff} min` : "--";
    }, [shift]);

    const activeTone = shift?.active ? "green" : "red";

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-8 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
                        <h1 className="text-3xl font-black tracking-tight text-white">My Shift</h1>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                        View your assigned default shift details configured by the administrator.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Pill tone="indigo">
                        <CalendarClock className="mr-1 h-3.5 w-3.5" />
                        Read Only
                    </Pill>

                    {shift?.isDefault && (
                        <Pill tone="purple">
                            <Sparkles className="mr-1 h-3.5 w-3.5" />
                            Default Shift
                        </Pill>
                    )}

                    <Pill tone={activeTone}>
                        {shift?.active ? (
                            <>
                                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                Active
                            </>
                        ) : (
                            <>
                                <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                                Inactive
                            </>
                        )}
                    </Pill>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={() => loadShift(true)}
                    disabled={loading || refreshing}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06] disabled:opacity-50"
                >
                    {refreshing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCw className="h-4 w-4" />
                    )}
                    Refresh
                </button>
            </div>

            {loading ? (
                <GlassCard className="p-6">
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading shift details...
                    </div>
                </GlassCard>
            ) : error ? (
                <GlassCard className="p-6">
                    <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="mt-0.5 h-4 w-4" />
                            <div>{error}</div>
                        </div>
                    </div>
                </GlassCard>
            ) : !shift ? (
                <GlassCard className="p-6">
                    <div className="text-sm text-slate-400">No shift details available.</div>
                </GlassCard>
            ) : (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            title="Shift Name"
                            value={shift.shiftName || "--"}
                            hint="Configured by admin"
                            icon={CalendarClock}
                            tone="indigo"
                        />
                        <StatCard
                            title="Start Time"
                            value={formatTime(shift.startTime)}
                            hint="Official shift start"
                            icon={Sunrise}
                            tone="emerald"
                        />
                        <StatCard
                            title="End Time"
                            value={formatTime(shift.endTime)}
                            hint="Official shift end"
                            icon={Sunset}
                            tone="amber"
                        />
                        <StatCard
                            title="Shift Window"
                            value={totalWindowMinutes}
                            hint="Total scheduled time range"
                            icon={Clock3}
                            tone="cyan"
                        />
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                        <GlassCard className="p-6">
                            <div className="flex items-center gap-2 text-sm font-semibold text-white">
                                <ShieldCheck className="h-4 w-4 text-indigo-300" />
                                Shift Details
                            </div>

                            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Shift Name</div>
                                    <div className="mt-2 text-sm font-bold text-white">{shift.shiftName || "--"}</div>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Default</div>
                                    <div className="mt-2">
                                        <Pill tone={shift.isDefault ? "purple" : "slate"}>
                                            {shift.isDefault ? "Yes" : "No"}
                                        </Pill>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start Time</div>
                                    <div className="mt-2 text-sm font-bold text-white">{formatTime(shift.startTime)}</div>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">End Time</div>
                                    <div className="mt-2 text-sm font-bold text-white">{formatTime(shift.endTime)}</div>
                                </div>
                            </div>
                        </GlassCard>

                        <GlassCard className="p-6">
                            <div className="flex items-center gap-2 text-sm font-semibold text-white">
                                <TimerReset className="h-4 w-4 text-indigo-300" />
                                Attendance Rules from This Shift
                            </div>

                            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Grace Minutes</div>
                                    <div className="mt-2 text-sm font-bold text-white">{minutesToText(shift.graceMinutes)}</div>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Early Check-In</div>
                                    <div className="mt-2 text-sm font-bold text-white">{minutesToText(shift.earlyCheckInMinutes)}</div>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Early Leave Grace</div>
                                    <div className="mt-2 text-sm font-bold text-white">{minutesToText(shift.earlyLeaveGraceMinutes)}</div>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">OT After</div>
                                    <div className="mt-2 text-sm font-bold text-white">{minutesToText(shift.overtimeAfterMinutes)}</div>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 sm:col-span-2">
                                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        <Coffee className="h-3.5 w-3.5" />
                                        Break Minutes
                                    </div>
                                    <div className="mt-2 text-sm font-bold text-white">{minutesToText(shift.breakMinutes)}</div>
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    <GlassCard className="p-6">
                        <div className="flex items-center gap-2 text-sm font-semibold text-white">
                            <Info className="h-4 w-4 text-indigo-300" />
                            Employee View
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-sm text-slate-300">
                                <div className="font-semibold text-white">Read-only shift page</div>
                                <div className="mt-2 text-slate-400">
                                    Employees can view the shift details that affect attendance marking and daily calculations.
                                </div>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-sm text-slate-300">
                                <div className="font-semibold text-white">Managed by admin</div>
                                <div className="mt-2 text-slate-400">
                                    Shift configuration, rules, and timing are controlled by the admin default shift setup.
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </>
            )}
        </div>
    );
}