import React, { useMemo, useState } from "react";
import { MapPin, Loader2, AlertTriangle, Info, Fingerprint } from "lucide-react";
import * as webauthnJson from "@github/webauthn-json";
import { api } from "../../../lib/api.js";

const ATT_BASE = "/v1/emp/attendance";
const PASSKEY_BASE = "/v1/emp/passkey";

const MAX_OK_ACCURACY = 120; // meters
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

export default function Attendance() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [attendance, setAttendance] = useState(null);

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
    };

    const punch = async (type) => {
        setError(null);
        setShowHelp(false);

        // PC / laptop -> fallback manual flow
        if (!isMobileDevice()) {
            setPendingType(type);
            setShowFallback(true);
            return;
        }

        setLoading(true);

        try {
            // 1) get GPS first
            const coords = await getLocation();

            if (coords.accuracy > MAX_OK_ACCURACY) {
                setError(
                    `Location accuracy is too low (${coords.accuracy}m). Turn on High Accuracy / GPS and try again, or submit as Web (Pending).`
                );
                setPendingType(type);
                setShowFallback(true);
                return;
            }

            // 2) verify passkey / fingerprint
            await verifyPasskey();

            // 3) if passkey success, mark attendance
            await callPunch("/punch/mobile", {
                type,
                lat: coords.lat,
                lng: coords.lng,
            });
        } catch (e) {
            setError(getErrorMessage(e, "Attendance verification failed"));
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

        try {
            await callPunch("/punch/web", {
                type: pendingType,
                reason: webReason.trim(),
                lat: lastCoords?.lat ?? null,
                lng: lastCoords?.lng ?? null,
            });

            setShowFallback(false);
            setWebReason("");
            setPendingType(null);
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
        <div className="max-w-xl mx-auto py-10 px-4">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-slate-900">Attendance</h1>
                <p className="text-sm text-slate-500 mt-2">
                    Mobile uses GPS + passkey biometric verification. PC uses manual Web attendance (Pending approval).
                </p>
            </div>

            <div className="mt-10 flex justify-center">
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

            <div className="mt-10 space-y-4">
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

            {error && (
                <div className="mt-6 bg-red-50 text-red-700 text-sm p-3 rounded-xl text-center">
                    {error}
                </div>
            )}

            {showHelp && isMobileDevice() && (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
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