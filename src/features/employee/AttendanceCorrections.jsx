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
            ? "bg-green-50 text-green-700 ring-green-200"
            : status === "REJECTED"
                ? "bg-red-50 text-red-700 ring-red-200"
                : "bg-yellow-50 text-yellow-700 ring-yellow-200";

    return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${styles}`}>
            {status || "PENDING"}
        </span>
    );
}

function Field({ label, error, hint, children }) {
    return (
        <div>
            <div className="mb-1 text-xs font-semibold text-slate-600">{label}</div>
            {children}
            {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
            {error && <div className="mt-1 text-xs text-rose-600">{error}</div>}
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
        <div>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <div className="text-xl font-bold text-slate-900">Attendance Corrections</div>
                    <div className="mt-2 text-sm text-slate-600">
                        Submit a request when you missed a punch, entered the wrong time, or had a location issue.
                    </div>
                </div>

                <button
                    onClick={loadMyRequests}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4" />
                        <div>{error}</div>
                    </div>
                </div>
            )}

            {info && (
                <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
                    <div className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4" />
                        <div>{info}</div>
                    </div>
                </div>
            )}

            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2">
                        <FileEdit className="h-5 w-5 text-slate-700" />
                        <div className="text-lg font-bold text-slate-900">Submit Request</div>
                    </div>

                    <div className="mt-6 space-y-4">
                        <Field label="Attendance Date" error={errors.attendanceDate}>
                            <input
                                type="date"
                                value={form.attendanceDate}
                                onChange={(e) => setField("attendanceDate", e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                            />
                        </Field>

                        <Field label="Correction Type" error={errors.type}>
                            <select
                                value={form.type}
                                onChange={(e) => handleTypeChange(e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
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
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
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
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
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
                                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                            />
                        </Field>

                        <button
                            type="button"
                            onClick={submitRequest}
                            disabled={submitting}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                        >
                            <Send className="h-4 w-4" />
                            {submitting ? "Submitting..." : "Submit Correction Request"}
                        </button>
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2">
                        <Clock3 className="h-5 w-5 text-slate-700" />
                        <div className="text-lg font-bold text-slate-900">My Requests</div>
                    </div>

                    <div className="mt-6 space-y-4">
                        {loading ? (
                            <div className="text-sm text-slate-500">Loading requests...</div>
                        ) : requests.length === 0 ? (
                            <div className="text-sm text-slate-500">No correction requests submitted yet.</div>
                        ) : (
                            requests.map((r) => (
                                <div key={r.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <div className="text-sm font-bold text-slate-900">{r.type}</div>
                                            <div className="mt-1 text-xs text-slate-500">
                                                Date: {r.attendanceDate || "--"}
                                            </div>
                                        </div>
                                        <StatusPill status={r.status} />
                                    </div>

                                    <div className="mt-3 text-sm text-slate-700">{r.reason}</div>

                                    <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                                        <div>Requested IN: {formatDateTime(r.requestedCheckInTime)}</div>
                                        <div>Requested OUT: {formatDateTime(r.requestedCheckOutTime)}</div>
                                        <div>Created: {formatDateTime(r.createdAt)}</div>
                                        <div>Decided: {formatDateTime(r.decidedAt)}</div>
                                    </div>

                                    {r.adminDecisionNote && (
                                        <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                                            <span className="font-semibold">Admin Note:</span> {r.adminDecisionNote}
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