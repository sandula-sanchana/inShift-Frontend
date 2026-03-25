import React, { useMemo, useState } from "react";
import {
    Brain,
    Search,
    Loader2,
    AlertTriangle,
    Activity,
    ShieldCheck,
    Clock3,
    Monitor,
    Smartphone,
    TrendingUp
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

const BASE = "/v1/admin/presence-analytics";

function unwrapApiResponse(resData) {
    if (resData && typeof resData === "object" && "data" in resData) return resData.data;
    return resData;
}

function getErrorMessage(err, fallback = "Request failed") {
    const msgFromBackend = err?.response?.data?.message || err?.response?.data?.msg;
    if (msgFromBackend) return msgFromBackend;
    return err?.message || fallback;
}

function MetricCard({ title, value, subtitle, icon: Icon, tone = "slate" }) {
    const toneMap = {
        slate: "border-white/10 bg-white/[0.03] text-slate-300",
        rose: "border-rose-500/20 bg-rose-500/5 text-rose-300",
        amber: "border-amber-500/20 bg-amber-500/5 text-amber-300",
        emerald: "border-emerald-500/20 bg-emerald-500/5 text-emerald-300",
        indigo: "border-indigo-500/20 bg-indigo-500/5 text-indigo-300"
    };

    return (
        <div className={cn("rounded-2xl border p-5", toneMap[tone])}>
            <div className="flex items-start justify-between gap-4">
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

export default function AdminPresenceAnalytics() {
    const [employeeId, setEmployeeId] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [data, setData] = useState(null);

    const loadAnalytics = async () => {
        if (!employeeId.trim()) {
            setError("Employee ID is required");
            return;
        }

        setLoading(true);
        setError("");
        setData(null);

        try {
            const res = await api.get(`${BASE}/employee/${employeeId.trim()}`);
            setData(unwrapApiResponse(res.data));
        } catch (e) {
            setError(getErrorMessage(e, "Failed to load presence analytics"));
        } finally {
            setLoading(false);
        }
    };

    const riskTrendData = useMemo(() => {
        if (!data?.riskTrendDates?.length || !data?.riskTrendScores?.length) return [];
        return data.riskTrendDates.map((date, index) => ({
            date,
            score: data.riskTrendScores[index] ?? 0
        }));
    }, [data]);

    const statusChartData = useMemo(() => {
        if (!data) return [];
        return [
            { name: "Responded", value: data.respondedCount ?? 0 },
            { name: "Late", value: data.lateCount ?? 0 },
            { name: "Missed", value: data.missedCount ?? 0 },
            { name: "Escalated", value: data.escalatedCount ?? 0 }
        ];
    }, [data]);

    const sourceChartData = useMemo(() => {
        if (!data) return [];
        return [
            { name: "Company PC", value: data.companyPcResponses ?? 0 },
            { name: "Mobile", value: data.mobileResponses ?? 0 }
        ];
    }, [data]);

    const delayChartData = useMemo(() => {
        if (!data) return [];
        return [
            { name: "Avg Delay", seconds: data.averageResponseDelaySeconds ?? 0 },
            { name: "Max Delay", seconds: data.maxResponseDelaySeconds ?? 0 },
            { name: "Min Delay", seconds: data.minResponseDelaySeconds ?? 0 }
        ];
    }, [data]);

    const responseDelayTrend = useMemo(() => {
        if (!data?.delayTrend?.length) return [];
        return data.delayTrend.map((item) => ({
            createdAt: new Date(item.createdAt).toLocaleDateString(),
            delay: item.responseDelaySeconds ?? 0,
            status: item.status
        }));
    }, [data]);

    const pieColors1 = ["#22c55e", "#f59e0b", "#ef4444", "#6366f1"];
    const pieColors2 = ["#6366f1", "#10b981"];

    return (
        <div className="animate-in slide-in-from-bottom-4 fade-in duration-700">
            <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-8 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
                        <h1 className="text-3xl font-black tracking-tight text-white lg:text-4xl">
                            Presence Analytics
                        </h1>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                        Analyze employee presence trends, delays, risk scores, source usage, and suspicious patterns.
                    </p>
                </div>
            </header>

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-2xl">
                <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                    <div>
                        <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
                            Employee ID
                        </div>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            <input
                                value={employeeId}
                                onChange={(e) => setEmployeeId(e.target.value)}
                                placeholder="Enter employee ID..."
                                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500/30"
                            />
                        </div>
                    </div>

                    <button
                        onClick={loadAnalytics}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 px-5 py-3 text-sm font-bold text-indigo-300 transition hover:bg-indigo-500/20 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                        Analyze
                    </button>
                </div>
            </div>

            {error && (
                <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-400">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>{error}</p>
                    </div>
                </div>
            )}

            {data && (
                <>
                    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <MetricCard
                            title="Employee"
                            value={data.employeeName || "—"}
                            subtitle={`#${data.employeeId}`}
                            icon={ShieldCheck}
                            tone="indigo"
                        />
                        <MetricCard
                            title="Presence Checks"
                            value={data.totalPresenceChecks ?? 0}
                            subtitle={`${data.respondedCount ?? 0} responded`}
                            icon={Activity}
                            tone="slate"
                        />
                        <MetricCard
                            title="Late / Missed"
                            value={`${data.lateCount ?? 0} / ${data.missedCount ?? 0}`}
                            subtitle={`${data.escalatedCount ?? 0} escalated`}
                            icon={AlertTriangle}
                            tone="amber"
                        />
                        <MetricCard
                            title="Avg Delay"
                            value={`${data.averageResponseDelaySeconds ?? 0}s`}
                            subtitle={`Max ${data.maxResponseDelaySeconds ?? 0}s`}
                            icon={Clock3}
                            tone="rose"
                        />
                    </div>

                    <div className="mt-8 grid gap-6 xl:grid-cols-2">
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

                    <div className="mt-8 grid gap-6 xl:grid-cols-3">
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

                    <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-2xl">
                        <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                            Recent Presence Timeline
                        </div>

                        <div className="mt-5 space-y-3">
                            {!data.recentPresenceChecks?.length ? (
                                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
                                    No recent presence checks available.
                                </div>
                            ) : (
                                data.recentPresenceChecks.map((item) => (
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

                    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <MetricCard
                            title="Company PC Responses"
                            value={data.companyPcResponses ?? 0}
                            subtitle="Trusted terminal confirmations"
                            icon={Monitor}
                            tone="indigo"
                        />
                        <MetricCard
                            title="Mobile Responses"
                            value={data.mobileResponses ?? 0}
                            subtitle="GPS mobile confirmations"
                            icon={Smartphone}
                            tone="emerald"
                        />
                        <MetricCard
                            title="Max Delay"
                            value={`${data.maxResponseDelaySeconds ?? 0}s`}
                            subtitle="Slowest response"
                            icon={Clock3}
                            tone="amber"
                        />
                        <MetricCard
                            title="Min Delay"
                            value={`${data.minResponseDelaySeconds ?? 0}s`}
                            subtitle="Fastest response"
                            icon={TrendingUp}
                            tone="slate"
                        />
                    </div>
                </>
            )}
        </div>
    );
}