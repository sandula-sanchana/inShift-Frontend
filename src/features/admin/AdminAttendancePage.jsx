import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api.js";
import {
    CheckCircle2,
    XCircle,
    Clock,
    MapPin,
    RefreshCw,
    Search,
    Filter,
    AlertTriangle,
    MessageSquare,
    User,
    CalendarClock,
    BadgeCheck,
} from "lucide-react";

const BASE = "/v1/admin/attendance";

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

function Pill({ children, tone = "slate" }) {
    const tones = {
        slate: "bg-slate-100 text-slate-700 ring-slate-200",
        indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
        green: "bg-green-50 text-green-700 ring-green-200",
        yellow: "bg-yellow-50 text-yellow-800 ring-yellow-200",
        red: "bg-red-50 text-red-700 ring-red-200",
        purple: "bg-purple-50 text-purple-700 ring-purple-200",
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${tones[tone]}`}>
            {children}
        </span>
    );
}

function EmptyState({ onRefresh }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <Clock className="h-6 w-6" />
            </div>
            <div className="mt-4 text-lg font-bold text-slate-900">No pending attendance</div>
            <div className="mt-1 text-sm text-slate-500">
                You're all caught up. New Web punches will appear here for approval.
            </div>
            <button
                onClick={onRefresh}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 active:scale-[0.98]"
            >
                <RefreshCw className="h-4 w-4" />
                Refresh
            </button>
        </div>
    );
}

function RejectModal({ open, onClose, onConfirm, loading, record }) {
    const [note, setNote] = useState("");

    useEffect(() => {
        if (open) setNote("");
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-3xl bg-white shadow-xl ring-1 ring-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-xl bg-red-50 p-2 ring-1 ring-red-200 text-red-700">
                            <XCircle className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <div className="text-base font-bold text-slate-900">Reject attendance</div>
                            <div className="mt-1 text-sm text-slate-600">
                                {record ? (
                                    <>
                                        Reject <b>{record.employeeName}</b> • <b>{record.type}</b> •{" "}
                                        {new Date(record.eventTime).toLocaleString()}
                                    </>
                                ) : (
                                    "Provide a clear reason. The employee will see this message."
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-5">
                    <label className="text-xs font-bold text-slate-700">Decision note</label>
                    <div className="mt-1 relative">
                        <MessageSquare className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={4}
                            placeholder="Example: Location mismatch / No supervisor confirmation / Duplicate punch..."
                            className="w-full rounded-2xl border border-slate-200 pl-10 pr-3 py-3 text-sm outline-none focus:ring-2 focus:ring-red-100 focus:border-red-200"
                        />
                    </div>

                    <div className="mt-4 flex gap-3">
                        <button
                            onClick={() => onConfirm(note)}
                            disabled={loading || !note.trim()}
                            className="flex-1 rounded-2xl bg-red-600 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 active:scale-[0.98]"
                        >
                            {loading ? "Rejecting..." : "Reject"}
                        </button>
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 rounded-2xl bg-white py-2.5 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50 active:scale-[0.98]"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AdminAttendancePage() {
    const [loading, setLoading] = useState(false);
    const [actingId, setActingId] = useState(null);
    const [error, setError] = useState(null);
    const [info, setInfo] = useState(null);
    const [rows, setRows] = useState([]);

    const [q, setQ] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [sourceFilter, setSourceFilter] = useState("ALL");

    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectRecord, setRejectRecord] = useState(null);

    const fetchPending = async () => {
        setLoading(true);
        setError(null);
        setInfo(null);
        try {
            const res = await api.get(`${BASE}/pending`);
            setRows(unwrapApiResponse(res.data) || []);
        } catch (e) {
            setError(getErrorMessage(e, "Failed to load pending attendance"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const filtered = useMemo(() => {
        const query = q.trim().toLowerCase();
        return (rows || [])
            .filter((r) => (typeFilter === "ALL" ? true : r.type === typeFilter))
            .filter((r) => (sourceFilter === "ALL" ? true : r.source === sourceFilter))
            .filter((r) => {
                if (!query) return true;
                const hay = `${r.employeeName || ""} ${r.employeeId || ""} ${r.branchName || ""} ${r.type || ""} ${r.source || ""} ${r.attendanceMark || ""}`
                    .toLowerCase();
                return hay.includes(query);
            });
    }, [rows, q, typeFilter, sourceFilter]);

    const approve = async (id) => {
        setActingId(id);
        setError(null);
        setInfo(null);
        try {
            await api.post(`${BASE}/${id}/approve`);
            setRows((prev) => prev.filter((x) => x.id !== id));
            setInfo("Attendance approved.");
        } catch (e) {
            setError(getErrorMessage(e, "Approve failed"));
        } finally {
            setActingId(null);
        }
    };

    const openReject = (record) => {
        setRejectRecord(record);
        setRejectOpen(true);
    };

    const confirmReject = async (note) => {
        const id = rejectRecord?.id;
        if (!id) return;

        setActingId(id);
        setError(null);
        setInfo(null);

        try {
            await api.post(`${BASE}/${id}/reject`, { note: note.trim() });
            setRows((prev) => prev.filter((x) => x.id !== id));
            setInfo("Attendance rejected.");
            setRejectOpen(false);
            setRejectRecord(null);
        } catch (e) {
            setError(getErrorMessage(e, "Reject failed"));
        } finally {
            setActingId(null);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <div className="text-2xl font-bold tracking-tight text-slate-900">Attendance Approvals</div>
                    <div className="mt-1.5 text-sm text-slate-500">
                        Review Web attendance punches. Approve valid requests or reject with a note.
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Pill tone="yellow">
                        <Clock className="mr-1.5 h-3.5 w-3.5" />
                        Pending: {filtered.length}
                    </Pill>

                    <button
                        onClick={fetchPending}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50 active:scale-[0.98]"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 mt-0.5" />
                        <div>{error}</div>
                    </div>
                </div>
            )}

            {info && (
                <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                    <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5" />
                        <div>{info}</div>
                    </div>
                </div>
            )}

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Search employee / branch / mark..."
                                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-200"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
                            <Filter className="h-4 w-4 text-slate-500" />
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="bg-transparent text-sm font-semibold text-slate-700 outline-none"
                            >
                                <option value="ALL">All Types</option>
                                <option value="IN">IN</option>
                                <option value="OUT">OUT</option>
                            </select>
                        </div>

                        <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
                            <Filter className="h-4 w-4 text-slate-500" />
                            <select
                                value={sourceFilter}
                                onChange={(e) => setSourceFilter(e.target.value)}
                                className="bg-transparent text-sm font-semibold text-slate-700 outline-none"
                            >
                                <option value="ALL">All Sources</option>
                                <option value="WEB">WEB</option>
                                <option value="MOBILE">MOBILE</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6">
                {loading && rows.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-600">
                        Loading pending attendance...
                    </div>
                ) : filtered.length === 0 ? (
                    <EmptyState onRefresh={fetchPending} />
                ) : (
                    <div className="grid gap-4">
                        {filtered.map((r) => {
                            const timeStr = new Date(r.eventTime).toLocaleString();
                            const mapsUrl =
                                r.lat != null && r.lng != null ? `https://www.google.com/maps?q=${r.lat},${r.lng}` : null;

                            return (
                                <div
                                    key={r.id}
                                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <div className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
                                                    <User className="h-4 w-4 text-slate-500" />
                                                    {r.employeeName}
                                                    <span className="text-slate-400 font-semibold">#{r.employeeId}</span>
                                                </div>

                                                <Pill tone="yellow">PENDING</Pill>
                                                <Pill tone={r.source === "WEB" ? "indigo" : "purple"}>{r.source}</Pill>
                                                <Pill tone={r.type === "IN" ? "green" : "red"}>{r.type}</Pill>
                                                {r.attendanceMark && (
                                                    <Pill tone="slate">
                                                        <BadgeCheck className="mr-1 h-3.5 w-3.5" />
                                                        {r.attendanceMark}
                                                    </Pill>
                                                )}
                                            </div>

                                            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                                                <span className="inline-flex items-center gap-2">
                                                    <CalendarClock className="h-4 w-4 text-slate-400" />
                                                    {timeStr}
                                                </span>

                                                <span className="h-1 w-1 rounded-full bg-slate-300" />

                                                <span className="inline-flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-slate-400" />
                                                    {r.branchName}
                                                </span>
                                            </div>

                                            {r.locationText && (
                                                <div className="mt-2 text-sm text-slate-700">
                                                    <span className="font-semibold">Location:</span> {r.locationText}
                                                </div>
                                            )}

                                            {r.reason && (
                                                <div className="mt-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700 ring-1 ring-slate-200">
                                                    <span className="font-semibold">Employee reason:</span> {r.reason}
                                                </div>
                                            )}

                                            {r.decisionNote && (
                                                <div className="mt-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
                                                    <span className="font-semibold">Decision note:</span> {r.decisionNote}
                                                </div>
                                            )}

                                            {mapsUrl && (
                                                <a
                                                    href={mapsUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:text-indigo-800"
                                                >
                                                    <MapPin className="h-4 w-4" />
                                                    Open in Google Maps
                                                </a>
                                            )}
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-3 lg:justify-end">
                                            <button
                                                onClick={() => approve(r.id)}
                                                disabled={actingId === r.id}
                                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50 active:scale-[0.98]"
                                            >
                                                <CheckCircle2 className="h-4 w-4" />
                                                {actingId === r.id ? "Approving..." : "Approve"}
                                            </button>

                                            <button
                                                onClick={() => openReject(r)}
                                                disabled={actingId === r.id}
                                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-red-700 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-50 active:scale-[0.98]"
                                            >
                                                <XCircle className="h-4 w-4" />
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <RejectModal
                open={rejectOpen}
                record={rejectRecord}
                loading={actingId === rejectRecord?.id}
                onClose={() => {
                    if (actingId) return;
                    setRejectOpen(false);
                    setRejectRecord(null);
                }}
                onConfirm={confirmReject}
            />
        </div>
    );
}