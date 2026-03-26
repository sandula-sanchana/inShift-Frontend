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
    Filter,
    TrendingUp,
    Flag,
    Loader2,
    Bot,
    Clock3,
    Monitor,
    Smartphone,
    Activity
} from "lucide-react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar
} from "recharts";
import { api } from "../../lib/api.js";
import { cn } from "../../lib/cn";

const INTEL_BASE = "/v1/admin/intelligence";
const AI_BASE = "/v1/admin/ai-risk";
const ANALYTICS_BASE = "/v1/admin/presence-analytics";

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

function RiskBadge({ highRisk, requiresReview }) {
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

function PriorityBadge({ value }) {
    const tone =
        value === "HIGH"
            ? "bg-rose-500/10 text-rose-400 ring-rose-500/20"
            : value === "MEDIUM"
                ? "bg-amber-500/10 text-amber-400 ring-amber-500/20"
                : "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20";

    return (
        <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", tone)}>
            {value || "LOW"}
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
            <div className="h-2 overflow-hidden rounded-full bg-white/5">
                <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${safe}%` }} />
            </div>
        </div>
    );
}

function SummaryTile({ title, value, icon: Icon, tone = "slate", subtitle }) {
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
                    {subtitle && <div className="mt-1 text-xs opacity-70">{subtitle}</div>}
                </div>
                <div className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.04]">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

function InsightCard({ title, value, subtitle, icon: Icon }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="text-xs uppercase tracking-widest text-slate-500">{title}</div>
                    <div className="mt-2 text-lg font-bold text-white">{value}</div>
                    <div className="mt-1 text-sm text-slate-400">{subtitle}</div>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

function ChartCard({ title, subtitle, children }) {
    return (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-2xl">
            <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    {title}
                </div>
                {subtitle && <div className="mt-1 text-sm text-slate-400">{subtitle}</div>}
            </div>
            <div className="mt-5 h-[300px]">{children}</div>
        </div>
    );
}

function EmptyState({ text = "No data available." }) {
    return (
        <div className="grid h-full place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm text-slate-400">
            {text}
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

    const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);

    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState(null);
    const [aiData, setAiData] = useState(null);

    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [analyticsError, setAnalyticsError] = useState(null);
    const [analyticsData, setAnalyticsData] = useState(null);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`${INTEL_BASE}/daily`, { params: { date } });
            const data = unwrapApiResponse(res.data);
            setRows(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(getErrorMessage(e, "Failed to load intelligence data"));
        } finally {
            setLoading(false);
        }
    };

    const loadAiAnalysis = async (employeeId) => {
        if (!employeeId) return;

        setSelectedEmployeeId(employeeId);
        setAiLoading(true);
        setAiError(null);
        setAiData(null);

        try {
            const res = await api.get(`${AI_BASE}/employee/${employeeId}`);
            const data = unwrapApiResponse(res.data);
            setAiData(data || null);
        } catch (e) {
            setAiError(getErrorMessage(e, "Failed to load AI risk analysis"));
        } finally {
            setAiLoading(false);
        }
    };

    const loadPresenceAnalytics = async (employeeId) => {
        if (!employeeId) return;

        setAnalyticsLoading(true);
        setAnalyticsError(null);
        setAnalyticsData(null);

        try {
            const res = await api.get(`${ANALYTICS_BASE}/employee/${employeeId}`);
            const data = unwrapApiResponse(res.data);
            setAnalyticsData(data || null);
        } catch (e) {
            setAnalyticsError(getErrorMessage(e, "Failed to load presence analytics"));
        } finally {
            setAnalyticsLoading(false);
        }
    };

    const analyzeEmployee = async (employeeId) => {
        if (!employeeId) return;
        await Promise.all([
            loadAiAnalysis(employeeId),
            loadPresenceAnalytics(employeeId)
        ]);
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

    const insights = useMemo(() => {
        const total = rows.length;

        const averageTrust = total === 0
            ? 0
            : Math.round(rows.reduce((sum, r) => sum + (r.trustScore ?? 0), 0) / total);

        const sortedByRisk = [...rows].sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0));
        const highestRiskEmployee = sortedByRisk[0] || null;

        const flagCounts = {};
        rows.forEach((row) => {
            (row.flags || []).forEach((flag) => {
                flagCounts[flag.flagType] = (flagCounts[flag.flagType] || 0) + 1;
            });
        });

        const mostCommonFlagEntry = Object.entries(flagCounts).sort((a, b) => b[1] - a[1])[0] || null;

        const topSuspicious = sortedByRisk
            .filter((r) => r.highRisk || r.requiresReview)
            .slice(0, 3);

        return {
            averageTrust,
            highestRiskEmployee,
            mostCommonFlag: mostCommonFlagEntry
                ? { type: mostCommonFlagEntry[0], count: mostCommonFlagEntry[1] }
                : null,
            topSuspicious,
        };
    }, [rows]);

    const aiInsight = aiData?.aiInsight || null;
    const analytics = analyticsData || null;

    const riskTrendData = useMemo(() => {
        if (!analytics?.riskTrendDates?.length || !analytics?.riskTrendScores?.length) return [];
        return analytics.riskTrendDates.map((dateValue, index) => ({
            date: dateValue,
            score: analytics.riskTrendScores[index] ?? 0
        }));
    }, [analytics]);

    const statusChartData = useMemo(() => {
        if (!analytics) return [];
        return [
            { name: "Responded", value: analytics.respondedCount ?? 0 },
            { name: "Late", value: analytics.lateCount ?? 0 },
            { name: "Missed", value: analytics.missedCount ?? 0 },
            { name: "Escalated", value: analytics.escalatedCount ?? 0 }
        ];
    }, [analytics]);

    const sourceChartData = useMemo(() => {
        if (!analytics) return [];
        return [
            { name: "Company PC", value: analytics.companyPcResponses ?? 0 },
            { name: "Mobile", value: analytics.mobileResponses ?? 0 }
        ];
    }, [analytics]);

    const delayChartData = useMemo(() => {
        if (!analytics) return [];
        return [
            { name: "Avg Delay", seconds: analytics.averageResponseDelaySeconds ?? 0 },
            { name: "Max Delay", seconds: analytics.maxResponseDelaySeconds ?? 0 },
            { name: "Min Delay", seconds: analytics.minResponseDelaySeconds ?? 0 }
        ];
    }, [analytics]);

    const responseDelayTrend = useMemo(() => {
        if (!analytics?.delayTrend?.length) return [];
        return analytics.delayTrend.map((item) => ({
            createdAt: new Date(item.createdAt).toLocaleDateString(),
            delay: item.responseDelaySeconds ?? 0,
            status: item.status
        }));
    }, [analytics]);

    const pieColors1 = ["#22c55e", "#f59e0b", "#ef4444", "#6366f1"];
    const pieColors2 = ["#6366f1", "#10b981"];

    return (
        <div className="animate-in slide-in-from-bottom-4 fade-in duration-700">
            <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-8 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
                        <h1 className="text-3xl font-black tracking-tight text-white lg:text-4xl">
                            Attendance Intelligence
                        </h1>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                        Review risk scores, trust levels, suspicious attendance patterns, AI insights, and presence behavior trends.
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

            <div className="mt-8 grid gap-4 xl:grid-cols-3">
                <InsightCard
                    title="Top Risk Employee"
                    value={insights.highestRiskEmployee?.employeeName || "—"}
                    subtitle={
                        insights.highestRiskEmployee
                            ? `Risk ${insights.highestRiskEmployee.riskScore ?? 0} • Trust ${insights.highestRiskEmployee.trustScore ?? 0}`
                            : "No evaluated employees for selected date"
                    }
                    icon={Siren}
                />

                <InsightCard
                    title="Most Common Flag"
                    value={insights.mostCommonFlag?.type || "—"}
                    subtitle={
                        insights.mostCommonFlag
                            ? `${insights.mostCommonFlag.count} occurrence(s)`
                            : "No active flags for selected date"
                    }
                    icon={Flag}
                />

                <InsightCard
                    title="Average Trust Score"
                    value={`${insights.averageTrust}/100`}
                    subtitle="Average trust across evaluated employees"
                    icon={TrendingUp}
                />
            </div>

            <div className="mt-8">
                <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Top Suspicious Cases
                </div>

                {insights.topSuspicious.length === 0 ? (
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400">
                        No suspicious cases for the selected date.
                    </div>
                ) : (
                    <div className="grid gap-4 xl:grid-cols-3">
                        {insights.topSuspicious.map((row) => (
                            <div
                                key={`top-${row.employeeId}-${row.attendanceDate}`}
                                className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-2xl"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-sm font-bold text-white">
                                            {row.employeeName}
                                        </div>
                                        <div className="mt-1 text-xs text-slate-500">
                                            #{row.employeeId}
                                        </div>
                                    </div>
                                    <RiskBadge
                                        highRisk={row.highRisk}
                                        requiresReview={row.requiresReview}
                                    />
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                    <div className="rounded-2xl bg-white/[0.03] p-3">
                                        <div className="text-xs text-slate-500">Risk</div>
                                        <div className="mt-1 text-xl font-black text-white">
                                            {row.riskScore ?? 0}
                                        </div>
                                    </div>
                                    <div className="rounded-2xl bg-white/[0.03] p-3">
                                        <div className="text-xs text-slate-500">Flags</div>
                                        <div className="mt-1 text-xl font-black text-white">
                                            {row.totalFlags ?? 0}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <ScoreBar trustScore={row.trustScore ?? 100} />
                                </div>

                                <button
                                    onClick={() => analyzeEmployee(row.employeeId)}
                                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-3 text-sm font-bold text-indigo-300 transition hover:bg-indigo-500/20"
                                >
                                    <Brain className="h-4 w-4" />
                                    Analyze with AI
                                </button>
                            </div>
                        ))}
                    </div>
                )}
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
                                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-indigo-500/30"
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
                                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500/30"
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
                                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-indigo-500/30"
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

            <div className="mt-8 rounded-3xl border border-indigo-500/20 bg-indigo-500/[0.04] p-6 backdrop-blur-2xl">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Bot className="h-5 w-5 text-indigo-300" />
                            <div className="text-lg font-black text-white">AI Risk Copilot</div>
                        </div>
                        <div className="mt-1 text-sm text-slate-400">
                            Use the employee cards below to generate AI guidance and full presence behavior analytics.
                        </div>
                    </div>

                    {selectedEmployeeId && (
                        <div className="text-xs uppercase tracking-widest text-slate-400">
                            Selected Employee #{selectedEmployeeId}
                        </div>
                    )}
                </div>

                {!selectedEmployeeId && (
                    <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
                        No employee selected yet. Click <span className="font-semibold text-white">Analyze with AI</span> on any employee card below.
                    </div>
                )}

                {(aiLoading || analyticsLoading) && (
                    <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading intelligence analysis...
                    </div>
                )}

                {aiError && (
                    <div className="mt-5 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-400">
                        {aiError}
                    </div>
                )}

                {analyticsError && (
                    <div className="mt-5 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-400">
                        {analyticsError}
                    </div>
                )}

                {selectedEmployeeId && !aiLoading && !analyticsLoading && (
                    <div className="mt-6 space-y-6">
                        {aiInsight && (
                            <>
                                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                                                AI Summary
                                            </div>
                                            <div className="mt-2 text-base font-semibold text-white">
                                                {aiInsight.summary}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <PriorityBadge value={aiInsight.monitoringPriority} />
                                            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-white/5 text-slate-300 ring-1 ring-white/10">
                                                {aiInsight.model || "AI"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-4 xl:grid-cols-2">
                                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                                        <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                                            Key Patterns
                                        </div>
                                        <div className="mt-4 space-y-2">
                                            {(aiInsight.keyPatterns || []).length === 0 ? (
                                                <div className="text-sm text-slate-400">No patterns returned.</div>
                                            ) : (
                                                aiInsight.keyPatterns.map((item, idx) => (
                                                    <div
                                                        key={`${item}-${idx}`}
                                                        className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300"
                                                    >
                                                        {item}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                                        <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                                            Recommended Actions
                                        </div>
                                        <div className="mt-4 space-y-2">
                                            {(aiInsight.recommendedActions || []).length === 0 ? (
                                                <div className="text-sm text-slate-400">No recommendations returned.</div>
                                            ) : (
                                                aiInsight.recommendedActions.map((item, idx) => (
                                                    <div
                                                        key={`${item}-${idx}`}
                                                        className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-200"
                                                    >
                                                        {item}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {analytics && (
                            <>
                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                    <InsightCard
                                        title="Employee"
                                        value={analytics.employeeName || "—"}
                                        subtitle={`#${analytics.employeeId}`}
                                        icon={ShieldCheck}
                                    />
                                    <InsightCard
                                        title="Presence Checks"
                                        value={analytics.totalPresenceChecks ?? 0}
                                        subtitle={`${analytics.respondedCount ?? 0} responded`}
                                        icon={Activity}
                                    />
                                    <InsightCard
                                        title="Late / Missed"
                                        value={`${analytics.lateCount ?? 0} / ${analytics.missedCount ?? 0}`}
                                        subtitle={`${analytics.escalatedCount ?? 0} escalated`}
                                        icon={AlertTriangle}
                                    />
                                    <InsightCard
                                        title="Avg Delay"
                                        value={`${analytics.averageResponseDelaySeconds ?? 0}s`}
                                        subtitle={`Max ${analytics.maxResponseDelaySeconds ?? 0}s`}
                                        icon={Clock3}
                                    />
                                </div>

                                <div className="grid gap-6 xl:grid-cols-2">
                                    <ChartCard
                                        title="Risk Score Trend"
                                        subtitle="Daily attendance risk score history"
                                    >
                                        {riskTrendData.length === 0 ? (
                                            <EmptyState text="No risk trend data available." />
                                        ) : (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={riskTrendData}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                                    <XAxis dataKey="date" stroke="#94a3b8" />
                                                    <YAxis stroke="#94a3b8" />
                                                    <Tooltip
                                                        contentStyle={{
                                                            background: "#0f172a",
                                                            border: "1px solid rgba(255,255,255,0.1)",
                                                            borderRadius: "12px",
                                                            color: "#fff"
                                                        }}
                                                    />
                                                    <Legend />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="score"
                                                        name="Risk Score"
                                                        stroke="#6366f1"
                                                        strokeWidth={3}
                                                        dot={{ r: 4 }}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        )}
                                    </ChartCard>

                                    <ChartCard
                                        title="Response Delay Trend"
                                        subtitle="Response speed across recent presence checks"
                                    >
                                        {responseDelayTrend.length === 0 ? (
                                            <EmptyState text="No response delay trend available." />
                                        ) : (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={responseDelayTrend}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                                    <XAxis dataKey="createdAt" stroke="#94a3b8" />
                                                    <YAxis stroke="#94a3b8" />
                                                    <Tooltip
                                                        contentStyle={{
                                                            background: "#0f172a",
                                                            border: "1px solid rgba(255,255,255,0.1)",
                                                            borderRadius: "12px",
                                                            color: "#fff"
                                                        }}
                                                    />
                                                    <Legend />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="delay"
                                                        name="Delay (s)"
                                                        stroke="#f43f5e"
                                                        strokeWidth={3}
                                                        dot={{ r: 4 }}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        )}
                                    </ChartCard>
                                </div>

                                <div className="grid gap-6 xl:grid-cols-3">
                                    <ChartCard
                                        title="Status Distribution"
                                        subtitle="Responded vs delayed vs missed"
                                    >
                                        {statusChartData.every((x) => !x.value) ? (
                                            <EmptyState text="No status distribution available." />
                                        ) : (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={statusChartData}
                                                        dataKey="value"
                                                        nameKey="name"
                                                        innerRadius={65}
                                                        outerRadius={100}
                                                        paddingAngle={3}
                                                    >
                                                        {statusChartData.map((entry, index) => (
                                                            <Cell key={entry.name} fill={pieColors1[index % pieColors1.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        contentStyle={{
                                                            background: "#0f172a",
                                                            border: "1px solid rgba(255,255,255,0.1)",
                                                            borderRadius: "12px",
                                                            color: "#fff"
                                                        }}
                                                    />
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        )}
                                    </ChartCard>

                                    <ChartCard
                                        title="Response Source Usage"
                                        subtitle="Trusted company PC vs mobile responses"
                                    >
                                        {sourceChartData.every((x) => !x.value) ? (
                                            <EmptyState text="No response source data available." />
                                        ) : (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={sourceChartData}
                                                        dataKey="value"
                                                        nameKey="name"
                                                        innerRadius={65}
                                                        outerRadius={100}
                                                        paddingAngle={3}
                                                    >
                                                        {sourceChartData.map((entry, index) => (
                                                            <Cell key={entry.name} fill={pieColors2[index % pieColors2.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        contentStyle={{
                                                            background: "#0f172a",
                                                            border: "1px solid rgba(255,255,255,0.1)",
                                                            borderRadius: "12px",
                                                            color: "#fff"
                                                        }}
                                                    />
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        )}
                                    </ChartCard>

                                    <ChartCard
                                        title="Delay Summary"
                                        subtitle="Average, max, and min response delay"
                                    >
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={delayChartData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                                <XAxis dataKey="name" stroke="#94a3b8" />
                                                <YAxis stroke="#94a3b8" />
                                                <Tooltip
                                                    contentStyle={{
                                                        background: "#0f172a",
                                                        border: "1px solid rgba(255,255,255,0.1)",
                                                        borderRadius: "12px",
                                                        color: "#fff"
                                                    }}
                                                />
                                                <Legend />
                                                <Bar dataKey="seconds" name="Seconds" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </ChartCard>
                                </div>

                                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-2xl">
                                    <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                                        Recent Presence Timeline
                                    </div>

                                    <div className="mt-5 space-y-3">
                                        {!analytics.recentPresenceChecks?.length ? (
                                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
                                                No recent presence checks available.
                                            </div>
                                        ) : (
                                            analytics.recentPresenceChecks.map((item) => (
                                                <div
                                                    key={item.presenceCheckId}
                                                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                                                >
                                                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                                                        <div>
                                                            <div className="text-sm font-bold text-white">
                                                                Check #{item.presenceCheckId}
                                                            </div>
                                                            <div className="mt-1 text-xs text-slate-500">
                                                                Created: {item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-wrap gap-2">
                                                            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-white/5 text-slate-300 ring-1 ring-white/10">
                                                                {item.status || "UNKNOWN"}
                                                            </span>
                                                            {item.responseSource && (
                                                                <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-indigo-500/10 text-indigo-300 ring-1 ring-indigo-500/20">
                                                                    {item.responseSource}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                                                        <div className="rounded-xl bg-white/[0.03] p-3">
                                                            <div className="text-[11px] uppercase tracking-widest text-slate-500">Trigger</div>
                                                            <div className="mt-1 text-sm font-semibold text-white">
                                                                {item.triggerReason || "—"}
                                                            </div>
                                                        </div>

                                                        <div className="rounded-xl bg-white/[0.03] p-3">
                                                            <div className="text-[11px] uppercase tracking-widest text-slate-500">Risk</div>
                                                            <div className="mt-1 text-sm font-semibold text-white">
                                                                {item.riskLevel || "—"}
                                                            </div>
                                                        </div>

                                                        <div className="rounded-xl bg-white/[0.03] p-3">
                                                            <div className="text-[11px] uppercase tracking-widest text-slate-500">Delay</div>
                                                            <div className="mt-1 text-sm font-semibold text-white">
                                                                {item.responseDelaySeconds != null ? `${item.responseDelaySeconds}s` : "—"}
                                                            </div>
                                                        </div>

                                                        <div className="rounded-xl bg-white/[0.03] p-3">
                                                            <div className="text-[11px] uppercase tracking-widest text-slate-500">Late</div>
                                                            <div className="mt-1 text-sm font-semibold text-white">
                                                                {item.lateResponse ? "Yes" : "No"}
                                                            </div>
                                                        </div>

                                                        <div className="rounded-xl bg-white/[0.03] p-3">
                                                            <div className="text-[11px] uppercase tracking-widest text-slate-500">Escalated</div>
                                                            <div className="mt-1 text-sm font-semibold text-white">
                                                                {item.escalated ? "Yes" : "No"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                    <InsightCard
                                        title="Company PC Responses"
                                        value={analytics.companyPcResponses ?? 0}
                                        subtitle="Trusted terminal confirmations"
                                        icon={Monitor}
                                    />
                                    <InsightCard
                                        title="Mobile Responses"
                                        value={analytics.mobileResponses ?? 0}
                                        subtitle="GPS mobile confirmations"
                                        icon={Smartphone}
                                    />
                                    <InsightCard
                                        title="Max Delay"
                                        value={`${analytics.maxResponseDelaySeconds ?? 0}s`}
                                        subtitle="Slowest response"
                                        icon={Clock3}
                                    />
                                    <InsightCard
                                        title="Min Delay"
                                        value={`${analytics.minResponseDelaySeconds ?? 0}s`}
                                        subtitle="Fastest response"
                                        icon={TrendingUp}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                )}
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

                                    <button
                                        onClick={() => analyzeEmployee(row.employeeId)}
                                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-3 text-sm font-bold text-indigo-300 transition hover:bg-indigo-500/20"
                                    >
                                        <Brain className="h-4 w-4" />
                                        Analyze with AI
                                    </button>
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