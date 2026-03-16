import React, { useEffect, useMemo, useState } from "react";
import { MapPin, Loader2, AlertTriangle, Info, Fingerprint, Clock3, CheckCircle2, CalendarClock } from "lucide-react";
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
        slate: "bg-slate-100 text-slate-700 ring-slate-200",
        green: "bg-green-50 text-green-700 ring-green-200",
        yellow: "bg-yellow-50 text-yellow-700 ring-yellow-200",
        red: "bg-red-50 text-red-700 ring-red-200",
        indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
        purple: "bg-purple-50 text-purple-700 ring-purple-200",
    };

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${tones[tone]}`}>
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

function SummaryCard({ summary, summaryLoading }) {
    if (summaryLoading) {
        return (
            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-sm text-slate-500">Loading today summary...</div>
            </div>
        );
    }

    if (!summary) {
        return (
            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-sm text-slate-500">No summary available yet.</div>
            </div>
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
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <div className="text-lg font-bold text-slate-900">Today Summary</div>
                    <div className="mt-1 text-sm text-slate-500">
                        Daily attendance result based on your valid punches.
                    </div>
                </div>

                <Pill tone={dayTone}>{summary.dayStatus || "UNKNOWN"}</Pill>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">First In</div>
                    <div className="mt-2 text-sm font-bold text-slate-900">{formatTime(summary.firstInTime)}</div>
                    <div className="mt-1 text-xs text-slate-500">{formatDateTime(summary.firstInTime)}</div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last Out</div>
                    <div className="mt-2 text-sm font-bold text-slate-900">{formatTime(summary.lastOutTime)}</div>
                    <div className="mt-1 text-xs text-slate-500">{formatDateTime(summary.lastOutTime)}</div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
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

                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Minutes</div>
                    <div className="mt-2 space-y-1 text-sm text-slate-700">
                        <div>Late: <b>{summary.lateMinutes ?? 0}</b></div>
                        <div>Early leave: <b>{summary.earlyLeaveMinutes ?? 0}</b></div>
                        <div>Overtime: <b>{summary.overtimeMinutes ?? 0}</b></div>
                    </div>
                </div>
            </div>
        </div>
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
        if (accuracy <= 30) return { text: "Good", cls: "text-green-700 bg-green-50 ring-green-200" };
        if (accuracy <= MAX_OK_ACCURACY) return { text: "Ok", cls: "text-yellow-700 bg-yellow-50 ring-yellow-200" };
        return { text: "Poor", cls: "text-red-700 bg-red-50 ring-red-200" };
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

    const statusColor =
        attendance?.status === "VALID"
            ? "bg-green-500"
            : attendance?.status === "PENDING"
                ? "bg-yellow-500"
                : "bg-slate-300";

    const actionBusy = loading || verifyingPasskey;

    return (
        <div className="max-w-4xl mx-auto py-10 px-4">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-slate-900">Attendance</h1>
                <p className="text-sm text-slate-500 mt-2">
                    Mobile uses GPS + passkey biometric verification. PC uses manual Web attendance (Pending approval).
                </p>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="text-sm font-semibold text-slate-500">Latest Punch</div>

                    <div className="mt-6 flex justify-center">
                        <div className="relative">
                            <div className={`h-40 w-40 rounded-full ${statusColor} opacity-20`} />
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="text-sm text-slate-500">
                                    {attendance ? attendance.type : "Not Marked"}
                                </div>
                                <div className="text-xl font-bold text-slate-900 mt-1">
                                    {attendance ? new Date(attendance.eventTime).toLocaleTimeString() : "-- : --"}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                    {attendance ? attendance.status : "No record"}
                                </div>
                                {attendance?.attendanceMark && (
                                    <div className="mt-2">
                                        <Pill tone="indigo">{attendance.attendanceMark}</Pill>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {isMobileDevice() && accuracy != null && accuracyLabel && (
                        <div className="mt-6 flex justify-center">
                            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ring-1 ${accuracyLabel.cls}`}>
                                <MapPin className="h-4 w-4" />
                                Accuracy: {accuracy}m • {accuracyLabel.text}
                            </div>
                        </div>
                    )}

                    {isMobileDevice() && (
                        <div className="mt-4 flex justify-center">
                            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ring-1 bg-slate-50 text-slate-700 ring-slate-200">
                                <Fingerprint className="h-4 w-4" />
                                Mobile attendance requires passkey verification
                            </div>
                        </div>
                    )}

                    <div className="mt-8 space-y-4">
                        <button
                            onClick={() => punch("IN")}
                            disabled={actionBusy}
                            className="w-full rounded-2xl bg-slate-900 text-white py-3 text-lg font-semibold hover:bg-slate-800 transition disabled:opacity-50"
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
                            className="w-full rounded-2xl bg-red-600 text-white py-3 text-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
                        >
                            {actionBusy ? "Processing..." : "Check Out"}
                        </button>
                    </div>
                </div>

                <div>
                    {error && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 mt-0.5" />
                                <div>{error}</div>
                            </div>
                        </div>
                    )}

                    {info && (
                        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 mb-4">
                            <div className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 mt-0.5" />
                                <div>{info}</div>
                            </div>
                        </div>
                    )}

                    <SummaryCard summary={summary} summaryLoading={summaryLoading} />

                    {showHelp && isMobileDevice() && (
                        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                <Info className="h-4 w-4" />
                                How to enable location (Android / iPhone)
                            </div>

                            <div className="mt-3 grid gap-3 text-sm text-slate-700">
                                <div className="rounded-xl bg-slate-50 p-3">
                                    <div className="font-semibold">Android (Chrome)</div>
                                    <ul className="mt-1 list-disc pl-5 space-y-1">
                                        <li>Turn on <b>Location</b> (GPS) from Quick Settings.</li>
                                        <li>Chrome → Site settings → <b>Location</b> → Allow.</li>
                                        <li>Set Location mode to <b>High accuracy</b>.</li>
                                    </ul>
                                </div>

                                <div className="rounded-xl bg-slate-50 p-3">
                                    <div className="font-semibold">iPhone (Safari)</div>
                                    <ul className="mt-1 list-disc pl-5 space-y-1">
                                        <li>Settings → Privacy & Security → <b>Location Services</b> → ON.</li>
                                        <li>Settings → Safari → <b>Location</b> → Allow (or Ask).</li>
                                        <li>Refresh the page and try again.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <CalendarClock className="h-4 w-4" />
                            Current Rules
                        </div>
                        <div className="mt-3 space-y-2 text-sm text-slate-600">
                            <div>• Mobile punch uses GPS + passkey verification.</div>
                            <div>• Web punch requires a reason and goes for approval.</div>
                            <div>• Daily summary updates after successful attendance actions.</div>
                            <div>• Late, early leave, and overtime are calculated from your assigned shift.</div>
                        </div>
                    </div>
                </div>
            </div>

            {showFallback && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-3xl bg-white shadow-lg ring-1 ring-slate-200 p-5">
                        <div className="flex items-start gap-3">
                            <div className="mt-1 rounded-xl bg-yellow-50 p-2 ring-1 ring-yellow-200">
                                <AlertTriangle className="h-5 w-5 text-yellow-700" />
                            </div>
                            <div className="flex-1">
                                <div className="text-base font-semibold text-slate-900">
                                    Web Attendance (Manual)
                                </div>

                                <div className="mt-1 text-sm text-slate-600">
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

                        <div className="mt-4">
                            <label className="text-xs font-semibold text-slate-700">
                                Reason (required)
                            </label>
                            <textarea
                                value={webReason}
                                onChange={(e) => setWebReason(e.target.value)}
                                rows={3}
                                className="mt-1 w-full rounded-2xl border border-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                                placeholder="Example: Marking from office PC / GPS permission issue / accuracy too low."
                            />
                        </div>

                        <div className="mt-5 flex gap-3">
                            <button
                                className="flex-1 rounded-2xl bg-slate-900 text-white py-2.5 text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"
                                disabled={actionBusy}
                                onClick={submitWebFallback}
                            >
                                {actionBusy ? "Submitting..." : "Submit (Pending)"}
                            </button>
                            <button
                                className="flex-1 rounded-2xl bg-white text-slate-700 py-2.5 text-sm font-semibold ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
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