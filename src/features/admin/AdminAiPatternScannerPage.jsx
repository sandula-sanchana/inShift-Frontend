import React, { useEffect, useMemo, useState } from "react";
import { ShieldCheck, RefreshCw, AlertTriangle, ChevronRight } from "lucide-react";
import { api } from "../../lib/api.js";

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

function PriorityBadge({ value }) {
    const cls =
        value === "HIGH"
            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
            : value === "MEDIUM"
                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${cls}`}>
      {value || "LOW"}
    </span>
    );
}

function StatCard({ title, value, subtitle }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{title}</p>
            <h3 className="mt-3 text-3xl font-black text-white">{value ?? 0}</h3>
            {subtitle ? <p className="mt-2 text-xs text-slate-400">{subtitle}</p> : null}
        </div>
    );
}

function RiskMiniBars({ scores = [] }) {
    if (!scores.length) {
        return <div className="text-xs text-slate-500">No risk data</div>;
    }

    const max = Math.max(...scores, 1);

    return (
        <div className="flex h-20 items-end gap-1">
            {scores.slice(-10).map((score, i) => (
                <div
                    key={i}
                    className="w-4 rounded-t bg-indigo-400/80"
                    style={{ height: `${Math.max(8, (score / max) * 100)}%` }}
                    title={`${score}`}
                />
            ))}
        </div>
    );
}

export default function AdminAiPatternScannerPage() {
    const [days, setDays] = useState(30);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [dashboard, setDashboard] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    const suspiciousEmployees = useMemo(
        () => dashboard?.suspiciousEmployees || [],
        [dashboard]
    );

    const runScan = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.post(`/v1/admin/ai-pattern-scanner/run?days=${days}`);
            const data = unwrapApiResponse(res.data);
            setDashboard(data || null);

            const first = data?.suspiciousEmployees?.[0];
            if (first?.employeeId) {
                loadEmployeeDetail(first.employeeId, days);
            } else {
                setSelectedEmployee(null);
            }
        } catch (e) {
            setError(getErrorMessage(e, "Failed to run AI pattern scan"));
        } finally {
            setLoading(false);
        }
    };

    const loadEmployeeDetail = async (employeeId, scanDays = days) => {
        setDetailLoading(true);
        try {
            const res = await api.get(`/v1/admin/ai-pattern-scanner/employee/${employeeId}?days=${scanDays}`);
            const data = unwrapApiResponse(res.data);
            setSelectedEmployee(data || null);
        } catch (e) {
            setError(getErrorMessage(e, "Failed to load employee AI detail"));
        } finally {
            setDetailLoading(false);
        }
    };

    useEffect(() => {
        runScan();
    }, []);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-8 rounded-full bg-indigo-500" />
                        <h1 className="text-3xl font-black tracking-tight text-white lg:text-4xl">
                            AI Pattern Scanner
                        </h1>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                        Company-wide suspicious attendance and presence behavior analysis.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none"
                    >
                        <option value={7}>Last 7 days</option>
                        <option value={14}>Last 14 days</option>
                        <option value={30}>Last 30 days</option>
                    </select>

                    <button
                        onClick={runScan}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/10 disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        Run Scan
                    </button>
                </div>
            </header>

            {error ? (
                <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-400">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>{error}</p>
                    </div>
                </div>
            ) : null}

            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Employees Scanned"
                    value={dashboard?.summary?.totalEmployeesScanned ?? 0}
                    subtitle="Active employees included"
                />
                <StatCard
                    title="Suspicious Employees"
                    value={dashboard?.summary?.suspiciousEmployeeCount ?? 0}
                    subtitle="Surfaced by AI scanner"
                />
                <StatCard
                    title="High Priority"
                    value={dashboard?.summary?.highPriorityCount ?? 0}
                    subtitle="Needs closer review"
                />
                <StatCard
                    title="Medium Priority"
                    value={dashboard?.summary?.mediumPriorityCount ?? 0}
                    subtitle="Watch for trend growth"
                />
            </div>

            <div className="mt-8 grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
                <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-2xl">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5 text-indigo-400" />
                        <h2 className="text-lg font-black text-white">Suspicious Employees</h2>
                    </div>

                    <div className="mt-6 space-y-4">
                        {suspiciousEmployees.length === 0 ? (
                            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-sm text-slate-400">
                                No suspicious employees surfaced in this scan.
                            </div>
                        ) : (
                            suspiciousEmployees.map((emp) => (
                                <button
                                    key={emp.employeeId}
                                    onClick={() => loadEmployeeDetail(emp.employeeId)}
                                    className="w-full rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-left transition hover:bg-white/[0.05]"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-base font-bold text-white">{emp.employeeName}</h3>
                                            <p className="mt-1 text-sm text-slate-400">{emp.summary}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <PriorityBadge value={emp.monitoringPriority} />
                                            <ChevronRight className="h-4 w-4 text-slate-500" />
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {(emp.suspiciousPatterns || []).slice(0, 4).map((pattern, idx) => (
                                            <span
                                                key={idx}
                                                className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300"
                                            >
                        {pattern}
                      </span>
                                        ))}
                                    </div>

                                    <div className="mt-4 grid gap-3 sm:grid-cols-4">
                                        <div className="rounded-xl bg-black/20 p-3">
                                            <p className="text-[10px] uppercase tracking-widest text-slate-500">Missed</p>
                                            <p className="mt-1 text-lg font-bold text-white">{emp.missedCount ?? 0}</p>
                                        </div>
                                        <div className="rounded-xl bg-black/20 p-3">
                                            <p className="text-[10px] uppercase tracking-widest text-slate-500">Late</p>
                                            <p className="mt-1 text-lg font-bold text-white">{emp.lateCount ?? 0}</p>
                                        </div>
                                        <div className="rounded-xl bg-black/20 p-3">
                                            <p className="text-[10px] uppercase tracking-widest text-slate-500">Escalated</p>
                                            <p className="mt-1 text-lg font-bold text-white">{emp.escalatedCount ?? 0}</p>
                                        </div>
                                        <div className="rounded-xl bg-black/20 p-3">
                                            <p className="text-[10px] uppercase tracking-widest text-slate-500">Flags</p>
                                            <p className="mt-1 text-lg font-bold text-white">{emp.attendanceFlagCount ?? 0}</p>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </section>

                <section className="space-y-6">
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-2xl">
                        <h2 className="text-lg font-black text-white">AI Company Overview</h2>
                        <p className="mt-4 text-sm leading-7 text-slate-300">
                            {dashboard?.aiOverview?.overview || "No overview generated yet."}
                        </p>

                        <div className="mt-6 grid gap-4 md:grid-cols-3">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Top Patterns</h3>
                                <div className="mt-3 space-y-2">
                                    {(dashboard?.aiOverview?.topPatterns || []).map((item, idx) => (
                                        <div key={idx} className="rounded-xl bg-black/20 p-3 text-sm text-slate-300">{item}</div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Trend Highlights</h3>
                                <div className="mt-3 space-y-2">
                                    {(dashboard?.aiOverview?.trendHighlights || []).map((item, idx) => (
                                        <div key={idx} className="rounded-xl bg-black/20 p-3 text-sm text-slate-300">{item}</div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Admin Focus</h3>
                                <div className="mt-3 space-y-2">
                                    {(dashboard?.aiOverview?.recommendedAdminFocus || []).map((item, idx) => (
                                        <div key={idx} className="rounded-xl bg-black/20 p-3 text-sm text-slate-300">{item}</div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-2xl">
                        <h2 className="text-lg font-black text-white">Employee Detail</h2>

                        {detailLoading ? (
                            <p className="mt-4 text-sm text-slate-400">Loading employee detail...</p>
                        ) : !selectedEmployee ? (
                            <p className="mt-4 text-sm text-slate-400">Select an employee to inspect AI reasoning.</p>
                        ) : (
                            <>
                                <div className="mt-4 flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-base font-bold text-white">
                                            {selectedEmployee?.context?.employeeName}
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-400">
                                            {selectedEmployee?.insight?.summary}
                                        </p>
                                    </div>
                                    <PriorityBadge value={selectedEmployee?.insight?.monitoringPriority} />
                                </div>

                                <div className="mt-6">
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Risk Trend</h4>
                                    <div className="mt-4">
                                        <RiskMiniBars scores={selectedEmployee?.context?.dailyRiskScores || []} />
                                    </div>
                                </div>

                                <div className="mt-6 grid gap-4 md:grid-cols-3">
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Suspicious Patterns</h4>
                                        <div className="mt-3 space-y-2">
                                            {(selectedEmployee?.insight?.suspiciousPatterns || []).map((item, idx) => (
                                                <div key={idx} className="rounded-xl bg-black/20 p-3 text-sm text-slate-300">{item}</div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Why Suspicious</h4>
                                        <div className="mt-3 space-y-2">
                                            {(selectedEmployee?.insight?.whySuspicious || []).map((item, idx) => (
                                                <div key={idx} className="rounded-xl bg-black/20 p-3 text-sm text-slate-300">{item}</div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Recommended Actions</h4>
                                        <div className="mt-3 space-y-2">
                                            {(selectedEmployee?.insight?.recommendedActions || []).map((item, idx) => (
                                                <div key={idx} className="rounded-xl bg-black/20 p-3 text-sm text-slate-300">{item}</div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}