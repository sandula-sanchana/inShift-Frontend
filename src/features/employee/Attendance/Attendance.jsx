import React, { useEffect, useMemo, useState } from "react";
import {
    MapPin,
    Loader2,
    AlertTriangle,
    Info,
    Fingerprint,
    Clock3,
    CheckCircle2,
    CalendarClock,
    ShieldCheck,
    Smartphone,
    Monitor,
    Navigation,
    TimerReset,
    Sparkles,
    X
} from "lucide-react";
import * as webauthnJson from "@github/webauthn-json";
import { api } from "../../../lib/api.js";

const ATT_BASE = "/v1/emp/attendance";
const PASSKEY_BASE = "/v1/emp/passkey";

const MAX_OK_ACCURACY = 120;
const MAX_WAIT_MS = 12000;

const isMobileDevice = () =>
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

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

function geoErrorMessage(e) {
    if (e?.code === 1) return "Location permission denied.";
    if (e?.code === 2) return "Location unavailable (GPS/Location Services may be off).";
    if (e?.code === 3) return "Location request timed out.";
    return "Could not get location.";
}

function Pill({ children, tone = "slate" }) {
    const tones = {
        slate: "border-white/10 bg-white/[0.05] text-slate-300",
        green: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
        yellow: "border-amber-500/20 bg-amber-500/10 text-amber-300",
        red: "border-rose-500/20 bg-rose-500/10 text-rose-300",
        indigo: "border-indigo-500/20 bg-indigo-500/10 text-indigo-300",
        purple: "border-purple-500/20 bg-purple-500/10 text-purple-300",
        cyan: "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
    };

    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
            {children}
        </span>
    );
}

function formatDateTime(value) {
    if (!value) return "--";
    return new Date(value).toLocaleString();
}

function formatTime(value) {
    if (!value) return "--";
    return new Date(value).toLocaleTimeString();
}

function GlassCard({ children, className = "" }) {
    return (
        <div className={`rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-none ${className}`}>
            {children}
        </div>
    );
}

function SummaryCard({ summary, summaryLoading }) {
    if (summaryLoading) {
        return (
            <GlassCard className="mt-8 p-6">
                <div className="flex items-center gap-3 text-sm text-slate-300">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading today summary...
                </div>
            </GlassCard>
        );
    }

    if (!summary) {
        return (
            <GlassCard className="mt-8 p-6">
                <div className="text-sm text-slate-400">No summary available yet.</div>
            </GlassCard>
        );
    }

    const dayTone =
        summary.dayStatus === "PRESENT" ? "green" :
            summary.dayStatus === "PRESENT_LATE" ? "yellow" :
                summary.dayStatus === "PRESENT_EARLY_LEAVE" ? "red" :
                    summary.dayStatus === "PRESENT_OVERTIME" ? "indigo" :
                        summary.dayStatus === "INCOMPLETE" ? "yellow" :
                            "slate";

    return (
        <GlassCard className="mt-8 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <div className="text-lg font-bold text-white">Today Summary</div>
                    <div className="mt-1 text-sm text-slate-400">
                        Daily attendance result based on your valid punches.
                    </div>
                </div>

                <Pill tone={dayTone}>{summary.dayStatus || "UNKNOWN"}</Pill>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">First In</div>
                    <div className="mt-2 text-sm font-bold text-white">{formatTime(summary.firstInTime)}</div>
                    <div className="mt-1 text-xs text-slate-400">{formatDateTime(summary.firstInTime)}</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last Out</div>
                    <div className="mt-2 text-sm font-bold text-white">{formatTime(summary.lastOutTime)}</div>
                    <div className="mt-1 text-xs text-slate-400">{formatDateTime(summary.lastOutTime)}</div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Presence</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                        <Pill tone={summary.present ? "green" : "slate"}>
                            {summary.present ? "Present" : "Absent"}
                        </Pill>
                        <Pill tone={summary.completed ? "indigo" : "yellow"}>
                            {summary.completed ? "Completed" : "Incomplete"}
                        </Pill>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Minutes</div>
                    <div className="mt-2 space-y-1 text-sm text-slate-300">
                        <div>Late: <b>{summary.lateMinutes ?? 0}</b></div>
                        <div>Early leave: <b>{summary.earlyLeaveMinutes ?? 0}</b></div>
                        <div>Overtime: <b>{summary.overtimeMinutes ?? 0}</b></div>
                    </div>
                </div>
            </div>
        </GlassCard>
    );
}

export default function Attendance() {
    const [loading, setLoading] = useState(false);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [error, setError] = useState(null);
    const [info, setInfo] = useState(null);

    const [attendance, setAttendance] = useState(null);
    const [summary, setSummary] = useState(null);

    const [accuracy, setAccuracy] = useState(null);
    const [lastCoords, setLastCoords] = useState(null);

    const [showFallback, setShowFallback] = useState(false);
    const [pendingType, setPendingType] = useState(null);
    const [webReason, setWebReason] = useState("");

    const [showHelp, setShowHelp] = useState(false);
    const [verifyingPasskey, setVerifyingPasskey] = useState(false);

    const accuracyLabel = useMemo(() => {
        if (accuracy == null) return null;
        if (accuracy <= 30) return { text: "Good", cls: "green" };
        if (accuracy <= MAX_OK_ACCURACY) return { text: "Ok", cls: "yellow" };
        return { text: "Poor", cls: "red" };
    }, [accuracy]);

    const fetchTodaySummary = async () => {
        setSummaryLoading(true);
        try {
            const res = await api.get(`${ATT_BASE}/summary/today`);
            setSummary(unwrapApiResponse(res.data));
        } catch (e) {
            setError(getErrorMessage(e, "Failed to load today summary"));
        } finally {
            setSummaryLoading(false);
        }
    };

    useEffect(() => {
        fetchTodaySummary();
    }, []);

    const getLocation = () =>
        new Promise((resolve, reject) => {
            if (!navigator.geolocation) return reject(new Error("Geolocation not supported"));

            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const acc = Math.round(pos.coords.accuracy);

                    const coords = {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                        accuracy: acc,
                    };

                    setAccuracy(acc);
                    setLastCoords(coords);
                    resolve(coords);
                },
                (e) => reject(e),
                { enableHighAccuracy: true, timeout: MAX_WAIT_MS, maximumAge: 0 }
            );
        });

    const verifyPasskey = async () => {
        setVerifyingPasskey(true);

        try {
            const res = await api.post(`${PASSKEY_BASE}/assertion/options`);
            const optionsJson = res?.data?.data;

            if (!optionsJson) {
                throw new Error("No passkey assertion options received from server");
            }

            const requestOptions = JSON.parse(optionsJson);
            const credential = await webauthnJson.get(requestOptions);

            if (!credential) {
                throw new Error("Passkey verification was cancelled or failed");
            }

            await api.post(`${PASSKEY_BASE}/assertion/verify`, {
                credentialJson: JSON.stringify(credential),
            });
        } finally {
            setVerifyingPasskey(false);
        }
    };

    const callPunch = async (path, payload) => {
        const res = await api.post(`${ATT_BASE}${path}`, payload);
        const data = unwrapApiResponse(res.data);
        setAttendance(data);
        return data;
    };

    const punch = async (type) => {
        setError(null);
        setInfo(null);
        setShowHelp(false);

        if (!isMobileDevice()) {
            setPendingType(type);
            setShowFallback(true);
            return;
        }

        setLoading(true);

        try {
            const coords = await getLocation();

            if (coords.accuracy > MAX_OK_ACCURACY) {
                setError(
                    `Location accuracy is too low (${coords.accuracy}m). Turn on High Accuracy / GPS and try again, or submit as Web (Pending).`
                );
                setPendingType(type);
                setShowFallback(true);
                return;
            }

            await verifyPasskey();

            const saved = await callPunch("/punch/mobile", {
                type,
                lat: coords.lat,
                lng: coords.lng,
            });

            setInfo(
                `${saved.type} marked successfully • ${saved.status}${saved.attendanceMark ? ` • ${saved.attendanceMark}` : ""}`
            );

            await fetchTodaySummary();
        } catch (e) {
            const isGeoError = e?.code === 1 || e?.code === 2 || e?.code === 3;

            setError(
                isGeoError
                    ? geoErrorMessage(e)
                    : getErrorMessage(e, "Attendance verification failed")
            );

            setShowHelp(isGeoError);
        } finally {
            setLoading(false);
        }
    };

    const submitWebFallback = async () => {
        if (!pendingType) return;

        if (!webReason.trim()) {
            setError("Please enter a reason for Web attendance.");
            return;
        }

        setLoading(true);
        setError(null);
        setInfo(null);

        try {
            const saved = await callPunch("/punch/web", {
                type: pendingType,
                reason: webReason.trim(),
                lat: lastCoords?.lat ?? null,
                lng: lastCoords?.lng ?? null,
            });

            setInfo(`${saved.type} submitted successfully • ${saved.status}`);
            setShowFallback(false);
            setWebReason("");
            setPendingType(null);

            await fetchTodaySummary();
        } catch (e) {
            setError(getErrorMessage(e, "Web attendance failed"));
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setShowFallback(false);
        setWebReason("");
        setPendingType(null);
    };

    const statusTone =
        attendance?.status === "VALID"
            ? "green"
            : attendance?.status === "PENDING"
                ? "yellow"
                : "slate";

    const actionBusy = loading || verifyingPasskey;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-8 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
                        <h1 className="text-3xl font-black tracking-tight text-white">Attendance</h1>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                        Mobile uses GPS + passkey biometric verification. PC uses manual Web attendance with pending approval.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Pill tone={isMobileDevice() ? "indigo" : "slate"}>
                        {isMobileDevice() ? (
                            <>
                                <Smartphone className="mr-1 h-3.5 w-3.5" />
                                Mobile Mode
                            </>
                        ) : (
                            <>
                                <Monitor className="mr-1 h-3.5 w-3.5" />
                                PC Mode
                            </>
                        )}
                    </Pill>

                    {accuracy != null && accuracyLabel && (
                        <Pill tone={accuracyLabel.cls}>
                            <Navigation className="mr-1 h-3.5 w-3.5" />
                            {accuracy}m • {accuracyLabel.text}
                        </Pill>
                    )}
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
                <GlassCard className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-slate-400">Latest Punch</div>
                        <Pill tone={statusTone}>{attendance?.status || "No record"}</Pill>
                    </div>

                    <div className="mt-8 flex justify-center">
                        <div className="relative">
                            <div className="h-44 w-44 rounded-full border border-white/10 bg-white/[0.03]" />
                            <div className="absolute inset-3 rounded-full bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 blur-xl" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="text-sm text-slate-400">
                                    {attendance ? attendance.type : "Not Marked"}
                                </div>
                                <div className="mt-1 text-2xl font-bold text-white">
                                    {attendance ? new Date(attendance.eventTime).toLocaleTimeString() : "-- : --"}
                                </div>
                                <div className="mt-1 text-xs text-slate-500">
                                    {attendance ? attendance.status : "No record"}
                                </div>
                                {attendance?.attendanceMark && (
                                    <div className="mt-3">
                                        <Pill tone="indigo">{attendance.attendanceMark}</Pill>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {isMobileDevice() && (
                        <div className="mt-6 flex justify-center">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-slate-300">
                                <Fingerprint className="h-4 w-4 text-indigo-300" />
                                Mobile attendance requires passkey verification
                            </div>
                        </div>
                    )}

                    <div className="mt-8 space-y-4">
                        <button
                            onClick={() => punch("IN")}
                            disabled={actionBusy}
                            className="w-full rounded-2xl border border-indigo-500/20 bg-indigo-500/10 py-3 text-lg font-semibold text-white transition hover:bg-indigo-500/20 disabled:opacity-50"
                        >
                            {actionBusy ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    {verifyingPasskey ? "Verifying fingerprint..." : "Processing..."}
                                </span>
                            ) : (
                                "Check In"
                            )}
                        </button>

                        <button
                            onClick={() => punch("OUT")}
                            disabled={actionBusy}
                            className="w-full rounded-2xl border border-rose-500/20 bg-rose-500/10 py-3 text-lg font-semibold text-white transition hover:bg-rose-500/20 disabled:opacity-50"
                        >
                            {actionBusy ? "Processing..." : "Check Out"}
                        </button>
                    </div>
                </GlassCard>

                <div>
                    {error && (
                        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="mt-0.5 h-4 w-4" />
                                <div>{error}</div>
                            </div>
                        </div>
                    )}

                    {info && (
                        <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                            <div className="flex items-start gap-2">
                                <CheckCircle2 className="mt-0.5 h-4 w-4" />
                                <div>{info}</div>
                            </div>
                        </div>
                    )}

                    <SummaryCard summary={summary} summaryLoading={summaryLoading} />

                    {showHelp && isMobileDevice() && (
                        <GlassCard className="mt-6 p-5">
                            <div className="flex items-center gap-2 text-sm font-semibold text-white">
                                <Info className="h-4 w-4 text-indigo-300" />
                                How to enable location
                            </div>

                            <div className="mt-4 grid gap-3 text-sm text-slate-300">
                                <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                                    <div className="font-semibold text-white">Android (Chrome)</div>
                                    <ul className="mt-2 list-disc space-y-1 pl-5">
                                        <li>Turn on <b>Location</b> from Quick Settings.</li>
                                        <li>Chrome → Site settings → <b>Location</b> → Allow.</li>
                                        <li>Set Location mode to <b>High accuracy</b>.</li>
                                    </ul>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                                    <div className="font-semibold text-white">iPhone (Safari)</div>
                                    <ul className="mt-2 list-disc space-y-1 pl-5">
                                        <li>Settings → Privacy & Security → <b>Location Services</b> → ON.</li>
                                        <li>Settings → Safari → <b>Location</b> → Allow (or Ask).</li>
                                        <li>Refresh the page and try again.</li>
                                    </ul>
                                </div>
                            </div>
                        </GlassCard>
                    )}

                    <GlassCard className="mt-6 p-5">
                        <div className="flex items-center gap-2 text-sm font-semibold text-white">
                            <CalendarClock className="h-4 w-4 text-indigo-300" />
                            Current Rules
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-sm text-slate-300">
                                <div className="flex items-center gap-2 font-semibold text-white">
                                    <ShieldCheck className="h-4 w-4 text-emerald-300" />
                                    Mobile Verification
                                </div>
                                <div className="mt-2 text-sm text-slate-400">
                                    Mobile punch uses GPS + passkey verification.
                                </div>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-sm text-slate-300">
                                <div className="flex items-center gap-2 font-semibold text-white">
                                    <Monitor className="h-4 w-4 text-cyan-300" />
                                    Web Attendance
                                </div>
                                <div className="mt-2 text-sm text-slate-400">
                                    Web punch requires a reason and goes for approval.
                                </div>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-sm text-slate-300">
                                <div className="flex items-center gap-2 font-semibold text-white">
                                    <Sparkles className="h-4 w-4 text-purple-300" />
                                    Daily Summary
                                </div>
                                <div className="mt-2 text-sm text-slate-400">
                                    Daily summary updates after successful attendance actions.
                                </div>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-sm text-slate-300">
                                <div className="flex items-center gap-2 font-semibold text-white">
                                    <TimerReset className="h-4 w-4 text-amber-300" />
                                    Calculations
                                </div>
                                <div className="mt-2 text-sm text-slate-400">
                                    Late, early leave, and overtime are calculated from your assigned shift.
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>

            {showFallback && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#07111f]/95 p-5 shadow-2xl">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-2">
                                    <AlertTriangle className="h-5 w-5 text-amber-300" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-base font-semibold text-white">
                                        Web Attendance (Manual)
                                    </div>

                                    <div className="mt-1 text-sm text-slate-400">
                                        {!isMobileDevice() ? (
                                            <>
                                                You are using a <b>PC</b>. Web attendance requires a reason and will be{" "}
                                                <b>PENDING</b> until approved.
                                            </>
                                        ) : (
                                            <>
                                                Location is not reliable (accuracy: {accuracy ?? "unknown"}m). You can submit Web attendance →{" "}
                                                <b>PENDING</b>.
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={closeModal}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mt-5">
                            <label className="text-xs font-semibold text-slate-300">
                                Reason (required)
                            </label>
                            <textarea
                                value={webReason}
                                onChange={(e) => setWebReason(e.target.value)}
                                rows={4}
                                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/40 p-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500/40"
                                placeholder="Example: Marking from office PC / GPS permission issue / accuracy too low."
                            />
                        </div>

                        <div className="mt-5 flex gap-3">
                            <button
                                className="flex-1 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500/20 disabled:opacity-50"
                                disabled={actionBusy}
                                onClick={submitWebFallback}
                            >
                                {actionBusy ? "Submitting..." : "Submit (Pending)"}
                            </button>
                            <button
                                className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/[0.06] disabled:opacity-50"
                                disabled={actionBusy}
                                onClick={closeModal}
                            >
                                Cancel
                            </button>
                        </div>

                        <div className="mt-3 text-xs text-slate-500">
                            Note: Web attendance is reviewed by an administrator. All actions are recorded in the audit log.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}