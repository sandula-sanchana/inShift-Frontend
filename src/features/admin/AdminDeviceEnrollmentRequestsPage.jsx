import React, { useEffect, useMemo, useState } from "react";
import {
    ShieldCheck,
    RefreshCw,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Search,
    Smartphone,
    User,
    Clock3
} from "lucide-react";
import { api } from "../../lib/api.js";
import { cn } from "../../lib/cn";

const BASE = "/v1/admin/device-enrollment";

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

function StatusBadge({ status }) {
    const tone =
        status === "PENDING"
            ? "bg-amber-500/10 text-amber-400 ring-amber-500/20"
            : status === "APPROVED"
                ? "bg-indigo-500/10 text-indigo-400 ring-indigo-500/20"
                : status === "COMPLETED"
                    ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                    : status === "REJECTED"
                        ? "bg-rose-500/10 text-rose-400 ring-rose-500/20"
                        : "bg-white/5 text-slate-300 ring-white/10";

    return (
        <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", tone)}>
            {status || "UNKNOWN"}
        </span>
    );
}

export default function AdminDeviceEnrollmentRequestsPage() {
    const [loading, setLoading] = useState(true);
    const [submittingId, setSubmittingId] = useState(null);
    const [error, setError] = useState(null);
    const [rows, setRows] = useState([]);
    const [query, setQuery] = useState("");

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`${BASE}/pending`);
            const data = unwrapApiResponse(res.data);
            setRows(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(getErrorMessage(e, "Failed to load device enrollment requests"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return rows;

        return rows.filter((r) =>
            String(r.employeeName || "").toLowerCase().includes(q) ||
            String(r.employeeId || "").toLowerCase().includes(q) ||
            String(r.requestedDeviceName || "").toLowerCase().includes(q) ||
            String(r.requestedUserAgent || "").toLowerCase().includes(q) ||
            String(r.status || "").toLowerCase().includes(q)
        );
    }, [rows, query]);

    const handleDecision = async (id, approve) => {
        try {
            setSubmittingId(id);
            await api.patch(`${BASE}/${id}/decision`, {
                approve,
                adminComment: approve ? "Approved by admin" : "Rejected by admin",
            });
            await loadData();
        } catch (e) {
            setError(getErrorMessage(e, approve ? "Failed to approve request" : "Failed to reject request"));
        } finally {
            setSubmittingId(null);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-8 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
                        <h1 className="text-3xl font-black tracking-tight text-white lg:text-4xl">
                            Device Enrollment Requests
                        </h1>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                        Review and control new passkey device registration requests.
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

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-2xl">
                <div>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
                        Search
                    </div>
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search employee, device, user-agent, or status..."
                            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-10 pr-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500/30"
                        />
                    </div>
                </div>
            </div>

            <div className="mt-8 space-y-4">
                {loading ? (
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400">
                        Loading device enrollment requests...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400">
                        No pending device enrollment requests found.
                    </div>
                ) : (
                    filtered.map((row) => (
                        <div
                            key={row.id}
                            className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-2xl"
                        >
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                <div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="text-lg font-bold text-white">
                                            {row.employeeName || "Unknown Employee"}
                                        </div>
                                        <div className="text-sm text-slate-500">
                                            #{row.employeeId || "--"}
                                        </div>
                                        <StatusBadge status={row.status} />
                                    </div>

                                    <div className="mt-2 grid gap-2 text-sm text-slate-400">
                                        <div className="flex items-center gap-2">
                                            <Smartphone className="h-4 w-4 text-slate-500" />
                                            <span>Requested Device: {row.requestedDeviceName || "--"}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock3 className="h-4 w-4 text-slate-500" />
                                            <span>Requested At: {row.createdAt || "--"}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-slate-500" />
                                            <span>Risk Impact: {row.riskScoreImpact ?? 0}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={() => handleDecision(row.id, true)}
                                        disabled={submittingId === row.id}
                                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        Approve
                                    </button>

                                    <button
                                        onClick={() => handleDecision(row.id, false)}
                                        disabled={submittingId === row.id}
                                        className="inline-flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm font-bold text-rose-400 transition hover:bg-rose-500/20 disabled:opacity-50"
                                    >
                                        <XCircle className="h-4 w-4" />
                                        Reject
                                    </button>
                                </div>
                            </div>

                            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                <div className="text-xs uppercase tracking-widest text-slate-500">User Agent</div>
                                <div className="mt-2 break-all text-sm text-slate-300">
                                    {row.requestedUserAgent || "--"}
                                </div>
                            </div>

                            {row.existingDeviceName && (
                                <div className="mt-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4">
                                    <div className="text-xs uppercase tracking-widest text-indigo-300">Current Active Device</div>
                                    <div className="mt-2 text-sm text-slate-200">
                                        {row.existingDeviceName}
                                    </div>
                                    {row.existingCredentialCreatedAt && (
                                        <div className="mt-1 text-xs text-slate-400">
                                            Registered At: {row.existingCredentialCreatedAt}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}