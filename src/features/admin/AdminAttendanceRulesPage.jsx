import React, { useEffect, useMemo, useState } from "react";
import {
    RefreshCw,
    AlertTriangle,
    Save,
    Search,
    Settings2
} from "lucide-react";
import { api } from "../../lib/api.js";
import { cn } from "../../lib/cn";

const RULES_BASE = "/v1/admin/attendance-rules";

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

function SeverityBadge({ severity }) {
    const tone =
        severity === "CRITICAL" ? "bg-rose-500/10 text-rose-400 ring-rose-500/20" :
            severity === "HIGH" ? "bg-orange-500/10 text-orange-400 ring-orange-500/20" :
                severity === "MEDIUM" ? "bg-amber-500/10 text-amber-400 ring-amber-500/20" :
                    "bg-sky-500/10 text-sky-400 ring-sky-500/20";

    return (
        <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", tone)}>
            {severity || "N/A"}
        </span>
    );
}

export default function AdminAttendanceRulesPage() {
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState("");
    const [query, setQuery] = useState("");
    const [rules, setRules] = useState([]);

    const loadRules = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(RULES_BASE);
            const data = unwrapApiResponse(res.data);
            const list = Array.isArray(data) ? data : [];

            setRules(
                list.map((rule) => ({
                    ...rule,
                    enabled: !!rule.enabled,
                    thresholdValue: rule.thresholdValue ?? 0,
                    scoreImpact: rule.scoreImpact ?? 0,
                    severity: rule.severity ?? "LOW",
                    ruleName: rule.ruleName ?? "",
                    description: rule.description ?? "",
                }))
            );
        } catch (e) {
            setError(getErrorMessage(e, "Failed to load attendance rules"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRules();
    }, []);

    const filteredRules = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return rules;

        return rules.filter((rule) =>
            String(rule.ruleKey || "").toLowerCase().includes(q) ||
            String(rule.ruleName || "").toLowerCase().includes(q) ||
            String(rule.description || "").toLowerCase().includes(q) ||
            String(rule.severity || "").toLowerCase().includes(q)
        );
    }, [rules, query]);

    const updateLocalRule = (id, field, value) => {
        setRules((prev) =>
            prev.map((rule) =>
                rule.id === id ? { ...rule, [field]: value } : rule
            )
        );
    };

    const saveRule = async (rule) => {
        setSavingId(rule.id);
        setError(null);
        setSuccess("");

        try {
            await api.patch(`${RULES_BASE}/${rule.id}`, {
                enabled: rule.enabled,
                thresholdValue: Number(rule.thresholdValue),
                scoreImpact: Number(rule.scoreImpact),
                severity: rule.severity,
                ruleName: rule.ruleName,
                description: rule.description,
            });

            setSuccess(`Rule updated: ${rule.ruleName}`);
            await loadRules();
        } catch (e) {
            setError(getErrorMessage(e, "Failed to update rule"));
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-8 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
                        <h1 className="text-3xl font-black tracking-tight text-white lg:text-4xl">
                            Attendance Rules
                        </h1>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                        Configure thresholds, score impacts, severities, and rule activation for attendance intelligence.
                    </p>
                </div>

                <button
                    onClick={loadRules}
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

            {success && (
                <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-400">
                    {success}
                </div>
            )}

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-2xl">
                <div>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
                        Search Rules
                    </div>
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by key, name, description, or severity..."
                            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-10 pr-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500/30"
                        />
                    </div>
                </div>
            </div>

            <div className="mt-8 space-y-4">
                {loading ? (
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400">
                        Loading attendance rules...
                    </div>
                ) : filteredRules.length === 0 ? (
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400">
                        No attendance rules found.
                    </div>
                ) : (
                    filteredRules.map((rule) => (
                        <div
                            key={rule.id}
                            className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-2xl"
                        >
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-300">
                                            <Settings2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="text-lg font-bold text-white">
                                                {rule.ruleName}
                                            </div>
                                            <div className="text-xs uppercase tracking-widest text-slate-500">
                                                {rule.ruleKey}
                                            </div>
                                        </div>
                                        <SeverityBadge severity={rule.severity} />
                                    </div>

                                    <p className="mt-3 text-sm text-slate-400">
                                        {rule.description || "No description available."}
                                    </p>
                                </div>

                                <button
                                    onClick={() => saveRule(rule)}
                                    disabled={savingId === rule.id}
                                    className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-sm font-bold text-indigo-300 transition hover:bg-indigo-500/20 disabled:opacity-50"
                                >
                                    <Save className="h-4 w-4" />
                                    {savingId === rule.id ? "Saving..." : "Save"}
                                </button>
                            </div>

                            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                                        Enabled
                                    </label>
                                    <select
                                        value={rule.enabled ? "true" : "false"}
                                        onChange={(e) => updateLocalRule(rule.id, "enabled", e.target.value === "true")}
                                        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500/30"
                                    >
                                        <option value="true" className="text-slate-900">Enabled</option>
                                        <option value="false" className="text-slate-900">Disabled</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                                        Threshold
                                    </label>
                                    <input
                                        type="number"
                                        value={rule.thresholdValue}
                                        onChange={(e) => updateLocalRule(rule.id, "thresholdValue", e.target.value)}
                                        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500/30"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                                        Score Impact
                                    </label>
                                    <input
                                        type="number"
                                        value={rule.scoreImpact}
                                        onChange={(e) => updateLocalRule(rule.id, "scoreImpact", e.target.value)}
                                        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500/30"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                                        Severity
                                    </label>
                                    <select
                                        value={rule.severity}
                                        onChange={(e) => updateLocalRule(rule.id, "severity", e.target.value)}
                                        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500/30"
                                    >
                                        <option value="LOW" className="text-slate-900">LOW</option>
                                        <option value="MEDIUM" className="text-slate-900">MEDIUM</option>
                                        <option value="HIGH" className="text-slate-900">HIGH</option>
                                        <option value="CRITICAL" className="text-slate-900">CRITICAL</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                                        Rule Name
                                    </label>
                                    <input
                                        value={rule.ruleName}
                                        onChange={(e) => updateLocalRule(rule.id, "ruleName", e.target.value)}
                                        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500/30"
                                    />
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                                    Description
                                </label>
                                <textarea
                                    rows={3}
                                    value={rule.description}
                                    onChange={(e) => updateLocalRule(rule.id, "description", e.target.value)}
                                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500/30"
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}