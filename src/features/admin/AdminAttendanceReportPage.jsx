import React, { useMemo, useState } from "react";
import {
    ClipboardList,
    CalendarDays,
    Filter,
    RefreshCw,
    Search,
    Download,
    UserCheck,
    UserX,
    Clock3,
    TimerReset,
    AlertTriangle,
    Loader2
} from "lucide-react";
import { api } from "../../lib/api.js";
import { useToast } from "../../components/ui/toast-store.js";

const REPORT_BASE = "/v1/admin/attendance-report";
const EMPLOYEE_SEARCH_BASE = "/v1/admin/employees/search";

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

function StatCard({ title, value, subtitle, icon: Icon, tone = "slate" }) {
    const tones = {
        green: "from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20",
        red: "from-rose-500/20 to-rose-500/5 text-rose-400 border-rose-500/20",
        yellow: "from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20",
        indigo: "from-indigo-500/20 to-indigo-500/5 text-indigo-400 border-indigo-500/20",
        purple: "from-purple-500/20 to-purple-500/5 text-purple-400 border-purple-500/20",
        slate: "from-slate-500/20 to-slate-500/5 text-slate-400 border-slate-500/20",
    };

    const selectedTone = tones[tone] || tones.slate;

    return (
        <div className={cn(
            "relative overflow-hidden rounded-2xl border bg-slate-900/40 backdrop-blur-md p-5",
            selectedTone.split(" ").pop()
        )}>
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-100", selectedTone)} />
            <div className="relative z-10 flex items-start justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{title}</p>
                    <h3 className="mt-3 text-3xl font-bold tracking-tight text-white">{value ?? 0}</h3>
                    <p className="mt-2 text-xs text-slate-400">{subtitle}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

function Badge({ children, tone = "slate" }) {
    const tones = {
        green: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
        red: "bg-rose-500/10 text-rose-300 border-rose-500/20",
        yellow: "bg-amber-500/10 text-amber-300 border-amber-500/20",
        indigo: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
        purple: "bg-purple-500/10 text-purple-300 border-purple-500/20",
        cyan: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
        slate: "bg-white/5 text-slate-300 border-white/10",
    };

    return (
        <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold", tones[tone])}>
            {children}
        </span>
    );
}

function getStatusTone(status) {
    switch (status) {
        case "VALID":
            return "green";
        case "PENDING":
            return "yellow";
        case "REJECTED":
            return "red";
        default:
            return "slate";
    }
}

function getSourceTone(source) {
    switch (source) {
        case "MOBILE":
            return "indigo";
        case "WEB":
            return "purple";
        default:
            return "slate";
    }
}

function EmployeeLookupSelect({ value, onChange }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [open, setOpen] = useState(false);

    async function searchEmployees(q) {
        if (!q.trim()) {
            setResults([]);
            return;
        }

        try {
            setSearching(true);
            const res = await api.get(`${EMPLOYEE_SEARCH_BASE}?q=${encodeURIComponent(q)}`);
            const data = unwrapApiResponse(res.data) || [];
            setResults(data);
            setOpen(true);
        } catch {
            setResults([]);
        } finally {
            setSearching(false);
        }
    }

    return (
        <div className="relative">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Employee
            </label>

            {value ? (
                <div className="flex items-center justify-between rounded-2xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-3">
                    <div>
                        <div className="text-sm font-semibold text-white">{value.empCode}</div>
                        <div className="text-xs text-slate-300">{value.fullName}</div>
                    </div>
                    <button
                        type="button"
                        onClick={() => onChange(null)}
                        className="text-xs font-semibold text-slate-300 hover:text-white"
                    >
                        Clear
                    </button>
                </div>
            ) : (
                <>
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                        <input
                            value={query}
                            onChange={(e) => {
                                const q = e.target.value;
                                setQuery(q);
                                searchEmployees(q);
                            }}
                            onFocus={() => results.length > 0 && setOpen(true)}
                            placeholder="Search by emp code or name"
                            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500/30"
                        />
                    </div>

                    {open && (
                        <div className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-white/10 bg-[#0b1220] p-2 shadow-2xl">
                            {searching ? (
                                <div className="flex items-center gap-2 px-3 py-3 text-sm text-slate-300">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Searching...
                                </div>
                            ) : results.length === 0 ? (
                                <div className="px-3 py-3 text-sm text-slate-500">No employees found</div>
                            ) : (
                                results.map((emp) => (
                                    <button
                                        key={emp.employeeId}
                                        type="button"
                                        onClick={() => {
                                            onChange(emp);
                                            setQuery("");
                                            setResults([]);
                                            setOpen(false);
                                        }}
                                        className="block w-full rounded-xl px-3 py-3 text-left hover:bg-white/5"
                                    >
                                        <div className="text-sm font-semibold text-white">{emp.empCode}</div>
                                        <div className="text-xs text-slate-400">{emp.fullName}</div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default function AdminAttendanceReportPage() {
    const toast = useToast((s) => s.push);

    const today = new Date().toISOString().slice(0, 10);

    const [filters, setFilters] = useState({
        dateFrom: today,
        dateTo: today,
        branchId: "",
        status: "",
        source: "",
    });

    const [selectedEmployee, setSelectedEmployee] = useState(null);

    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState({
        summary: {
            totalRecords: 0,
            validCount: 0,
            pendingCount: 0,
            rejectedCount: 0,
            checkInCount: 0,
            checkOutCount: 0,
            lateCount: 0,
            earlyLeaveCount: 0,
            overtimeCount: 0,
        },
        rows: [],
    });

    async function fetchReport() {
        try {
            setLoading(true);

            const payload = {
                dateFrom: filters.dateFrom,
                dateTo: filters.dateTo,
                employeeId: selectedEmployee?.employeeId ?? null,
                branchId: filters.branchId ? Number(filters.branchId) : null,
                status: filters.status,
                source: filters.source,
            };

            const res = await api.post(REPORT_BASE, payload);
            const data = unwrapApiResponse(res.data);

            setReport(data || {
                summary: {
                    totalRecords: 0,
                    validCount: 0,
                    pendingCount: 0,
                    rejectedCount: 0,
                    checkInCount: 0,
                    checkOutCount: 0,
                    lateCount: 0,
                    earlyLeaveCount: 0,
                    overtimeCount: 0,
                },
                rows: [],
            });
        } catch (e) {
            toast({
                title: "Report failed",
                message: getErrorMessage(e, "Failed to load attendance report"),
                variant: "error",
            });
        } finally {
            setLoading(false);
        }
    }

    const summary = report?.summary || {};
    const rows = report?.rows || [];

    const branchOptions = useMemo(() => {
        const unique = new Map();
        rows.forEach((row) => {
            if (row.branchId != null && row.branchName) {
                unique.set(row.branchId, row.branchName);
            }
        });
        return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
    }, [rows]);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-8 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
                        <h1 className="text-3xl font-black tracking-tight text-white">Attendance Report</h1>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                        Filter, review, and prepare attendance records for export.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={fetchReport}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Generate Report
                    </button>

                    <button
                        type="button"
                        className="flex items-center gap-2 rounded-xl bg-indigo-500/15 border border-indigo-500/20 px-5 py-2.5 text-sm font-bold text-indigo-300 transition hover:bg-indigo-500/20"
                    >
                        <Download className="h-4 w-4" />
                        Export
                    </button>
                </div>
            </header>

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-2xl">
                <div className="mb-5 flex items-center gap-2">
                    <Filter className="h-4 w-4 text-indigo-400" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Report Filters</h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                            Date From
                        </label>
                        <input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))}
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/30"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                            Date To
                        </label>
                        <input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))}
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/30"
                        />
                    </div>

                    <EmployeeLookupSelect
                        value={selectedEmployee}
                        onChange={setSelectedEmployee}
                    />

                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                            Branch
                        </label>
                        <select
                            value={filters.branchId}
                            onChange={(e) => setFilters((p) => ({ ...p, branchId: e.target.value }))}
                            className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/30"
                        >
                            <option value="">All branches</option>
                            {branchOptions.map((branch) => (
                                <option key={branch.id} value={branch.id}>
                                    {branch.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                            Status
                        </label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
                            className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/30"
                        >
                            <option value="">All statuses</option>
                            <option value="VALID">VALID</option>
                            <option value="PENDING">PENDING</option>
                            <option value="REJECTED">REJECTED</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                            Source
                        </label>
                        <select
                            value={filters.source}
                            onChange={(e) => setFilters((p) => ({ ...p, source: e.target.value }))}
                            className="w-full rounded-2xl border border-white/10 bg-[#0b1220] px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/30"
                        >
                            <option value="">All sources</option>
                            <option value="MOBILE">MOBILE</option>
                            <option value="WEB">WEB</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard title="Total Records" value={summary.totalRecords} subtitle="All matching attendance rows" icon={ClipboardList} tone="indigo" />
                <StatCard title="Valid" value={summary.validCount} subtitle="Approved/valid entries" icon={UserCheck} tone="green" />
                <StatCard title="Rejected" value={summary.rejectedCount} subtitle="Rejected entries" icon={UserX} tone="red" />
                <StatCard title="Pending" value={summary.pendingCount} subtitle="Awaiting decision" icon={AlertTriangle} tone="yellow" />
                <StatCard title="Check In" value={summary.checkInCount} subtitle="IN records" icon={CalendarDays} tone="indigo" />
                <StatCard title="Check Out" value={summary.checkOutCount} subtitle="OUT records" icon={CalendarDays} tone="purple" />
                <StatCard title="Late Count" value={summary.lateCount} subtitle="Rows with late minutes" icon={Clock3} tone="yellow" />
                <StatCard title="Overtime Count" value={summary.overtimeCount} subtitle="Rows with overtime minutes" icon={TimerReset} tone="slate" />
            </div>

            <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-2xl overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                    <div>
                        <h2 className="text-lg font-bold text-white">Attendance Records</h2>
                        <p className="text-xs text-slate-500">Detailed rows for the selected report filters</p>
                    </div>
                    <Badge tone="indigo">{rows.length} rows</Badge>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-white/[0.03]">
                        <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                            <th className="px-6 py-4">Employee</th>
                            <th className="px-6 py-4">Branch</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Source</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Time</th>
                            <th className="px-6 py-4">Mark</th>
                            <th className="px-6 py-4">Late</th>
                            <th className="px-6 py-4">Early</th>
                            <th className="px-6 py-4">OT</th>
                            <th className="px-6 py-4">Verified</th>
                        </tr>
                        </thead>

                        <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="11" className="px-6 py-10 text-center text-slate-400">
                                    <div className="inline-flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading report...
                                    </div>
                                </td>
                            </tr>
                        ) : rows.length === 0 ? (
                            <tr>
                                <td colSpan="11" className="px-6 py-10 text-center text-slate-500">
                                    No attendance rows found for the selected filters.
                                </td>
                            </tr>
                        ) : (
                            rows.map((row) => (
                                <tr key={row.attendanceId} className="border-t border-white/5 text-slate-300">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-white">{row.employeeCode}</div>
                                        <div className="text-xs text-slate-500">{row.employeeName}</div>
                                    </td>
                                    <td className="px-6 py-4">{row.branchName}</td>
                                    <td className="px-6 py-4">{row.type}</td>
                                    <td className="px-6 py-4">
                                        <Badge tone={getSourceTone(row.source)}>{row.source}</Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge tone={getStatusTone(row.status)}>{row.status}</Badge>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {row.eventTime ? new Date(row.eventTime).toLocaleString() : "-"}
                                    </td>
                                    <td className="px-6 py-4">{row.attendanceMark || "-"}</td>
                                    <td className="px-6 py-4">{row.lateMinutes ?? 0}</td>
                                    <td className="px-6 py-4">{row.earlyLeaveMinutes ?? 0}</td>
                                    <td className="px-6 py-4">{row.overtimeMinutes ?? 0}</td>
                                    <td className="px-6 py-4">{row.verified ? "Yes" : "No"}</td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}