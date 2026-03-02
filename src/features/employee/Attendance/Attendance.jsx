import React, { useMemo, useState } from "react";
import axios from "axios";
import { authStore } from "../../auth/store";
import { MapPin, Loader2, AlertTriangle } from "lucide-react";

const API = "http://localhost:8080/api/v1/attendance";

// tweak these
const MAX_OK_ACCURACY = 120;   // meters: accept as “good enough” mobile
const MAX_WAIT_MS = 12000;

export default function Attendance() {
    const { token } = authStore();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [attendance, setAttendance] = useState(null);

    const [accuracy, setAccuracy] = useState(null);
    const [lastCoords, setLastCoords] = useState(null);

    // fallback modal state
    const [showFallback, setShowFallback] = useState(false);
    const [pendingType, setPendingType] = useState(null);
    const [webReason, setWebReason] = useState("");

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
                    setAccuracy(acc);

                    const coords = {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                        accuracy: acc,
                    };
                    setLastCoords(coords);
                    resolve(coords);
                },
                (e) => reject(e),
                {
                    enableHighAccuracy: true,
                    timeout: MAX_WAIT_MS,
                    maximumAge: 0,
                }
            );
        });

    const callPunch = async (endpoint, payload) => {
        const res = await axios.post(`${API}${endpoint}`, payload, {
            headers: { Authorization: `Bearer ${token}` },
        });
        setAttendance(res.data.data);
    };

    const punchMobile = async (type) => {
        setLoading(true);
        setError(null);

        try {
            const coords = await getLocation();

            // ✅ If accuracy too poor, offer fallback instead of failing the whole project
            if (coords.accuracy > MAX_OK_ACCURACY) {
                setPendingType(type);
                setShowFallback(true);
                return;
            }

            await callPunch("/punch/mobile", { type, lat: coords.lat, lng: coords.lng });
        } catch (err) {
            // permission denied / timeout / etc
            const msg =
                err?.code === 1
                    ? "Location permission denied. Please allow location or use Web attendance."
                    : err?.code === 3
                        ? "Location timed out. Turn on Wi-Fi/GPS and try again."
                        : err?.message || "Something went wrong";

            // If location fails, also offer fallback
            setPendingType(type);
            setShowFallback(true);
            setError(msg);
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
            // WEB: no GPS required. You can still send coords if you want (optional).
            await callPunch("/punch/web", {
                type: pendingType,
                reason: webReason.trim(),
                lat: lastCoords?.lat ?? null,
                lng: lastCoords?.lng ?? null,
            });

            setShowFallback(false);
            setWebReason("");
            setPendingType(null);
        } catch (err) {
            setError(err?.response?.data?.message || err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const statusColor =
        attendance?.status === "VALID"
            ? "bg-green-500"
            : attendance?.status === "PENDING"
                ? "bg-yellow-500"
                : "bg-slate-300";

    return (
        <div className="max-w-xl mx-auto py-10 px-4">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-bold text-slate-900">Attendance</h1>
                <p className="text-sm text-slate-500 mt-2">
                    Mark attendance with location when available. If accuracy is poor (common on PCs), submit as Web (Pending).
                </p>
            </div>

            {/* Status Circle */}
            <div className="mt-10 flex justify-center">
                <div className="relative">
                    <div className={`h-40 w-40 rounded-full ${statusColor} opacity-20`} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-sm text-slate-500">{attendance ? attendance.type : "Not Marked"}</div>
                        <div className="text-xl font-bold text-slate-900 mt-1">
                            {attendance ? new Date(attendance.eventTime).toLocaleTimeString() : "-- : --"}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">{attendance ? attendance.status : "No record"}</div>
                    </div>
                </div>
            </div>

            {/* Accuracy pill */}
            {accuracy != null && accuracyLabel && (
                <div className="mt-6 flex justify-center">
                    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ring-1 ${accuracyLabel.cls}`}>
                        <MapPin className="h-4 w-4" />
                        Accuracy: {accuracy}m • {accuracyLabel.text}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="mt-10 space-y-4">
                <button
                    onClick={() => punchMobile("IN")}
                    disabled={loading}
                    className="w-full rounded-2xl bg-slate-900 text-white py-3 text-lg font-semibold hover:bg-slate-800 transition disabled:opacity-50"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing...
            </span>
                    ) : (
                        "Check In"
                    )}
                </button>

                <button
                    onClick={() => punchMobile("OUT")}
                    disabled={loading}
                    className="w-full rounded-2xl bg-red-600 text-white py-3 text-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
                >
                    {loading ? "Processing..." : "Check Out"}
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="mt-6 bg-red-50 text-red-600 text-sm p-3 rounded-xl text-center">{error}</div>
            )}

            {/* Fallback Modal */}
            {showFallback && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-3xl bg-white shadow-lg ring-1 ring-slate-200 p-5">
                        <div className="flex items-start gap-3">
                            <div className="mt-1 rounded-xl bg-yellow-50 p-2 ring-1 ring-yellow-200">
                                <AlertTriangle className="h-5 w-5 text-yellow-700" />
                            </div>
                            <div className="flex-1">
                                <div className="text-base font-semibold text-slate-900">
                                    Location is not reliable on this device
                                </div>
                                <div className="mt-1 text-sm text-slate-600">
                                    Your location accuracy is {accuracy ?? "unknown"}m (often happens on PCs). You can submit as{" "}
                                    <span className="font-semibold">Web Attendance</span> and it will be{" "}
                                    <span className="font-semibold">Pending</span> for approval.
                                </div>
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="text-xs font-semibold text-slate-700">Reason (required)</label>
                            <textarea
                                value={webReason}
                                onChange={(e) => setWebReason(e.target.value)}
                                rows={3}
                                className="mt-1 w-full rounded-2xl border border-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                                placeholder="Example: PC accuracy too low, marking manually from office."
                            />
                        </div>

                        <div className="mt-5 flex gap-3">
                            <button
                                className="flex-1 rounded-2xl bg-slate-900 text-white py-2.5 text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"
                                disabled={loading}
                                onClick={submitWebFallback}
                            >
                                Submit as Web (Pending)
                            </button>
                            <button
                                className="flex-1 rounded-2xl bg-white text-slate-700 py-2.5 text-sm font-semibold ring-1 ring-slate-200 hover:bg-slate-50"
                                disabled={loading}
                                onClick={() => {
                                    setShowFallback(false);
                                    setWebReason("");
                                    setPendingType(null);
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}