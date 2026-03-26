import React, { useEffect, useMemo, useState } from "react";
import {
    ShieldCheck,
    RefreshCw,
    AlertTriangle,
    XCircle,
    Search,
    Smartphone,
    User,
    Clock3,
    MonitorSmartphone,
    Laptop,
    ChevronRight,
    ShieldX,
    CheckCircle2,
    X,
    Fingerprint,
    Monitor,
    Eye,
} from "lucide-react";
import { api } from "../../lib/api.js";
import { cn } from "../../lib/cn";

const BASE = "/v1/admin/device-enrollment";
const DEVICE_BASE = "/v1/admin/devices";

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
                        : status === "REVOKED"
                            ? "bg-rose-500/10 text-rose-400 ring-rose-500/20"
                            : "bg-white/5 text-slate-300 ring-white/10";

    return (
        <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", tone)}>
            {status || "UNKNOWN"}
        </span>
    );
}

function TrustBadge({ value }) {
    if (!value) {
        return (
            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 bg-white/5 text-slate-300 ring-white/10">
                Not selected
            </span>
        );
    }

    const tone =
        value === "COMPANY_PC"
            ? "bg-indigo-500/10 text-indigo-300 ring-indigo-500/20"
            : "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20";

    return (
        <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", tone)}>
            {value}
        </span>
    );
}

function DeviceIcon({ trustType }) {
    if (trustType === "COMPANY_PC") return <Monitor className="h-4 w-4 text-indigo-300" />;
    return <Smartphone className="h-4 w-4 text-emerald-300" />;
}

function DeviceManagementDrawer({
                                    open,
                                    onClose,
                                    employeeId,
                                    employeeName,
                                    onRefreshParent,
                                }) {
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [error, setError] = useState(null);
    const [devices, setDevices] = useState([]);

    const loadDevices = async () => {
        if (!employeeId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`${DEVICE_BASE}/employee/${employeeId}`);
            const data = unwrapApiResponse(res.data);
            setDevices(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(getErrorMessage(e, "Failed to load employee devices"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open && employeeId) {
            loadDevices();
        }
    }, [open, employeeId]);

    const handleApprovePending = async (requestId, trustType) => {
        if (!requestId) return;
        try {
            setActionLoading(`approve-${requestId}-${trustType}`);
            await api.patch(`${BASE}/${requestId}/decision`, {
                approve: true,
                approvedTrustType: trustType,
                adminComment: `Approved as ${trustType}`,
            });
            await loadDevices();
            await onRefreshParent?.();
        } catch (e) {
            setError(getErrorMessage(e, "Failed to approve pending device"));
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectPending = async (requestId) => {
        if (!requestId) return;
        try {
            setActionLoading(`reject-${requestId}`);
            await api.patch(`${BASE}/${requestId}/decision`, {
                approve: false,
                adminComment: "Rejected by admin",
            });
            await loadDevices();
            await onRefreshParent?.();
        } catch (e) {
            setError(getErrorMessage(e, "Failed to reject pending device"));
        } finally {
            setActionLoading(null);
        }
    };

    const handleRevokeDevice = async (deviceId) => {
        if (!deviceId) return;
        const yes = window.confirm("Revoke this trusted device? The employee will need to register a new one.");
        if (!yes) return;

        try {
            setActionLoading(`revoke-${deviceId}`);
            await api.patch(`${DEVICE_BASE}/${deviceId}/revoke`, {
                reason: "Revoked by admin from device management panel",
            });
            await loadDevices();
            await onRefreshParent?.();
        } catch (e) {
            setError(getErrorMessage(e, "Failed to revoke device"));
        } finally {
            setActionLoading(null);
        }
    };

    const handleRestoreDevice = async (deviceId) => {
        if (!deviceId) return;
        const yes = window.confirm("Restore this revoked device back to approved?");
        if (!yes) return;

        try {
            setActionLoading(`restore-${deviceId}`);
            await api.patch(`${DEVICE_BASE}/${deviceId}/restore`, {
                reason: "Restored by admin from device management panel",
            });
            await loadDevices();
            await onRefreshParent?.();
        } catch (e) {
            setError(getErrorMessage(e, "Failed to restore device"));
        } finally {
            setActionLoading(null);
        }
    };

    const approvedDevices = devices.filter((d) => d.approvalStatus === "APPROVED");
    const pendingDevices = devices.filter((d) => d.approvalStatus === "PENDING");
    const otherDevices = devices.filter(
        (d) => d.approvalStatus !== "APPROVED" && d.approvalStatus !== "PENDING"
    );

    return (
        <>
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity",
                    open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            <aside
                className={cn(
                    "fixed right-0 top-0 z-50 h-full w-full max-w-2xl border-l border-white/10 bg-slate-950/95 backdrop-blur-2xl transition-transform duration-300",
                    open ? "translate-x-0" : "translate-x-full"
                )}
            >
                <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                                Device Management
                            </div>
                            <h2 className="mt-1 text-2xl font-black text-white">
                                {employeeName || `Employee #${employeeId || "--"}`}
                            </h2>
                            <p className="mt-1 text-sm text-slate-400">
                                View trusted devices, pending devices, and revoke, restore, or approve access.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={loadDevices}
                                disabled={loading}
                                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
                            >
                                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                                Refresh
                            </button>

                            <button
                                onClick={onClose}
                                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-6 py-6">
                        {error && (
                            <div className="mb-5 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-400">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                    <p>{error}</p>
                                </div>
                            </div>
                        )}

                        {loading ? (
                            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400">
                                Loading employee devices...
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <section>
                                    <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                                        Approved Devices
                                    </div>
                                    {approvedDevices.length === 0 ? (
                                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
                                            No approved devices found.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {approvedDevices.map((d) => (
                                                <div key={d.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                        <div className="min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <DeviceIcon trustType={d.approvedTrustType || d.requestedTrustType} />
                                                                <div className="text-base font-bold text-white">
                                                                    {d.deviceName || "Unknown Device"}
                                                                </div>
                                                                <StatusBadge status={d.approvalStatus} />
                                                                <TrustBadge value={d.approvedTrustType || d.requestedTrustType} />
                                                            </div>

                                                            <div className="mt-3 grid gap-2 text-sm text-slate-400">
                                                                <div className="flex items-center gap-2">
                                                                    <Fingerprint className="h-4 w-4 text-slate-500" />
                                                                    <span className="break-all">{d.deviceFingerprint || "--"}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Clock3 className="h-4 w-4 text-slate-500" />
                                                                    <span>Registered At: {d.createdAt || "--"}</span>
                                                                </div>
                                                                {d.reviewedAt && (
                                                                    <div className="flex items-center gap-2">
                                                                        <CheckCircle2 className="h-4 w-4 text-slate-500" />
                                                                        <span>Reviewed At: {d.reviewedAt}</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-slate-400 break-all">
                                                                {d.userAgent || "--"}
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-wrap gap-2">
                                                            <button
                                                                onClick={() => handleRevokeDevice(d.id)}
                                                                disabled={actionLoading === `revoke-${d.id}`}
                                                                className="inline-flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm font-bold text-rose-400 transition hover:bg-rose-500/20 disabled:opacity-50"
                                                            >
                                                                <ShieldX className="h-4 w-4" />
                                                                Revoke
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>

                                <section>
                                    <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                                        Pending Devices
                                    </div>
                                    {pendingDevices.length === 0 ? (
                                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
                                            No pending devices found.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {pendingDevices.map((d) => (
                                                <div key={d.id} className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                        <div className="min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <DeviceIcon trustType={d.requestedTrustType} />
                                                                <div className="text-base font-bold text-white">
                                                                    {d.deviceName || "Pending Device"}
                                                                </div>
                                                                <StatusBadge status={d.approvalStatus} />
                                                                <TrustBadge value={d.requestedTrustType} />
                                                            </div>

                                                            <div className="mt-3 grid gap-2 text-sm text-slate-400">
                                                                <div className="flex items-center gap-2">
                                                                    <Fingerprint className="h-4 w-4 text-slate-500" />
                                                                    <span className="break-all">{d.deviceFingerprint || "--"}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Clock3 className="h-4 w-4 text-slate-500" />
                                                                    <span>Created At: {d.createdAt || "--"}</span>
                                                                </div>
                                                                {d.requestId && (
                                                                    <div className="flex items-center gap-2">
                                                                        <ShieldCheck className="h-4 w-4 text-slate-500" />
                                                                        <span>Request ID: {d.requestId}</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-slate-400 break-all">
                                                                {d.userAgent || "--"}
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-wrap gap-2">
                                                            {d.requestId && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleApprovePending(d.requestId, "MOBILE")}
                                                                        disabled={actionLoading === `approve-${d.requestId}-MOBILE`}
                                                                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
                                                                    >
                                                                        <MonitorSmartphone className="h-4 w-4" />
                                                                        Approve Mobile
                                                                    </button>

                                                                    <button
                                                                        onClick={() => handleApprovePending(d.requestId, "COMPANY_PC")}
                                                                        disabled={actionLoading === `approve-${d.requestId}-COMPANY_PC`}
                                                                        className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-sm font-bold text-indigo-400 transition hover:bg-indigo-500/20 disabled:opacity-50"
                                                                    >
                                                                        <Laptop className="h-4 w-4" />
                                                                        Approve Company PC
                                                                    </button>

                                                                    <button
                                                                        onClick={() => handleRejectPending(d.requestId)}
                                                                        disabled={actionLoading === `reject-${d.requestId}`}
                                                                        className="inline-flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-sm font-bold text-rose-400 transition hover:bg-rose-500/20 disabled:opacity-50"
                                                                    >
                                                                        <XCircle className="h-4 w-4" />
                                                                        Reject
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>

                                <section>
                                    <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                                        Rejected / Revoked / Other Devices
                                    </div>
                                    {otherDevices.length === 0 ? (
                                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
                                            No historical device items found.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {otherDevices.map((d) => (
                                                <div key={d.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                        <div className="min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <DeviceIcon trustType={d.approvedTrustType || d.requestedTrustType} />
                                                                <div className="text-base font-bold text-white">
                                                                    {d.deviceName || "Device"}
                                                                </div>
                                                                <StatusBadge status={d.approvalStatus} />
                                                                <TrustBadge value={d.approvedTrustType || d.requestedTrustType} />
                                                            </div>

                                                            <div className="mt-3 grid gap-2 text-sm text-slate-400">
                                                                <div className="flex items-center gap-2">
                                                                    <Fingerprint className="h-4 w-4 text-slate-500" />
                                                                    <span className="break-all">{d.deviceFingerprint || "--"}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Clock3 className="h-4 w-4 text-slate-500" />
                                                                    <span>Created At: {d.createdAt || "--"}</span>
                                                                </div>
                                                            </div>

                                                            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-slate-400 break-all">
                                                                {d.userAgent || "--"}
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-wrap gap-2">
                                                            {d.approvalStatus === "REVOKED" && (
                                                                <button
                                                                    onClick={() => handleRestoreDevice(d.id)}
                                                                    disabled={actionLoading === `restore-${d.id}`}
                                                                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
                                                                >
                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                    Restore
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
}

export default function AdminDeviceEnrollmentRequestsPage() {
    const [loading, setLoading] = useState(true);
    const [submittingId, setSubmittingId] = useState(null);
    const [error, setError] = useState(null);
    const [rows, setRows] = useState([]);
    const [query, setQuery] = useState("");

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
    const [selectedEmployeeName, setSelectedEmployeeName] = useState("");

    const [lookupEmployeeId, setLookupEmployeeId] = useState("");

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
            String(r.status || "").toLowerCase().includes(q) ||
            String(r.deviceFingerprint || "").toLowerCase().includes(q) ||
            String(r.requestedTrustType || "").toLowerCase().includes(q)
        );
    }, [rows, query]);

    const handleDecision = async (id, approve, trustType = null) => {
        try {
            setSubmittingId(id);

            await api.patch(`${BASE}/${id}/decision`, {
                approve,
                approvedTrustType: trustType,
                adminComment: approve
                    ? `Approved as ${trustType}`
                    : "Rejected by admin",
            });

            await loadData();
        } catch (e) {
            setError(
                getErrorMessage(
                    e,
                    approve ? "Failed to approve request" : "Failed to reject request"
                )
            );
        } finally {
            setSubmittingId(null);
        }
    };

    const openManageDevices = (employeeId, employeeName) => {
        if (!employeeId) return;
        setSelectedEmployeeId(employeeId);
        setSelectedEmployeeName(employeeName || `Employee #${employeeId}`);
        setDrawerOpen(true);
    };

    const openLookupDrawer = () => {
        const id = Number(lookupEmployeeId);
        if (!id) {
            setError("Enter a valid employee ID to manage devices");
            return;
        }
        openManageDevices(id, `Employee #${id}`);
    };

    return (
        <>
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
                            Review pending device requests and manage full employee device access.
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

                <div className="mt-8 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-2xl">
                        <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
                            Search Pending Requests
                        </div>
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search employee, device, fingerprint, trust type, or status..."
                                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] pl-10 pr-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500/30"
                            />
                        </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-2xl">
                        <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
                            Quick Employee Device Lookup
                        </div>
                        <div className="flex gap-2">
                            <input
                                value={lookupEmployeeId}
                                onChange={(e) => setLookupEmployeeId(e.target.value)}
                                placeholder="Enter employee ID"
                                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500/30"
                            />
                            <button
                                onClick={openLookupDrawer}
                                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
                            >
                                <Eye className="h-4 w-4" />
                                Open
                            </button>
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
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <div className="text-lg font-bold text-white">
                                                {row.employeeName || "Unknown Employee"}
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                #{row.employeeId || "--"}
                                            </div>
                                            <StatusBadge status={row.status} />
                                            <TrustBadge value={row.requestedTrustType} />
                                        </div>

                                        <div className="mt-3 grid gap-2 text-sm text-slate-400">
                                            <div className="flex items-center gap-2">
                                                <Smartphone className="h-4 w-4 text-slate-500" />
                                                <span>Requested Device: {row.requestedDeviceName || "--"}</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <ShieldCheck className="h-4 w-4 text-slate-500" />
                                                <span>Requested Trust Type: {row.requestedTrustType || "--"}</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Clock3 className="h-4 w-4 text-slate-500" />
                                                <span>Requested At: {row.createdAt || "--"}</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-slate-500" />
                                                <span>Risk Impact: {row.riskScoreImpact ?? 0}</span>
                                            </div>

                                            {row.deviceFingerprint && (
                                                <div className="flex items-start gap-2">
                                                    <ShieldCheck className="mt-0.5 h-4 w-4 text-slate-500" />
                                                    <span className="break-all">
                                                        Device Fingerprint: {row.deviceFingerprint}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            onClick={() => openManageDevices(row.employeeId, row.employeeName)}
                                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                            Manage Devices
                                        </button>

                                        <button
                                            onClick={() => handleDecision(row.id, true, "MOBILE")}
                                            disabled={submittingId === row.id}
                                            className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
                                        >
                                            <MonitorSmartphone className="h-4 w-4" />
                                            Approve Mobile
                                        </button>

                                        <button
                                            onClick={() => handleDecision(row.id, true, "COMPANY_PC")}
                                            disabled={submittingId === row.id}
                                            className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-sm font-bold text-indigo-400 transition hover:bg-indigo-500/20 disabled:opacity-50"
                                        >
                                            <Laptop className="h-4 w-4" />
                                            Approve Company PC
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
                            </div>
                        ))
                    )}
                </div>
            </div>

            <DeviceManagementDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                employeeId={selectedEmployeeId}
                employeeName={selectedEmployeeName}
                onRefreshParent={loadData}
            />
        </>
    );
}