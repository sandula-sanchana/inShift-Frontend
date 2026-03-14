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
    CalendarClock,
    BadgeCheck,
    Users,
    FileSearch,
    ExternalLink,
    ChevronDown,
} from "lucide-react";

const BASE = "/v1/admin/attendance";
const EMP_BASE = "/v1/admin/employees"; // change if your employee endpoint differs

function cn(...classes) {
    return classes.filter(Boolean).join(" ");
}

function unwrapApiResponse(resData) {
    if (resData && typeof resData === "object" && "data" in resData) return resData.data;
    return resData;
}

function getErrorMessage(err, fallback = "Request failed") {
    const msgFromBackend =
        err?.response?.data?.message ||
        err?.response?.data?.msg ||
        err?.response?.data?.data?.message;

    if (msgFromBackend) return msgFromBackend;
    const status = err?.response?.status;
    if (status) return `${fallback} (${status})`;
    return err?.message || fallback;
}

function Pill({ children, tone = "slate" }) {
    const tones = {
        slate: "bg-slate-500/10 text-slate-400 border-slate-500/20",
        indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
        green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        yellow: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        red: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    };

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md",
                tones[tone]
            )}
        >
            {children}
        </span>
    );
}

function formatDateTime(value) {
    if (!value) return "--";
    return new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function EmptyState({ onRefresh }) {
    return (
        <div className="py-20 text-center rounded-[2.5rem] border-2 border-dashed border-white/5">
            <BadgeCheck className="h-12 w-12 text-slate-800 mx-auto mb-4" />
            <h4 className="text-xl font-bold text-slate-500">Queue is Clear</h4>
            <p className="text-sm text-slate-600 mt-2">
                No pending attendance requests require your attention.
            </p>
            <button
                onClick={onRefresh}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 active:scale-[0.98]"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-md rounded-[2rem] bg-slate-900 border border-white/10 shadow-2xl overflow-hidden">
                <div className="p-8 border-b border-white/5">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                            <XCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Reject Attendance</h3>
                            <p className="mt-1 text-sm text-slate-400">
                                {record ? (
                                    <>
                                        Rejecting punch for{" "}
                                        <span className="text-white font-semibold">{record.employeeName}</span>
                                    </>
                                ) : (
                                    "Please provide a reason."
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    <div>
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 block mb-2">
                            Rejection Reason
                        </label>
                        <div className="relative group">
                            <MessageSquare className="absolute left-4 top-4 h-5 w-5 text-slate-500 group-focus-within:text-rose-400 transition-colors" />
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                rows={4}
                                placeholder="e.g. Location mismatch, missing supervisor validation..."
                                className="w-full rounded-2xl bg-white/5 border border-white/10 pl-12 pr-4 py-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-rose-500/50 focus:ring-4 focus:ring-rose-500/10 transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => onConfirm(note)}
                            disabled={loading || !note.trim()}
                            className="flex-1 h-12 rounded-xl bg-rose-600 text-sm font-bold text-white hover:bg-rose-500 disabled:opacity-50 active:scale-95 transition-all shadow-lg shadow-rose-900/20"
                        >
                            {loading ? "Processing..." : "Confirm Rejection"}
                        </button>
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 h-12 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-white hover:bg-white/10 active:scale-95 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SummaryCard({ summary, loading, error }) {
    if (loading) {
        return (
            <div className="rounded-3xl border border-white/5 bg-white/5 backdrop-blur-md p-10 flex items-center justify-center">
                <RefreshCw className="h-6 w-6 text-indigo-400 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-6 text-sm text-rose-400 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5" />
                {error}
            </div>
        );
    }

    if (!summary) {
        return (
            <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-10 text-center border-dashed">
                <FileSearch className="h-10 w-10 text-slate-700 mx-auto mb-4" />
                <p className="text-sm text-slate-500 font-medium italic">
                    Select an employee and date to view their daily summary report.
                </p>
            </div>
        );
    }

    const tone =
        {
            PRESENT: "green",
            PRESENT_LATE: "yellow",
            PRESENT_EARLY_LEAVE: "red",
            PRESENT_OVERTIME: "indigo",
            INCOMPLETE: "yellow",
        }[summary.dayStatus] || "slate";

    return (
        <div className="rounded-[2.5rem] border border-white/10 bg-slate-900/40 backdrop-blur-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-500">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between border-b border-white/5 pb-8">
                <div>
                    <h3 className="text-2xl font-black text-white tracking-tight">
                        {summary.employeeName}
                    </h3>
                    <div className="mt-1 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-slate-500">
                        <span>#{summary.employeeId}</span>
                        <div className="h-1 w-1 rounded-full bg-slate-700" />
                        <span>{summary.branchName}</span>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <Pill tone={tone}>{(summary.dayStatus || "").replaceAll("_", " ")}</Pill>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
                        {summary.summaryDate}
                    </span>
                </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    {
                        label: "First Entry",
                        value: formatDateTime(summary.firstInTime),
                        icon: CalendarClock,
                        color: "text-emerald-400",
                    },
                    {
                        label: "Last Exit",
                        value: formatDateTime(summary.lastOutTime),
                        icon: Clock,
                        color: "text-rose-400",
                    },
                    {
                        label: "Daily Status",
                        value: summary.present ? "Present" : "Absent",
                        sub: summary.completed ? "Completed" : "Incomplete",
                        icon: BadgeCheck,
                        color: "text-indigo-400",
                    },
                    {
                        label: "Adjustments",
                        value: `${summary.lateMinutes ?? 0}m Late`,
                        sub: `${summary.overtimeMinutes ?? 0}m OT / ${summary.earlyLeaveMinutes ?? 0}m Early`,
                        icon: AlertTriangle,
                        color: "text-amber-400",
                    },
                ].map((item, i) => (
                    <div
                        key={i}
                        className="group rounded-[2rem] bg-white/[0.03] border border-white/5 p-6 transition-all hover:bg-white/[0.05] hover:border-white/10"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                {item.label}
                            </span>
                            <item.icon className={cn("h-4 w-4", item.color)} />
                        </div>
                        <div className="text-sm font-bold text-white mb-1">{item.value}</div>
                        {item.sub && (
                            <div className="text-[10px] font-medium text-slate-500 uppercase">
                                {item.sub}
                            </div>
                        )}
                    </div>
                ))}
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

    const [employees, setEmployees] = useState([]);
    const [employeeId, setEmployeeId] = useState("");
    const [summaryDate, setSummaryDate] = useState(new Date().toISOString().slice(0, 10));
    const [summary, setSummary] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryError, setSummaryError] = useState(null);

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

    const fetchEmployees = async () => {
        try {
            const res = await api.get(EMP_BASE);
            const list = unwrapApiResponse(res.data) || [];
            setEmployees(list);
        } catch (e) {
            console.error("Failed to load employees", e);
        }
    };

    const fetchSummary = async () => {
        if (!employeeId || !summaryDate) {
            setSummary(null);
            setSummaryError("Please select employee and date.");
            return;
        }

        setSummaryLoading(true);
        setSummaryError(null);

        try {
            const res = await api.get(`${BASE}/summary/employee/${employeeId}`, {
                params: { date: summaryDate },
            });
            setSummary(unwrapApiResponse(res.data));
        } catch (e) {
            setSummary(null);
            setSummaryError(getErrorMessage(e, "Failed to load attendance summary"));
        } finally {
            setSummaryLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
        fetchEmployees();
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
            if (employeeId) await fetchSummary();
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
            if (employeeId) await fetchSummary();
        } catch (e) {
            setError(getErrorMessage(e, "Reject failed"));
        } finally {
            setActingId(null);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-1 w-8 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.6)]" />
                        <h2 className="text-3xl font-black text-white tracking-tight">
                            Attendance Approvals
                        </h2>
                    </div>
                    <p className="text-sm text-slate-400">
                        Review web attendance punches and audit employee daily summaries.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="h-10 px-4 flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-widest">
                        <Clock className="h-4 w-4" />
                        {filtered.length} Pending
                    </div>
                    <button
                        onClick={fetchPending}
                        disabled={loading}
                        className="group h-10 px-4 flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold hover:bg-white/10 transition-all active:scale-95"
                    >
                        <RefreshCw
                            className={cn(
                                "h-4 w-4 transition-transform group-hover:rotate-180",
                                loading && "animate-spin"
                            )}
                        />
                        Refresh
                    </button>
                </div>
            </div>

            {(error || info) && (
                <div
                    className={cn(
                        "rounded-2xl border p-4 backdrop-blur-md animate-in slide-in-from-top-2 duration-300",
                        error
                            ? "border-rose-500/20 bg-rose-500/5 text-rose-400"
                            : "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
                    )}
                >
                    <div className="flex items-center gap-3 font-medium">
                        {error ? (
                            <AlertTriangle className="h-5 w-5" />
                        ) : (
                            <CheckCircle2 className="h-5 w-5" />
                        )}
                        {error || info}
                    </div>
                </div>
            )}

            <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.02] backdrop-blur-xl p-8 shadow-2xl">
                <div className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.2em] text-slate-500 mb-8">
                    <FileSearch className="h-5 w-5 text-indigo-400" />
                    Daily Summary Lookup
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_200px_auto]">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                            Select Employee
                        </label>
                        <div className="relative group">
                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                            <select
                                value={employeeId}
                                onChange={(e) => setEmployeeId(e.target.value)}
                                className="w-full h-12 appearance-none rounded-2xl bg-white/5 border border-white/10 pl-12 pr-10 text-sm text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all"
                            >
                                <option value="" className="bg-slate-900">
                                    Choose an employee...
                                </option>
                                {employees.map((emp) => (
                                    <option
                                        key={emp.employeeId}
                                        value={emp.employeeId}
                                        className="bg-slate-900"
                                    >
                                        {emp.fullName} (#{emp.employeeId})
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                            Target Date
                        </label>
                        <input
                            type="date"
                            value={summaryDate}
                            onChange={(e) => setSummaryDate(e.target.value)}
                            className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 px-4 text-sm text-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={fetchSummary}
                            disabled={summaryLoading || !employeeId}
                            className="h-12 w-full lg:w-auto px-8 rounded-2xl bg-indigo-600 text-sm font-black text-white hover:bg-indigo-500 shadow-xl shadow-indigo-900/20 active:scale-95 disabled:opacity-30 transition-all"
                        >
                            {summaryLoading ? "Loading..." : "Audit Day"}
                        </button>
                    </div>
                </div>

                <div className="mt-8">
                    <SummaryCard summary={summary} loading={summaryLoading} error={summaryError} />
                </div>
            </div>

            <div className="space-y-6">
                <div className="rounded-[2rem] bg-white/[0.03] border border-white/5 p-4 flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-white transition-colors" />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Find by employee name, ID or location..."
                            className="w-full h-12 rounded-xl bg-transparent border border-white/5 pl-12 pr-4 text-sm text-white placeholder:text-slate-600 outline-none focus:bg-white/[0.03] transition-all"
                        />
                    </div>

                    <div className="flex gap-2">
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="h-12 rounded-xl bg-white/5 border border-white/5 pl-10 pr-4 text-xs font-bold text-slate-400 outline-none hover:bg-white/10 appearance-none"
                            >
                                <option value="ALL">All Types</option>
                                <option value="IN">Entries Only</option>
                                <option value="OUT">Exits Only</option>
                            </select>
                        </div>

                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <select
                                value={sourceFilter}
                                onChange={(e) => setSourceFilter(e.target.value)}
                                className="h-12 rounded-xl bg-white/5 border border-white/5 pl-10 pr-4 text-xs font-bold text-slate-400 outline-none hover:bg-white/10 appearance-none"
                            >
                                <option value="ALL">All Sources</option>
                                <option value="WEB">Web Portal</option>
                            </select>
                        </div>
                    </div>
                </div>

                {loading && rows.length === 0 ? (
                    <div className="py-20 text-center animate-pulse">
                        <RefreshCw className="h-8 w-8 text-indigo-500 mx-auto mb-4 animate-spin" />
                        <p className="text-sm font-bold text-slate-600 tracking-widest uppercase">
                            Fetching queue...
                        </p>
                    </div>
                ) : filtered.length === 0 ? (
                    <EmptyState onRefresh={fetchPending} />
                ) : (
                    <div className="grid gap-6">
                        {filtered.map((r) => {
                            const mapsUrl =
                                r.lat != null && r.lng != null
                                    ? `https://www.google.com/maps?q=${r.lat},${r.lng}`
                                    : null;

                            return (
                                <div
                                    key={r.id}
                                    className="group relative rounded-[2rem] border border-white/5 bg-white/[0.02] p-6 transition-all hover:bg-white/[0.04] hover:border-white/20"
                                >
                                    <div className="flex flex-col lg:flex-row gap-6 lg:items-center">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                                <h4 className="text-lg font-black text-white">
                                                    {r.employeeName}
                                                </h4>
                                                <span className="text-xs font-bold text-slate-600">
                                                    #{r.employeeId}
                                                </span>
                                                <div className="flex gap-2">
                                                    <Pill tone={r.type === "IN" ? "green" : "red"}>
                                                        {r.type}
                                                    </Pill>
                                                    <Pill tone="indigo">{r.source}</Pill>
                                                    {r.attendanceMark && (
                                                        <Pill tone="yellow">{r.attendanceMark}</Pill>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid sm:grid-cols-2 gap-4 text-xs font-bold text-slate-400">
                                                <div className="flex items-center gap-2">
                                                    <CalendarClock className="h-4 w-4 text-indigo-400" />
                                                    {formatDateTime(r.eventTime)}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-rose-400" />
                                                    {r.branchName}
                                                </div>
                                            </div>

                                            {r.locationText && (
                                                <div className="mt-3 text-sm text-slate-300">
                                                    <span className="font-semibold text-slate-400">Location:</span>{" "}
                                                    {r.locationText}
                                                </div>
                                            )}

                                            {r.reason && (
                                                <div className="mt-4 p-4 rounded-2xl bg-slate-900/50 border border-white/5 text-sm text-slate-300 italic">
                                                    <span className="text-[10px] font-black uppercase text-indigo-400 block mb-1">
                                                        Employee Note:
                                                    </span>
                                                    "{r.reason}"
                                                </div>
                                            )}

                                            {mapsUrl && (
                                                <a
                                                    href={mapsUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-white transition-colors"
                                                >
                                                    <ExternalLink className="h-3 w-3" />
                                                    Verify Geolocation
                                                </a>
                                            )}
                                        </div>

                                        <div className="flex lg:flex-col xl:flex-row gap-3">
                                            <button
                                                onClick={() => approve(r.id)}
                                                disabled={actingId === r.id}
                                                className="flex-1 h-12 px-6 rounded-xl bg-white text-[#020617] text-xs font-black uppercase tracking-widest hover:bg-indigo-400 transition-all active:scale-95 disabled:opacity-50"
                                            >
                                                {actingId === r.id ? "..." : "Approve"}
                                            </button>
                                            <button
                                                onClick={() => openReject(r)}
                                                disabled={actingId === r.id}
                                                className="flex-1 h-12 px-6 rounded-xl border border-rose-500/20 text-rose-400 text-xs font-black uppercase tracking-widest hover:bg-rose-500/10 transition-all active:scale-95 disabled:opacity-50"
                                            >
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