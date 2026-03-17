import React, { useEffect, useMemo, useState } from "react";
import {
    ShieldAlert,
    RefreshCw,
    AlertTriangle,
    Search,
    CalendarDays,
    Brain,
    ShieldCheck,
    Siren,
    Filter
} from "lucide-react";
import { api } from "../../lib/api.js";
import { cn } from "../../lib/cn";

const INTEL_BASE = "/v1/admin/intelligence";

function unwrapApiResponse(resData) {
    if (resData && typeof resData === "object" && "data" in resData) return resData.data;
    return resData;
}

function getErrorMessage(err, fallback = "Request failed") {
    const msgFromBackend = err?.response?.data?.message || err?.response?.data?.msg;
    if (msgFromBackend) return msgFromBackend;
    const status = err?.response?.status;
    if (status) return `${fallback} (${status})`;
    return err?.message || fallback;
}

function RiskBadge({ trustScore, highRisk, requiresReview }) {
    if (highRisk) {
        return (
            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20">
                High Risk
            </span>
        );
    }

    if (requiresReview) {
        return (
            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
                Review
            </span>
        );
    }

    return (
        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
            Stable
        </span>
    );
}

function FlagPill({ type, severity, scoreImpact }) {
    const tone =
        severity === "CRITICAL" ? "bg-rose-500/10 text-rose-400 ring-rose-500/20" :
            severity === "HIGH" ? "bg-orange-500/10 text-orange-400 ring-orange-500/20" :
                severity === "MEDIUM" ? "bg-amber-500/10 text-amber-400 ring-amber-500/20" :
                    "bg-sky-500/10 text-sky-400 ring-sky-500/20";

    return (
        <div className={cn("rounded-2xl px-3 py-2 ring-1", tone)}>
            <div className="text-xs font-bold">{type}</div>
            <div className="mt-1 text-[11px] opacity-80">
                {severity} • Impact {scoreImpact ?? 0}
            </div>
        </div>
    );
}

function ScoreBar({ trustScore }) {
    const safe = Math.max(0, Math.min(100, trustScore ?? 0));

    const tone =
        safe < 40 ? "bg-rose-500" :
            safe < 60 ? "bg-amber-500" :
                "bg-emerald-500";

    return (
        <div>
            <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500">
                <span>Trust Score</span>
                <span>{safe}/100</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${safe}%` }} />
            </div>
        </div>
    );
}

function SummaryTile({ title, value, icon: Icon, tone = "slate" }) {
    const tones = {
        rose: "text-rose-400 border-rose-500/20 bg-rose-500/5",
        amber: "text-amber-400 border-amber-500/20 bg-amber-500/5",
        emerald: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
        indigo: "text-indigo-400 border-indigo-500/20 bg-indigo-500/5",
        slate: "text-slate-300 border-white/10 bg-white/[0.03]",
    };

    return (
        <div className={cn("rounded-2xl border p-5", tones[tone])}>
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-xs uppercase tracking-widest opacity-70">{title}</div>
                    <div className="mt-2 text-2xl font-black">{value}</div>
                </div>
                <div className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.04]">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

export default function AttendanceIntelligencePage() {
    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [rows, setRows] = useState([]);
    const [query, setQuery] = useState("");
    const [riskFilter, setRiskFilter] = useState("ALL");

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`${INTEL_BASE}/daily`, {
                params: { date }
            });
            const data = unwrapApiResponse(res.data);
            setRows(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(getErrorMessage(e, "Failed to load intelligence data"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();

        return rows.filter((r) => {
            const textMatch =
                !q ||
                String(r.employeeName || "").toLowerCase().includes(q) ||
                String(r.employeeId || "").toLowerCase().includes(q) ||
                String(r.attendanceDate || "").toLowerCase().includes(q) ||
                (r.flags || []).some(f =>
                    String(f.flagType || "").toLowerCase().includes(q) ||
                    String(f.message || "").toLowerCase().includes(q)
                );

            const riskMatch =
                riskFilter === "ALL" ||
                (riskFilter === "HIGH" && r.highRisk) ||
                (riskFilter === "REVIEW" && !r.highRisk && r.requiresReview) ||
                (riskFilter === "STABLE" && !r.highRisk && !r.requiresReview);

            return textMatch && riskMatch;
        });
    }, [rows, query, riskFilter]);

    const totals = useMemo(() => {
        const total = rows.length;
        const high = rows.filter(r => r.highRisk).length;
        const review = rows.filter(r => !r.highRisk && r.requiresReview).length;
        const stable = rows.filter(r => !r.highRisk && !r.requiresReview).length;

        return { total, high, review, stable };
    }, [rows]);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-8 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
                        <h1 className="text-3xl font-black tracking-tight text-white lg:text-4xl">
                            Attendance Intelligence
                        </h1>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                        Review risk scores, trust levels, and suspicious attendance patterns for each employee.
                    </p>
                </div>

                <button
                    onClick={loadData}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
                >
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    Refresh
                </button>
            </header>

            {error && (
                <div className="mt-8 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-400">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>{error}</p>
                    </div>
                </div>
            )}

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryTile title="Employees Evaluated" value={totals.total} icon={Brain} tone="indigo" />
                <SummaryTile title="High Risk" value={totals.high} icon={Siren} tone="rose" />
                <SummaryTile title="Needs Review" value={totals.review} icon={ShieldAlert} tone="amber" />
                <SummaryTile title="Stable" value={totals.stable} icon={ShieldCheck} tone="emerald" />
            </div>

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-2xl">
                <div className="grid gap-4 lg:grid-cols-[220px_1fr_220px]">
                    <div>
                        <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
                            Date
                        </div>
                        <div className="relative">
                            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-10 pr-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500/30"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
                            Search
                        </div>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search employee, flag type, or message..."
                                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-10 pr-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500/30"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
                            Risk Filter
                        </div>
                        <div className="relative">
                            <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            <select
                                value={riskFilter}
                                onChange={(e) => setRiskFilter(e.target.value)}
                                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-10 pr-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500/30"
                            >
                                <option value="ALL" className="text-slate-900">All</option>
                                <option value="HIGH" className="text-slate-900">High Risk</option>
                                <option value="REVIEW" className="text-slate-900">Needs Review</option>
                                <option value="STABLE" className="text-slate-900">Stable</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 space-y-4">
                {loading ? (
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400">
                        Loading intelligence overview...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400">
                        No intelligence results found for the selected filters.
                    </div>
                ) : (
                    filtered.map((row) => (
                        <div
                            key={`${row.employeeId}-${row.attendanceDate}`}
                            className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-2xl"
                        >
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                <div>
                                    <div className="text-lg font-bold text-white">
                                        {row.employeeName} <span className="text-slate-500">• #{row.employeeId}</span>
                                    </div>
                                    <div className="mt-1 text-sm text-slate-400">
                                        Attendance Date: {row.attendanceDate || "--"}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <RiskBadge
                                        trustScore={row.trustScore}
                                        highRisk={row.highRisk}
                                        requiresReview={row.requiresReview}
                                    />
                                    <div className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-indigo-500/10 text-indigo-300 ring-1 ring-indigo-500/20">
                                        Risk {row.riskScore ?? 0}
                                    </div>
                                    <div className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-white/5 text-slate-300 ring-1 ring-white/10">
                                        Flags {row.totalFlags ?? 0}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 grid gap-5 xl:grid-cols-[260px_1fr]">
                                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                    <ScoreBar trustScore={row.trustScore ?? 100} />
                                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                        <div className="rounded-2xl bg-white/[0.03] p-3">
                                            <div className="text-xs text-slate-500">Risk Score</div>
                                            <div className="mt-1 text-xl font-black text-white">{row.riskScore ?? 0}</div>
                                        </div>
                                        <div className="rounded-2xl bg-white/[0.03] p-3">
                                            <div className="text-xs text-slate-500">Flags</div>
                                            <div className="mt-1 text-xl font-black text-white">{row.totalFlags ?? 0}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {!row.flags || row.flags.length === 0 ? (
                                        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-400">
                                            No active flags for this employee on this date.
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                                {row.flags.map((flag) => (
                                                    <FlagPill
                                                        key={flag.id}
                                                        type={flag.flagType}
                                                        severity={flag.severity}
                                                        scoreImpact={flag.scoreImpact}
                                                    />
                                                ))}
                                            </div>

                                            <div className="space-y-2">
                                                {row.flags.map((flag) => (
                                                    <div
                                                        key={`msg-${flag.id}`}
                                                        className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                                                    >
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div className="text-sm font-semibold text-white">
                                                                {flag.flagType}
                                                            </div>
                                                            <div className="text-xs text-slate-500">
                                                                {flag.severity} • Impact {flag.scoreImpact ?? 0}
                                                            </div>
                                                        </div>
                                                        <div className="mt-1 text-sm text-slate-400">
                                                            {flag.message}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}