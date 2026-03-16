import React, { useEffect, useState } from "react";
import {
    ClipboardList,
    RefreshCw,
    AlertTriangle,
    CheckCircle2,
    XCircle
} from "lucide-react";
import { api } from "../../lib/api.js";
import { cn } from "../../lib/cn";

const CORR_BASE = "/v1/admin/attendance-corrections";

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

function formatDateTime(value) {
    if (!value) return "--";
    return new Date(value).toLocaleString();
}

function DecisionModal({ open, mode, note, setNote, onClose, onConfirm, busy }) {
    if (!open) return null;

    const isApprove = mode === "approve";

    return (
        <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0f172a] p-5 shadow-2xl">
                <div className="text-lg font-bold text-white">
                    {isApprove ? "Approve Request" : "Reject Request"}
                </div>
                <div className="mt-2 text-sm text-slate-400">
                    {isApprove
                        ? "Optional note for approval."
                        : "Decision note is required for rejection."}
                </div>

                <textarea
                    rows={4}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={isApprove ? "Optional admin note..." : "Enter rejection reason..."}
                    className="mt-4 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500/30"
                />

                <div className="mt-5 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={busy}
                        className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-white/[0.06] disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={busy}
                        className={cn(
                            "flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-50",
                            isApprove ? "bg-emerald-600 hover:bg-emerald-500" : "bg-rose-600 hover:bg-rose-500"
                        )}
                    >
                        {busy ? "Processing..." : isApprove ? "Approve" : "Reject"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AttendanceCorrectionsPage() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const [error, setError] = useState(null);
    const [info, setInfo] = useState(null);

    const [selected, setSelected] = useState(null);
    const [mode, setMode] = useState(null);
    const [note, setNote] = useState("");

    const loadPending = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`${CORR_BASE}/pending`);
            const data = unwrapApiResponse(res.data);
            setRequests(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(getErrorMessage(e, "Failed to load pending correction requests"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPending();
    }, []);

    const openDecision = (request, nextMode) => {
        setSelected(request);
        setMode(nextMode);
        setNote("");
    };

    const closeDecision = () => {
        setSelected(null);
        setMode(null);
        setNote("");
    };

    const submitDecision = async () => {
        if (!selected || !mode) return;

        if (mode === "reject" && !note.trim()) {
            setError("Decision note is required for rejection.");
            return;
        }

        setError(null);
        setInfo(null);
        setBusyId(selected.id);

        try {
            const url =
                mode === "approve"
                    ? `${CORR_BASE}/${selected.id}/approve`
                    : `${CORR_BASE}/${selected.id}/reject`;

            await api.put(url, { note: note.trim() || null });

            setInfo(`Correction request ${mode === "approve" ? "approved" : "rejected"} successfully.`);
            closeDecision();
            await loadPending();
        } catch (e) {
            setError(getErrorMessage(e, `Failed to ${mode} request`));
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-8 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
                        <h1 className="text-3xl font-black tracking-tight text-white lg:text-4xl">
                            Correction Requests
                        </h1>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                        Review employee attendance correction requests and approve or reject them with proper audit notes.
                    </p>
                </div>

                <button
                    onClick={loadPending}
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

            {info && (
                <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-400">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>{info}</p>
                    </div>
                </div>
            )}

            <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-xl backdrop-blur-2xl">
                <div className="mb-6 flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-indigo-300" />
                    <div className="text-lg font-bold text-white">Pending Requests</div>
                </div>

                {loading ? (
                    <div className="text-sm text-slate-400">Loading pending requests...</div>
                ) : requests.length === 0 ? (
                    <div className="text-sm text-slate-400">No pending correction requests.</div>
                ) : (
                    <div className="space-y-4">
                        {requests.map((r) => (
                            <div key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div>
                                        <div className="text-sm font-bold text-white">
                                            {r.employeeName} • {r.type}
                                        </div>
                                        <div className="mt-1 text-xs text-slate-500">
                                            Attendance Date: {r.attendanceDate || "--"}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openDecision(r, "approve")}
                                            disabled={busyId === r.id}
                                            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => openDecision(r, "reject")}
                                            disabled={busyId === r.id}
                                            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-4 text-sm text-slate-300">{r.reason}</div>

                                <div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-2 lg:grid-cols-4">
                                    <div>Requested IN: {formatDateTime(r.requestedCheckInTime)}</div>
                                    <div>Requested OUT: {formatDateTime(r.requestedCheckOutTime)}</div>
                                    <div>Created: {formatDateTime(r.createdAt)}</div>
                                    <div>Status: {r.status}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <DecisionModal
                open={!!selected && !!mode}
                mode={mode}
                note={note}
                setNote={setNote}
                onClose={closeDecision}
                onConfirm={submitDecision}
                busy={busyId != null}
            />
        </div>
    );
}