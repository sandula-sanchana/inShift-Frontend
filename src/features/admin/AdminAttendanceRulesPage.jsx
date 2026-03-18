import React, { useEffect, useMemo, useState } from "react";
import {
    RefreshCw,
    AlertTriangle,
    Save,
    Search,
    Settings2,
    X,
    Pencil,
    CheckCircle2
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

function RuleSummaryStat({ label, value }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-xs uppercase tracking-widest text-slate-500">{label}</div>
            <div className="mt-2 text-2xl font-black text-white">{value}</div>
        </div>
    );
}

function EditRuleModal({ open, rule, onClose, onChange, onSave, saving }) {
    if (!open || !rule) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-3xl rounded-[2rem] border border-white/10 bg-[#0b1120] shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                    <div>
                        <div className="text-xl font-black text-white">Edit Attendance Rule</div>
                        <div className="mt-1 text-xs uppercase tracking-widest text-slate-500">
                            {rule.ruleKey}
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-6 px-6 py-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                                Rule Name
                            </label>
                            <input
                                value={rule.ruleName}
                                onChange={(e) => onChange("ruleName", e.target.value)}
                                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/30"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                                Enabled
                            </label>
                            <select
                                value={rule.enabled ? "true" : "false"}
                                onChange={(e) => onChange("enabled", e.target.value === "true")}
                                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/30"
                            >
                                <option value="true" className="text-slate-900">Enabled</option>
                                <option value="false" className="text-slate-900">Disabled</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                                Threshold Value
                            </label>
                            <input
                                type="number"
                                value={rule.thresholdValue}
                                onChange={(e) => onChange("thresholdValue", e.target.value)}
                                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/30"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                                Score Impact
                            </label>
                            <input
                                type="number"
                                value={rule.scoreImpact}
                                onChange={(e) => onChange("scoreImpact", e.target.value)}
                                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/30"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                                Severity
                            </label>
                            <select
                                value={rule.severity}
                                onChange={(e) => onChange("severity", e.target.value)}
                                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/30"
                            >
                                <option value="LOW" className="text-slate-900">LOW</option>
                                <option value="MEDIUM" className="text-slate-900">MEDIUM</option>
                                <option value="HIGH" className="text-slate-900">HIGH</option>
                                <option value="CRITICAL" className="text-slate-900">CRITICAL</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                            Description
                        </label>
                        <textarea
                            rows={4}
                            value={rule.description}
                            onChange={(e) => onChange("description", e.target.value)}
                            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/30"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-5">
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={onSave}
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-5 py-2.5 text-sm font-bold text-indigo-300 transition hover:bg-indigo-500/20 disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AdminAttendanceRulesPage() {
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState("");
    const [query, setQuery] = useState("");
    const [rules, setRules] = useState([]);
    const [selectedRule, setSelectedRule] = useState(null);

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

    const stats = useMemo(() => {
        return {
            total: rules.length,
            enabled: rules.filter((r) => r.enabled).length,
            disabled: rules.filter((r) => !r.enabled).length,
            criticalHigh: rules.filter((r) => ["HIGH", "CRITICAL"].includes(r.severity)).length,
        };
    }, [rules]);

    const openEditModal = (rule) => {
        setSelectedRule({ ...rule });
        setSuccess("");
        setError(null);
    };

    const closeEditModal = () => {
        if (savingId) return;
        setSelectedRule(null);
    };

    const updateSelectedRule = (field, value) => {
        setSelectedRule((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const saveRule = async () => {
        if (!selectedRule) return;

        setSavingId(selectedRule.id);
        setError(null);
        setSuccess("");

        try {
            await api.patch(`${RULES_BASE}/${selectedRule.id}`, {
                enabled: selectedRule.enabled,
                thresholdValue: Number(selectedRule.thresholdValue),
                scoreImpact: Number(selectedRule.scoreImpact),
                severity: selectedRule.severity,
                ruleName: selectedRule.ruleName,
                description: selectedRule.description,
            });

            setSuccess(`Rule updated: ${selectedRule.ruleName}`);
            setSelectedRule(null);
            await loadRules();
        } catch (e) {
            setError(getErrorMessage(e, "Failed to update rule"));
        } finally {
            setSavingId(null);
        }
    };

    return (
        <>
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
                            Configure intelligence thresholds, score impacts, severity levels, and rule activation.
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
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                            <p>{success}</p>
                        </div>
                    </div>
                )}

                <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <RuleSummaryStat label="Total Rules" value={stats.total} />
                    <RuleSummaryStat label="Enabled" value={stats.enabled} />
                    <RuleSummaryStat label="Disabled" value={stats.disabled} />
                    <RuleSummaryStat label="High/Critical" value={stats.criticalHigh} />
                </div>

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
                                className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-2xl transition hover:border-white/20"
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
                                            <span
                                                className={cn(
                                                    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
                                                    rule.enabled
                                                        ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                                                        : "bg-slate-500/10 text-slate-400 ring-slate-500/20"
                                                )}
                                            >
                                                {rule.enabled ? "Enabled" : "Disabled"}
                                            </span>
                                        </div>

                                        <p className="mt-3 text-sm text-slate-400">
                                            {rule.description || "No description available."}
                                        </p>

                                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                            <div className="rounded-2xl bg-white/[0.03] p-3">
                                                <div className="text-xs text-slate-500">Threshold</div>
                                                <div className="mt-1 text-xl font-black text-white">
                                                    {rule.thresholdValue ?? 0}
                                                </div>
                                            </div>
                                            <div className="rounded-2xl bg-white/[0.03] p-3">
                                                <div className="text-xs text-slate-500">Score Impact</div>
                                                <div className="mt-1 text-xl font-black text-white">
                                                    {rule.scoreImpact ?? 0}
                                                </div>
                                            </div>
                                            <div className="rounded-2xl bg-white/[0.03] p-3">
                                                <div className="text-xs text-slate-500">Severity</div>
                                                <div className="mt-1 text-xl font-black text-white">
                                                    {rule.severity || "N/A"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => openEditModal(rule)}
                                        className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-sm font-bold text-indigo-300 transition hover:bg-indigo-500/20"
                                    >
                                        <Pencil className="h-4 w-4" />
                                        Edit Rule
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <EditRuleModal
                open={!!selectedRule}
                rule={selectedRule}
                onClose={closeEditModal}
                onChange={updateSelectedRule}
                onSave={saveRule}
                saving={!!savingId}
            />
        </>
    );
}