import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Clock3,
    RefreshCw,
    Loader2,
    User,
    CalendarDays,
    TimerReset,
    PlusCircle,
    ShieldCheck,
    Wallet,
    Search,
    X,
    Check,
    BriefcaseBusiness
} from "lucide-react";
import { api } from "../../lib/api.js";
import { Button } from "../../components/ui/Button.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card.jsx";
import { useToast } from "../../components/ui/toast-store.js";

function ToneBadge({ children, tone = "slate" }) {
    const tones = {
        emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
        amber: "border-amber-500/20 bg-amber-500/10 text-amber-300",
        rose: "border-rose-500/20 bg-rose-500/10 text-rose-300",
        cyan: "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
        indigo: "border-indigo-500/20 bg-indigo-500/10 text-indigo-300",
        slate: "border-white/10 bg-white/[0.05] text-slate-300",
    };

    return (
        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${tones[tone] || tones.slate}`}>
      {children}
    </span>
    );
}

function getStatusTone(status) {
    switch ((status || "").toUpperCase()) {
        case "ASSIGNED":
            return "indigo";
        case "ACCEPTED":
        case "APPROVED":
        case "PAID":
            return "emerald";
        case "DECLINED":
        case "REJECTED":
        case "CANCELLED":
            return "rose";
        case "SWAP_PENDING":
        case "PENDING":
            return "amber";
        default:
            return "slate";
    }
}

function formatDate(date) {
    if (!date) return "-";
    try {
        return new Date(date).toLocaleDateString();
    } catch {
        return date;
    }
}

function formatDateTime(value) {
    if (!value) return "-";
    try {
        return new Date(value).toLocaleString();
    } catch {
        return value;
    }
}

function formatTime(value) {
    if (!value) return "-";
    return String(value).slice(0, 5);
}

function StatCard({ title, value, hint, icon: Icon, tone = "indigo" }) {
    const tones = {
        indigo: "border-indigo-500/20 bg-indigo-500/5 text-indigo-300",
        emerald: "border-emerald-500/20 bg-emerald-500/5 text-emerald-300",
        amber: "border-amber-500/20 bg-amber-500/5 text-amber-300",
        cyan: "border-cyan-500/20 bg-cyan-500/5 text-cyan-300",
    };

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</div>
                    <div className="mt-3 text-2xl font-bold text-white">{value}</div>
                    <div className="mt-2 text-xs text-slate-400">{hint}</div>
                </div>

                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${tones[tone] || tones.indigo}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

function EmployeeSearchSelect({
                                  search,
                                  setSearch,
                                  options,
                                  loading,
                                  selectedEmployee,
                                  onSelect,
                                  onClear
                              }) {
    const [open, setOpen] = useState(false);
    const boxRef = useRef(null);

    useEffect(() => {
        function handleOutside(event) {
            if (!boxRef.current?.contains(event.target)) {
                setOpen(false);
            }
        }

        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, []);

    return (
        <div ref={boxRef} className="relative">
            <label className="mb-2 block text-sm font-semibold text-white">Employee</label>

            {!selectedEmployee ? (
                <>
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setOpen(true);
                            }}
                            onFocus={() => setOpen(true)}
                            placeholder="Search by emp code or employee name"
                            className="w-full rounded-2xl border border-white/10 bg-slate-900/40 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500/40"
                        />
                    </div>

                    {open && search.trim() && (
                        <div className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-white/10 bg-[#07111f] p-2 shadow-2xl">
                            {loading ? (
                                <div className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm text-slate-300">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Searching employees...
                                </div>
                            ) : options.length === 0 ? (
                                <div className="rounded-xl px-3 py-3 text-sm text-slate-400">
                                    No employees found.
                                </div>
                            ) : (
                                options.map((emp) => (
                                    <button
                                        key={emp.employeeId}
                                        type="button"
                                        onClick={() => {
                                            onSelect(emp);
                                            setOpen(false);
                                        }}
                                        className="flex w-full items-start justify-between rounded-xl px-3 py-3 text-left transition hover:bg-white/[0.05]"
                                    >
                                        <div>
                                            <div className="text-sm font-semibold text-white">{emp.empCode}</div>
                                            <div className="mt-1 text-sm text-slate-300">{emp.fullName}</div>
                                            <div className="mt-1 text-xs text-slate-500">{emp.email || "-"}</div>
                                        </div>
                                        <Check className="mt-1 h-4 w-4 text-slate-500" />
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </>
            ) : (
                <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="text-sm font-semibold text-white">{selectedEmployee.empCode}</div>
                            <div className="mt-1 text-sm text-slate-300">{selectedEmployee.fullName}</div>
                            <div className="mt-1 text-xs text-slate-400">{selectedEmployee.email || "-"}</div>
                        </div>

                        <button
                            type="button"
                            onClick={onClear}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AdminOvertime() {
    const toast = useToast((s) => s.push);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [creating, setCreating] = useState(false);

    const [assignments, setAssignments] = useState([]);

    const [employeeSearch, setEmployeeSearch] = useState("");
    const [employeeOptions, setEmployeeOptions] = useState([]);
    const [employeeSearchLoading, setEmployeeSearchLoading] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    const [form, setForm] = useState({
        otDate: "",
        startTime: "",
        endTime: "",
        breakMinutes: 0,
        reason: "",
    });

    async function loadAll(silent = false) {
        try {
            if (silent) setRefreshing(true);
            else setLoading(true);

            const res = await api.get("/v1/admin/ot");
            setAssignments(res?.data?.data || []);
        } catch (e) {
            toast({
                title: "Load failed",
                message: e?.response?.data?.message || "Could not load OT assignments.",
                variant: "error",
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
        loadAll();
    }, []);

    useEffect(() => {
        const q = employeeSearch.trim();

        if (!q || selectedEmployee) {
            setEmployeeOptions([]);
            return;
        }

        const timeout = setTimeout(async () => {
            try {
                setEmployeeSearchLoading(true);
                const res = await api.get(`/v1/admin/employees/search?q=${encodeURIComponent(q)}`);
                const data = res?.data?.data || [];
                setEmployeeOptions(data.filter((emp) => emp.active !== false));
            } catch {
                setEmployeeOptions([]);
            } finally {
                setEmployeeSearchLoading(false);
            }
        }, 300);

        return () => clearTimeout(timeout);
    }, [employeeSearch, selectedEmployee]);

    const stats = useMemo(() => {
        return {
            total: assignments.length,
            assigned: assignments.filter((a) => a.status === "ASSIGNED").length,
            accepted: assignments.filter((a) => a.status === "ACCEPTED").length,
            paid: assignments.filter((a) => a.status === "PAID").length,
        };
    }, [assignments]);

    function updateField(key, value) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    async function createOvertime(e) {
        e.preventDefault();

        if (!selectedEmployee?.employeeId) {
            toast({
                title: "Employee required",
                message: "Please search and select an employee first.",
                variant: "warning",
            });
            return;
        }

        try {
            setCreating(true);

            await api.post("/v1/admin/ot", {
                employeeId: selectedEmployee.employeeId,
                otDate: form.otDate,
                startTime: form.startTime,
                endTime: form.endTime,
                breakMinutes: Number(form.breakMinutes),
                reason: form.reason,
            });

            toast({
                title: "OT assigned",
                message: `Overtime assigned to ${selectedEmployee.empCode} successfully.`,
                variant: "success",
            });

            setForm({
                otDate: "",
                startTime: "",
                endTime: "",
                breakMinutes: 0,
                reason: "",
            });
            setEmployeeSearch("");
            setEmployeeOptions([]);
            setSelectedEmployee(null);

            await loadAll(true);
        } catch (e2) {
            toast({
                title: "Create failed",
                message: e2?.response?.data?.message || "Could not create overtime assignment.",
                variant: "error",
            });
        } finally {
            setCreating(false);
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="text-3xl font-black tracking-tight text-white">Overtime Management</div>
                    <div className="mt-2 text-sm text-slate-400">
                        Assign overtime, search employees by emp code, and review OT responses.
                    </div>
                </div>

                <Button variant="secondary" onClick={() => loadAll(true)} disabled={refreshing || loading}>
                    {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Refresh
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard title="Total OT" value={stats.total} hint="All overtime assignments" icon={Clock3} tone="indigo" />
                <StatCard title="Assigned" value={stats.assigned} hint="Awaiting employee action" icon={TimerReset} tone="amber" />
                <StatCard title="Accepted" value={stats.accepted} hint="Accepted by employees" icon={ShieldCheck} tone="emerald" />
                <StatCard title="Paid" value={stats.paid} hint="Closed and paid records" icon={Wallet} tone="cyan" />
            </div>

            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <Card className="border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-none">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-white">
                            <BriefcaseBusiness className="h-5 w-5" />
                            Create OT Assignment
                        </CardTitle>
                    </CardHeader>

                    <CardContent>
                        <form className="space-y-4" onSubmit={createOvertime}>
                            <EmployeeSearchSelect
                                search={employeeSearch}
                                setSearch={setEmployeeSearch}
                                options={employeeOptions}
                                loading={employeeSearchLoading}
                                selectedEmployee={selectedEmployee}
                                onSelect={setSelectedEmployee}
                                onClear={() => {
                                    setSelectedEmployee(null);
                                    setEmployeeSearch("");
                                    setEmployeeOptions([]);
                                }}
                            />

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-white">OT Date</label>
                                    <input
                                        type="date"
                                        value={form.otDate}
                                        onChange={(e) => updateField("otDate", e.target.value)}
                                        className="w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/40"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-white">Break Minutes</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.breakMinutes}
                                        onChange={(e) => updateField("breakMinutes", e.target.value)}
                                        className="w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/40"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-white">Start Time</label>
                                    <input
                                        type="time"
                                        value={form.startTime}
                                        onChange={(e) => updateField("startTime", e.target.value)}
                                        className="w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/40"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-white">End Time</label>
                                    <input
                                        type="time"
                                        value={form.endTime}
                                        onChange={(e) => updateField("endTime", e.target.value)}
                                        className="w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-white outline-none focus:border-indigo-500/40"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-white">Reason</label>
                                <textarea
                                    rows={5}
                                    value={form.reason}
                                    onChange={(e) => updateField("reason", e.target.value)}
                                    className="w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500/40"
                                    placeholder="Why is this overtime needed?"
                                    required
                                />
                            </div>

                            <Button type="submit" disabled={creating}>
                                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                                Assign Overtime
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-none">
                    <CardHeader>
                        <CardTitle className="text-white">All OT Assignments</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {loading ? (
                            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/40 p-5 text-slate-300">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading overtime assignments...
                            </div>
                        ) : assignments.length === 0 ? (
                            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-8 text-center">
                                <Clock3 className="mx-auto h-8 w-8 text-slate-500" />
                                <div className="mt-3 text-sm font-semibold text-white">No OT assignments yet</div>
                                <div className="mt-1 text-xs text-slate-400">Create a new assignment to get started.</div>
                            </div>
                        ) : (
                            assignments.map((item) => (
                                <div
                                    key={item.id}
                                    className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 backdrop-blur-sm"
                                >
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap gap-2">
                                                <ToneBadge tone={getStatusTone(item.status)}>{item.status}</ToneBadge>
                                                <ToneBadge tone="indigo">{item.employeeCode || "EMP"}</ToneBadge>
                                            </div>

                                            <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-slate-500" />
                                                    Employee: {item.employeeName}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <CalendarDays className="h-4 w-4 text-slate-500" />
                                                    OT Date: {formatDate(item.otDate)}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock3 className="h-4 w-4 text-slate-500" />
                                                    Time: {formatTime(item.startTime)} - {formatTime(item.endTime)}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <TimerReset className="h-4 w-4 text-slate-500" />
                                                    Duration: {item.durationMinutes} min
                                                </div>
                                            </div>

                                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                                                <div className="font-semibold text-white">Reason</div>
                                                <div className="mt-2 leading-6">{item.reason || "-"}</div>
                                            </div>

                                            {item.employeeResponseNote && (
                                                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200">
                                                    <div className="font-semibold">Employee response note</div>
                                                    <div className="mt-2 leading-6">{item.employeeResponseNote}</div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300 lg:w-[240px]">
                                            <div className="space-y-2">
                                                <div><span className="text-slate-500">Assigned by:</span> {item.assignedByName || "-"}</div>
                                                <div><span className="text-slate-500">Assigned at:</span> {formatDateTime(item.assignedAt)}</div>
                                                <div><span className="text-slate-500">Updated at:</span> {formatDateTime(item.updatedAt)}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}