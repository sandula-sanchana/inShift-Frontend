import React, { useEffect, useMemo, useState } from "react";
import {
    FileEdit,
    Send,
    RefreshCw,
    AlertTriangle,
    CheckCircle2,
    Clock3,
    XCircle
} from "lucide-react";
import { api } from "../../lib/api.js";

const CORR_BASE = "/v1/emp/attendance-corrections";

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

function formatDateTime(value) {
    if (!value) return "--";
    return new Date(value).toLocaleString();
}

function StatusPill({ status }) {
    const styles =
        status === "APPROVED"
            ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
            : status === "REJECTED"
                ? "border border-rose-500/20 bg-rose-500/10 text-rose-300"
                : "border border-amber-500/20 bg-amber-500/10 text-amber-300";

    return (
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-md ${styles}`}>
            {status || "PENDING"}
        </span>
    );
}

function Field({ label, error, hint, children }) {
    return (
        <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</div>
            {children}
            {hint && <div className="mt-2 text-xs text-slate-500">{hint}</div>}
            {error && <div className="mt-2 text-xs text-rose-400">{error}</div>}
        </div>
    );
}

function validateForm(form) {
    const e = {};

    if (!form.attendanceDate) e.attendanceDate = "Attendance date is required";
    if (!form.type) e.type = "Correction type is required";
    if (!form.reason?.trim()) e.reason = "Reason is required";

    if (form.type === "MISSED_CHECK_IN" && !form.requestedCheckInTime) {
        e.requestedCheckInTime = "Actual check-in time is required";
    }

    if (form.type === "MISSED_CHECK_OUT" && !form.requestedCheckOutTime) {
        e.requestedCheckOutTime = "Actual check-out time is required";
    }

    if (form.type === "WRONG_TIME") {
        if (!form.requestedCheckInTime && !form.requestedCheckOutTime) {
            e.requestedCheckInTime = "Provide at least one corrected time";
            e.requestedCheckOutTime = "Provide at least one corrected time";
        }
    }

    return e;
}

function OverviewTile({ title, value, subtitle, icon: Icon, tone = "indigo" }) {
    const tones = {
        indigo: "border-indigo-500/20 text-indigo-300",
        emerald: "border-emerald-500/20 text-emerald-300",
        amber: "border-amber-500/20 text-amber-300",
        rose: "border-rose-500/20 text-rose-300",
    };

    return (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-white/20">
            <div className="relative z-10 flex items-start justify-between gap-4">
                <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        {title}
                    </div>
                    <div className="mt-3 text-2xl font-bold text-white">{value}</div>
                    {subtitle && (
                        <div className="mt-2 text-xs leading-5 text-slate-400">
                            {subtitle}
                        </div>
                    )}
                </div>

                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border bg-white/5 ${tones[tone]}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

export default function Corrections() {
    const [form, setForm] = useState({
        attendanceDate: "",
        type: "MISSED_CHECK_OUT",
        reason: "",
        requestedCheckInTime: "",
        requestedCheckOutTime: "",
    });

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [info, setInfo] = useState(null);
    const [errors, setErrors] = useState({});

    const typeOptions = useMemo(
        () => [
            { value: "MISSED_CHECK_IN", label: "Missed Check-In" },
            { value: "MISSED_CHECK_OUT", label: "Missed Check-Out" },
            { value: "WRONG_TIME", label: "Wrong Time" },
            { value: "LOCATION_ISSUE", label: "Location Issue" },
            { value: "OTHER", label: "Other" },
        ],
        []
    );

    const loadMyRequests = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`${CORR_BASE}/my`);
            const data = unwrapApiResponse(res.data);
            setRequests(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(getErrorMessage(e, "Failed to load correction requests"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMyRequests();
    }, []);

    const setField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

    const handleTypeChange = (value) => {
        setForm((prev) => {
            const next = {
                ...prev,
                type: value,
            };

            // Clear irrelevant fields when changing type
            if (value === "MISSED_CHECK_IN") {
                next.requestedCheckOutTime = "";
            } else if (value === "MISSED_CHECK_OUT") {
                next.requestedCheckInTime = "";
            } else if (value === "LOCATION_ISSUE" || value === "OTHER") {
                next.requestedCheckInTime = "";
                next.requestedCheckOutTime = "";
            }

            return next;
        });

        setErrors((prev) => ({
            ...prev,
            type: undefined,
            requestedCheckInTime: undefined,
            requestedCheckOutTime: undefined,
        }));
    };

    const resetForm = () => {
        setForm({
            attendanceDate: "",
            type: "MISSED_CHECK_OUT",
            reason: "",
            requestedCheckInTime: "",
            requestedCheckOutTime: "",
        });
        setErrors({});
    };

    const toDateTimeOrNull = (date, time) => {
        if (!date || !time) return null;
        return `${date}T${time}:00`;
    };

    const submitRequest = async () => {
        setError(null);
        setInfo(null);

        const v = validateForm(form);
        setErrors(v);

        if (Object.keys(v).length) {
            setError("Please fix the highlighted fields.");
            return;
        }

        const payload = {
            attendanceDate: form.attendanceDate,
            type: form.type,
            reason: form.reason.trim(),
            requestedCheckInTime: toDateTimeOrNull(form.attendanceDate, form.requestedCheckInTime),
            requestedCheckOutTime: toDateTimeOrNull(form.attendanceDate, form.requestedCheckOutTime),
        };

        try {
            setSubmitting(true);
            await api.post(CORR_BASE, payload);
            setInfo("Correction request submitted successfully.");
            resetForm();
            await loadMyRequests();
        } catch (e) {
            setError(getErrorMessage(e, "Failed to submit correction request"));
        } finally {
            setSubmitting(false);
        }
    };

    const showCheckInField =
        form.type === "MISSED_CHECK_IN" || form.type === "WRONG_TIME";

    const showCheckOutField =
        form.type === "MISSED_CHECK_OUT" || form.type === "WRONG_TIME";

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-8 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
                        <h1 className="text-3xl font-black tracking-tight text-white lg:text-4xl">
                            Attendance Corrections
                        </h1>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                        Submit a request when you missed a punch, entered the wrong time, or had a location issue.
                    </p>
                </div>

                <button
                    onClick={loadMyRequests}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-slate-200 backdrop-blur-md transition hover:bg-white/[0.08] disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </header>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                <OverviewTile
                    title="Request Type"
                    value={form.type.replaceAll("_", " ")}
                    subtitle="Current correction mode selected in the form"
                    icon={FileEdit}
                    tone="indigo"
                />
                <OverviewTile
                    title="Submitted Requests"
                    value={requests.length}
                    subtitle="Your correction history loaded from the system"
                    icon={Clock3}
                    tone="emerald"
                />
                <OverviewTile
                    title="Form Status"
                    value={submitting ? "Submitting" : "Ready"}
                    subtitle="Submit a new correction request when details are complete"
                    icon={Send}
                    tone="amber"
                />
                <OverviewTile
                    title="Attention"
                    value={error ? "Issue" : info ? "Updated" : "Normal"}
                    subtitle="Validation, success, and loading feedback appears here"
                    icon={error ? XCircle : info ? CheckCircle2 : AlertTriangle}
                    tone={error ? "rose" : info ? "emerald" : "amber"}
                />
            </div>

            {error && (
                <div className="mt-8 rounded-3xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-300 backdrop-blur-md">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10">
                            <AlertTriangle className="h-4 w-4" />
                        </div>
                        <div>{error}</div>
                    </div>
                </div>
            )}

            {info && (
                <div className="mt-8 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-300 backdrop-blur-md">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
                            <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <div>{info}</div>
                    </div>
                </div>
            )}

            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-300">
                            <FileEdit className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-white">Submit Request</div>
                            <div className="text-xs text-slate-500">Create a new attendance correction request</div>
                        </div>
                    </div>

                    <div className="mt-6 space-y-5">
                        <Field label="Attendance Date" error={errors.attendanceDate}>
                            <input
                                type="date"
                                value={form.attendanceDate}
                                onChange={(e) => setField("attendanceDate", e.target.value)}
                                className="w-full rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500/30 focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </Field>

                        <Field label="Correction Type" error={errors.type}>
                            <select
                                value={form.type}
                                onChange={(e) => handleTypeChange(e.target.value)}
                                className="w-full rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500/30 focus:ring-2 focus:ring-indigo-500/20"
                            >
                                {typeOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        {showCheckInField && (
                            <Field
                                label="Actual Check-In Time"
                                error={errors.requestedCheckInTime}
                                hint="Enter the time you actually checked in."
                            >
                                <input
                                    type="time"
                                    value={form.requestedCheckInTime}
                                    onChange={(e) => setField("requestedCheckInTime", e.target.value)}
                                    className="w-full rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500/30 focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </Field>
                        )}

                        {showCheckOutField && (
                            <Field
                                label="Actual Check-Out Time"
                                error={errors.requestedCheckOutTime}
                                hint="Enter the time you actually checked out."
                            >
                                <input
                                    type="time"
                                    value={form.requestedCheckOutTime}
                                    onChange={(e) => setField("requestedCheckOutTime", e.target.value)}
                                    className="w-full rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500/30 focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </Field>
                        )}

                        <Field
                            label="Reason"
                            error={errors.reason}
                            hint="Briefly explain what happened so the admin can review it."
                        >
                            <textarea
                                rows={4}
                                value={form.reason}
                                onChange={(e) => setField("reason", e.target.value)}
                                placeholder="Example: I forgot to check out before leaving office."
                                className="w-full rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500/30 focus:ring-2 focus:ring-indigo-500/20"
                            />
                        </Field>

                        <button
                            type="button"
                            onClick={submitRequest}
                            disabled={submitting}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-3 text-sm font-semibold text-indigo-200 backdrop-blur-md transition hover:bg-indigo-500/20 disabled:opacity-50"
                        >
                            <Send className="h-4 w-4" />
                            {submitting ? "Submitting..." : "Submit Correction Request"}
                        </button>
                    </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
                            <Clock3 className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-white">My Requests</div>
                            <div className="text-xs text-slate-500">View your submitted correction requests</div>
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        {loading ? (
                            <div className="rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-4 text-sm text-slate-400">
                                Loading requests...
                            </div>
                        ) : requests.length === 0 ? (
                            <div className="rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-4 text-sm text-slate-400">
                                No correction requests submitted yet.
                            </div>
                        ) : (
                            requests.map((r) => (
                                <div
                                    key={r.id}
                                    className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-md"
                                >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <div className="text-sm font-bold text-white">{r.type}</div>
                                            <div className="mt-1 text-xs text-slate-500">
                                                Date: {r.attendanceDate || "--"}
                                            </div>
                                        </div>
                                        <StatusPill status={r.status} />
                                    </div>

                                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-3 text-sm text-slate-300">
                                        {r.reason}
                                    </div>

                                    <div className="mt-4 grid gap-3 text-xs text-slate-500 sm:grid-cols-2">
                                        <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
                                            Requested IN: {formatDateTime(r.requestedCheckInTime)}
                                        </div>
                                        <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
                                            Requested OUT: {formatDateTime(r.requestedCheckOutTime)}
                                        </div>
                                        <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
                                            Created: {formatDateTime(r.createdAt)}
                                        </div>
                                        <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
                                            Decided: {formatDateTime(r.decidedAt)}
                                        </div>
                                    </div>

                                    {r.adminDecisionNote && (
                                        <div className="mt-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3 text-sm text-slate-300">
                                            <span className="font-semibold text-white">Admin Note:</span> {r.adminDecisionNote}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}





// import React, { useEffect, useMemo, useState } from "react";
// import {
//     FileEdit,
//     Send,
//     RefreshCw,
//     AlertTriangle,
//     CheckCircle2,
//     Clock3,
//     XCircle
// } from "lucide-react";
// import { api } from "../../lib/api.js";
//
// const CORR_BASE = "/v1/emp/attendance-corrections";
//
// function unwrapApiResponse(resData) {
//     if (resData && typeof resData === "object" && "data" in resData) return resData.data;
//     return resData;
// }
//
// function getErrorMessage(err, fallback = "Request failed") {
//     const msgFromBackend =
//         err?.response?.data?.message ||
//         err?.response?.data?.msg ||
//         err?.response?.data?.data?.message;
//
//     if (msgFromBackend) return msgFromBackend;
//     const status = err?.response?.status;
//     if (status) return `${fallback} (${status})`;
//     return err?.message || fallback;
// }
//
// function formatDateTime(value) {
//     if (!value) return "--";
//     return new Date(value).toLocaleString();
// }
//
// function StatusPill({ status }) {
//     const styles =
//         status === "APPROVED"
//             ? "bg-green-50 text-green-700 ring-green-200"
//             : status === "REJECTED"
//                 ? "bg-red-50 text-red-700 ring-red-200"
//                 : "bg-yellow-50 text-yellow-700 ring-yellow-200";
//
//     return (
//         <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${styles}`}>
//             {status || "PENDING"}
//         </span>
//     );
// }
//
// function Field({ label, error, hint, children }) {
//     return (
//         <div>
//             <div className="mb-1 text-xs font-semibold text-slate-600">{label}</div>
//             {children}
//             {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
//             {error && <div className="mt-1 text-xs text-rose-600">{error}</div>}
//         </div>
//     );
// }
//
// function validateForm(form) {
//     const e = {};
//
//     if (!form.attendanceDate) e.attendanceDate = "Attendance date is required";
//     if (!form.type) e.type = "Correction type is required";
//     if (!form.reason?.trim()) e.reason = "Reason is required";
//
//     if (form.type === "MISSED_CHECK_IN" && !form.requestedCheckInTime) {
//         e.requestedCheckInTime = "Actual check-in time is required";
//     }
//
//     if (form.type === "MISSED_CHECK_OUT" && !form.requestedCheckOutTime) {
//         e.requestedCheckOutTime = "Actual check-out time is required";
//     }
//
//     if (form.type === "WRONG_TIME") {
//         if (!form.requestedCheckInTime && !form.requestedCheckOutTime) {
//             e.requestedCheckInTime = "Provide at least one corrected time";
//             e.requestedCheckOutTime = "Provide at least one corrected time";
//         }
//     }
//
//     return e;
// }
//
// export default function Corrections() {
//     const [form, setForm] = useState({
//         attendanceDate: "",
//         type: "MISSED_CHECK_OUT",
//         reason: "",
//         requestedCheckInTime: "",
//         requestedCheckOutTime: "",
//     });
//
//     const [requests, setRequests] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [submitting, setSubmitting] = useState(false);
//     const [error, setError] = useState(null);
//     const [info, setInfo] = useState(null);
//     const [errors, setErrors] = useState({});
//
//     const typeOptions = useMemo(
//         () => [
//             { value: "MISSED_CHECK_IN", label: "Missed Check-In" },
//             { value: "MISSED_CHECK_OUT", label: "Missed Check-Out" },
//             { value: "WRONG_TIME", label: "Wrong Time" },
//             { value: "LOCATION_ISSUE", label: "Location Issue" },
//             { value: "OTHER", label: "Other" },
//         ],
//         []
//     );
//
//     const loadMyRequests = async () => {
//         setLoading(true);
//         setError(null);
//         try {
//             const res = await api.get(`${CORR_BASE}/my`);
//             const data = unwrapApiResponse(res.data);
//             setRequests(Array.isArray(data) ? data : []);
//         } catch (e) {
//             setError(getErrorMessage(e, "Failed to load correction requests"));
//         } finally {
//             setLoading(false);
//         }
//     };
//
//     useEffect(() => {
//         loadMyRequests();
//     }, []);
//
//     const setField = (key, value) => {
//         setForm((prev) => ({ ...prev, [key]: value }));
//         setErrors((prev) => ({ ...prev, [key]: undefined }));
//     };
//
//     const handleTypeChange = (value) => {
//         setForm((prev) => {
//             const next = {
//                 ...prev,
//                 type: value,
//             };
//
//             // Clear irrelevant fields when changing type
//             if (value === "MISSED_CHECK_IN") {
//                 next.requestedCheckOutTime = "";
//             } else if (value === "MISSED_CHECK_OUT") {
//                 next.requestedCheckInTime = "";
//             } else if (value === "LOCATION_ISSUE" || value === "OTHER") {
//                 next.requestedCheckInTime = "";
//                 next.requestedCheckOutTime = "";
//             }
//
//             return next;
//         });
//
//         setErrors((prev) => ({
//             ...prev,
//             type: undefined,
//             requestedCheckInTime: undefined,
//             requestedCheckOutTime: undefined,
//         }));
//     };
//
//     const resetForm = () => {
//         setForm({
//             attendanceDate: "",
//             type: "MISSED_CHECK_OUT",
//             reason: "",
//             requestedCheckInTime: "",
//             requestedCheckOutTime: "",
//         });
//         setErrors({});
//     };
//
//     const toDateTimeOrNull = (date, time) => {
//         if (!date || !time) return null;
//         return `${date}T${time}:00`;
//     };
//
//     const submitRequest = async () => {
//         setError(null);
//         setInfo(null);
//
//         const v = validateForm(form);
//         setErrors(v);
//
//         if (Object.keys(v).length) {
//             setError("Please fix the highlighted fields.");
//             return;
//         }
//
//         const payload = {
//             attendanceDate: form.attendanceDate,
//             type: form.type,
//             reason: form.reason.trim(),
//             requestedCheckInTime: toDateTimeOrNull(form.attendanceDate, form.requestedCheckInTime),
//             requestedCheckOutTime: toDateTimeOrNull(form.attendanceDate, form.requestedCheckOutTime),
//         };
//
//         try {
//             setSubmitting(true);
//             await api.post(CORR_BASE, payload);
//             setInfo("Correction request submitted successfully.");
//             resetForm();
//             await loadMyRequests();
//         } catch (e) {
//             setError(getErrorMessage(e, "Failed to submit correction request"));
//         } finally {
//             setSubmitting(false);
//         }
//     };
//
//     const showCheckInField =
//         form.type === "MISSED_CHECK_IN" || form.type === "WRONG_TIME";
//
//     const showCheckOutField =
//         form.type === "MISSED_CHECK_OUT" || form.type === "WRONG_TIME";
//
//     return (
//         <div>
//             <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
//                 <div>
//                     <div className="text-xl font-bold text-slate-900">Attendance Corrections</div>
//                     <div className="mt-2 text-sm text-slate-600">
//                         Submit a request when you missed a punch, entered the wrong time, or had a location issue.
//                     </div>
//                 </div>
//
//                 <button
//                     onClick={loadMyRequests}
//                     disabled={loading}
//                     className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
//                 >
//                     <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
//                     Refresh
//                 </button>
//             </div>
//
//             {error && (
//                 <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
//                     <div className="flex items-start gap-2">
//                         <AlertTriangle className="mt-0.5 h-4 w-4" />
//                         <div>{error}</div>
//                     </div>
//                 </div>
//             )}
//
//             {info && (
//                 <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
//                     <div className="flex items-start gap-2">
//                         <CheckCircle2 className="mt-0.5 h-4 w-4" />
//                         <div>{info}</div>
//                     </div>
//                 </div>
//             )}
//
//             <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
//                 <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
//                     <div className="flex items-center gap-2">
//                         <FileEdit className="h-5 w-5 text-slate-700" />
//                         <div className="text-lg font-bold text-slate-900">Submit Request</div>
//                     </div>
//
//                     <div className="mt-6 space-y-4">
//                         <Field label="Attendance Date" error={errors.attendanceDate}>
//                             <input
//                                 type="date"
//                                 value={form.attendanceDate}
//                                 onChange={(e) => setField("attendanceDate", e.target.value)}
//                                 className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
//                             />
//                         </Field>
//
//                         <Field label="Correction Type" error={errors.type}>
//                             <select
//                                 value={form.type}
//                                 onChange={(e) => handleTypeChange(e.target.value)}
//                                 className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
//                             >
//                                 {typeOptions.map((opt) => (
//                                     <option key={opt.value} value={opt.value}>
//                                         {opt.label}
//                                     </option>
//                                 ))}
//                             </select>
//                         </Field>
//
//                         {showCheckInField && (
//                             <Field
//                                 label="Actual Check-In Time"
//                                 error={errors.requestedCheckInTime}
//                                 hint="Enter the time you actually checked in."
//                             >
//                                 <input
//                                     type="time"
//                                     value={form.requestedCheckInTime}
//                                     onChange={(e) => setField("requestedCheckInTime", e.target.value)}
//                                     className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
//                                 />
//                             </Field>
//                         )}
//
//                         {showCheckOutField && (
//                             <Field
//                                 label="Actual Check-Out Time"
//                                 error={errors.requestedCheckOutTime}
//                                 hint="Enter the time you actually checked out."
//                             >
//                                 <input
//                                     type="time"
//                                     value={form.requestedCheckOutTime}
//                                     onChange={(e) => setField("requestedCheckOutTime", e.target.value)}
//                                     className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
//                                 />
//                             </Field>
//                         )}
//
//                         <Field
//                             label="Reason"
//                             error={errors.reason}
//                             hint="Briefly explain what happened so the admin can review it."
//                         >
//                             <textarea
//                                 rows={4}
//                                 value={form.reason}
//                                 onChange={(e) => setField("reason", e.target.value)}
//                                 placeholder="Example: I forgot to check out before leaving office."
//                                 className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
//                             />
//                         </Field>
//
//                         <button
//                             type="button"
//                             onClick={submitRequest}
//                             disabled={submitting}
//                             className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
//                         >
//                             <Send className="h-4 w-4" />
//                             {submitting ? "Submitting..." : "Submit Correction Request"}
//                         </button>
//                     </div>
//                 </div>
//
//                 <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
//                     <div className="flex items-center gap-2">
//                         <Clock3 className="h-5 w-5 text-slate-700" />
//                         <div className="text-lg font-bold text-slate-900">My Requests</div>
//                     </div>
//
//                     <div className="mt-6 space-y-4">
//                         {loading ? (
//                             <div className="text-sm text-slate-500">Loading requests...</div>
//                         ) : requests.length === 0 ? (
//                             <div className="text-sm text-slate-500">No correction requests submitted yet.</div>
//                         ) : (
//                             requests.map((r) => (
//                                 <div key={r.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
//                                     <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
//                                         <div>
//                                             <div className="text-sm font-bold text-slate-900">{r.type}</div>
//                                             <div className="mt-1 text-xs text-slate-500">
//                                                 Date: {r.attendanceDate || "--"}
//                                             </div>
//                                         </div>
//                                         <StatusPill status={r.status} />
//                                     </div>
//
//                                     <div className="mt-3 text-sm text-slate-700">{r.reason}</div>
//
//                                     <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
//                                         <div>Requested IN: {formatDateTime(r.requestedCheckInTime)}</div>
//                                         <div>Requested OUT: {formatDateTime(r.requestedCheckOutTime)}</div>
//                                         <div>Created: {formatDateTime(r.createdAt)}</div>
//                                         <div>Decided: {formatDateTime(r.decidedAt)}</div>
//                                     </div>
//
//                                     {r.adminDecisionNote && (
//                                         <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
//                                             <span className="font-semibold">Admin Note:</span> {r.adminDecisionNote}
//                                         </div>
//                                     )}
//                                 </div>
//                             ))
//                         )}
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }