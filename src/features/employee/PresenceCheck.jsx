import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import * as webauthnJson from "@github/webauthn-json";
import { api } from "../../lib/api.js";
import { Button } from "../../components/ui/Button.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card.jsx";
import {
    Loader2,
    MapPin,
    ShieldCheck,
    Clock,
    CheckCircle2,
    AlertTriangle,
    XCircle
} from "lucide-react";
import { useToast } from "../../components/ui/toast-store.js";
import { getOrCreateDeviceFingerprint } from "../../lib/deviceFingerprint.js";

const BASE = "/v1/emp/presence-check";

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default function PresenceCheck() {
    const pushToast = useToast((s) => s.push);
    const query = useQuery();
    const presenceCheckId = query.get("presenceCheckId");

    const [loading, setLoading] = useState(true);
    const [responding, setResponding] = useState(false);
    const [check, setCheck] = useState(null);
    const [remaining, setRemaining] = useState(null);
    const [notFoundMessage, setNotFoundMessage] = useState("");
    const [loadError, setLoadError] = useState("");

    const isByIdMode = useMemo(() => !!presenceCheckId, [presenceCheckId]);
    const isActionable = check?.status === "PENDING";

    async function loadPresenceCheck() {
        try {
            setLoading(true);
            setLoadError("");
            setNotFoundMessage("");

            let res;

            if (isByIdMode) {
                res = await api.get(`${BASE}/${presenceCheckId}`);
            } else {
                res = await api.get(`${BASE}/current`);
            }

            const data = res?.data?.data || null;
            setCheck(data);

            if (!data) {
                setNotFoundMessage(
                    isByIdMode
                        ? "This presence verification is no longer available."
                        : "No active presence verification."
                );
            }
        } catch (e) {
            const status = e?.response?.status;
            const message =
                e?.response?.data?.message ||
                e?.response?.data?.error ||
                "Failed to load presence verification.";

            setCheck(null);

            if (status === 404) {
                setNotFoundMessage(
                    isByIdMode
                        ? "This presence verification is no longer active or could not be found."
                        : "No active presence verification."
                );
                return;
            }

            setLoadError(message);

            pushToast({
                title: "Load failed",
                message,
                variant: "error",
            });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadPresenceCheck();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [presenceCheckId]);

    useEffect(() => {
        if (!check?.dueAt || check?.status !== "PENDING") {
            setRemaining(null);
            return;
        }

        const tick = () => {
            const diff = new Date(check.dueAt).getTime() - Date.now();
            setRemaining(Math.max(0, Math.floor(diff / 1000)));
        };

        tick();
        const interval = setInterval(tick, 1000);

        return () => clearInterval(interval);
    }, [check]);

    const allowGps =
        isActionable &&
        (check?.sourceExpected === "MOBILE_BIOMETRIC" || check?.sourceExpected === "ANY");

    const allowPc =
        isActionable &&
        (check?.sourceExpected === "COMPANY_PC" || check?.sourceExpected === "ANY");

    async function respondWithGPS() {
        if (!check?.id || !isActionable) return;

        if (!navigator.geolocation) {
            pushToast({
                title: "GPS not supported",
                message: "This device cannot provide location.",
                variant: "error",
            });
            return;
        }

        setResponding(true);

        try {
            const deviceFingerprint = getOrCreateDeviceFingerprint();

            const optionsRes = await api.post(
                `${BASE}/biometric/options?presenceCheckId=${check.id}&deviceFingerprint=${encodeURIComponent(deviceFingerprint)}`
            );

            const optionsJson = optionsRes?.data?.data;
            if (!optionsJson) {
                throw new Error("No biometric assertion options received");
            }

            const assertionOptions = JSON.parse(optionsJson);
            const credential = await webauthnJson.get(assertionOptions);

            if (!credential) {
                throw new Error("Biometric verification was cancelled");
            }

            const verifyRes = await api.post(`${BASE}/biometric/verify`, {
                presenceCheckId: check.id,
                deviceFingerprint,
                credentialJson: JSON.stringify(credential),
            });

            const proofToken = verifyRes?.data?.data?.proofToken;
            if (!proofToken) {
                throw new Error("No biometric proof token returned");
            }

            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    try {
                        const payload = {
                            presenceCheckId: check.id,
                            deviceFingerprint,
                            biometricProofToken: proofToken,
                            responseSource: "MOBILE_GPS",
                            latitude: pos.coords.latitude,
                            longitude: pos.coords.longitude,
                            accuracyMeters: pos.coords.accuracy,
                            locationText: "Auto captured",
                            responseNote: "Confirmed from mobile with biometric + GPS",
                        };

                        await api.post(`${BASE}/respond`, payload);

                        pushToast({
                            title: "Presence confirmed",
                            message: "Biometric and GPS verification completed successfully.",
                            variant: "success",
                        });

                        await loadPresenceCheck();
                    } catch (e) {
                        pushToast({
                            title: "Response failed",
                            message: e?.response?.data?.message || "Could not submit presence response.",
                            variant: "error",
                        });
                    } finally {
                        setResponding(false);
                    }
                },
                () => {
                    setResponding(false);
                    pushToast({
                        title: "Location error",
                        message: "Biometric succeeded, but GPS location could not be accessed.",
                        variant: "error",
                    });
                },
                { enableHighAccuracy: true, timeout: 12000 }
            );
        } catch (e) {
            setResponding(false);
            pushToast({
                title: "Biometric verification failed",
                message: e?.response?.data?.message || e?.message || "Could not verify biometric proof.",
                variant: "error",
            });
        }
    }

    async function respondLightConfirm() {
        if (!check?.id || !isActionable) return;

        setResponding(true);

        try {
            const payload = {
                presenceCheckId: check.id,
                deviceFingerprint: getOrCreateDeviceFingerprint(),
                responseSource: "COMPANY_PC",
                responseNote: "Confirmed from company workstation",
            };

            await api.post(`${BASE}/respond`, payload);

            pushToast({
                title: "Presence confirmed",
                message: "Your response was recorded successfully.",
                variant: "success",
            });

            await loadPresenceCheck();
        } catch (e) {
            pushToast({
                title: "Response failed",
                message: e?.response?.data?.message || "Could not submit presence response.",
                variant: "error",
            });
        } finally {
            setResponding(false);
        }
    }

    function renderStatusMessage() {
        if (!check) return null;

        if (check.status === "RESPONDED") {
            return (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-300 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Presence already confirmed successfully.
                    </div>
                </div>
            );
        }

        if (check.status === "LATE") {
            return (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-300 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Presence was confirmed, but after the due time.
                    </div>
                </div>
            );
        }

        if (check.status === "MISSED") {
            return (
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm text-rose-300 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        This presence verification was missed.
                    </div>
                </div>
            );
        }

        if (!isActionable) {
            return (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-300 backdrop-blur-md">
                    This presence verification is no longer actionable.
                </div>
            );
        }

        return null;
    }

    if (loading) {
        return (
            <div className="grid min-h-[320px] place-items-center">
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-5 text-slate-300 backdrop-blur-2xl shadow-2xl">
                    <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                        <span className="text-sm font-semibold text-white">Loading presence status...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (loadError) {
        return (
            <Card className="rounded-3xl border border-rose-500/20 bg-rose-500/5 backdrop-blur-xl shadow-xl">
                <CardContent className="py-12 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-300">
                        <XCircle className="h-6 w-6" />
                    </div>
                    <div className="mt-4 text-lg font-bold text-rose-200">Unable to load presence check</div>
                    <div className="mt-2 text-sm text-rose-300/90">{loadError}</div>
                </CardContent>
            </Card>
        );
    }

    if (!check) {
        return (
            <Card className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-xl">
                <CardContent className="py-14 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div className="mt-4 text-lg font-bold text-white">No active presence verification</div>
                    <div className="mt-2 text-sm text-slate-400">
                        {notFoundMessage || "No active presence verification."}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-700">
            <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-8 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
                        <h1 className="text-3xl font-black tracking-tight text-white lg:text-4xl">
                            Presence Check
                        </h1>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                        Respond to active presence verification requests using the allowed trusted method.
                    </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-md">
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-indigo-400">
                        Verification Workspace
                    </div>
                    <div className="mt-2 text-sm font-semibold text-white">
                        {isActionable ? "Action required" : "View status"}
                    </div>
                </div>
            </header>

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-slate-900/40 p-6 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:border-white/20">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 opacity-0 transition-opacity duration-500 hover:opacity-100" />
                    <div className="relative z-10 flex items-start justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Status</p>
                            <h3 className="mt-3 text-3xl font-bold tracking-tight text-white">{check.status || "--"}</h3>
                            <p className="mt-2 text-xs text-slate-400">Current verification state</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/5 bg-white/5 text-indigo-400 backdrop-blur-xl">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-slate-900/40 p-6 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:border-white/20">
                    <div className="relative z-10 flex items-start justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Risk Level</p>
                            <h3 className="mt-3 text-3xl font-bold tracking-tight text-white">{check.riskLevel || "--"}</h3>
                            <p className="mt-2 text-xs text-slate-400">Severity assigned by the system</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/5 bg-white/5 text-amber-400 backdrop-blur-xl">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-900/40 p-6 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:border-white/20">
                    <div className="relative z-10 flex items-start justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Expected Source</p>
                            <h3 className="mt-3 text-2xl font-bold tracking-tight text-white">{check.sourceExpected || "--"}</h3>
                            <p className="mt-2 text-xs text-slate-400">Allowed confirmation channel</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/5 bg-white/5 text-cyan-400 backdrop-blur-xl">
                            <MapPin className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-slate-900/40 p-6 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:border-white/20">
                    <div className="relative z-10 flex items-start justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Time Remaining</p>
                            <h3 className="mt-3 text-3xl font-bold tracking-tight text-white">
                                {remaining !== null ? `${remaining}s` : "-"}
                            </h3>
                            <p className="mt-2 text-xs text-slate-400">Countdown until due time</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/5 bg-white/5 text-purple-400 backdrop-blur-xl">
                            <Clock className="h-6 w-6" />
                        </div>
                    </div>
                </div>
            </div>

            <Card className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-2xl overflow-hidden">
                <CardHeader className="border-b border-white/10 pb-5">
                    <CardTitle className="text-xl font-bold text-white">
                        Presence Verification Required
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-6 p-6 sm:p-8">
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="warning">{check.riskLevel}</Badge>
                        <Badge variant="neutral">{check.triggerReason}</Badge>
                        <Badge variant="neutral">{check.sourceExpected}</Badge>
                        <Badge variant={check.status === "PENDING" ? "success" : "neutral"}>
                            {check.status}
                        </Badge>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-sm leading-6 text-slate-300">
                        {check.triggerDescription || "System requested verification."}
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                Trigger Reason
                            </div>
                            <div className="mt-2 text-sm font-semibold text-white">
                                {check.triggerReason || "--"}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                Response Mode
                            </div>
                            <div className="mt-2 text-sm font-semibold text-white">
                                {check.sourceExpected || "--"}
                            </div>
                        </div>
                    </div>

                    {renderStatusMessage()}
                </CardContent>
            </Card>

            <Card className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-2xl overflow-hidden">
                <CardHeader className="border-b border-white/10 pb-5">
                    <CardTitle className="text-xl font-bold text-white">
                        Confirm your presence
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-6 p-6 sm:p-8">
                    <div className="grid gap-4 md:grid-cols-2">
                        {allowGps && (
                            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5 backdrop-blur-md">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
                                        {responding ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <MapPin className="h-5 w-5" />
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-bold text-white">
                                            Biometric + GPS
                                        </div>
                                        <p className="mt-1 text-xs leading-5 text-slate-400">
                                            Use mobile biometric verification together with GPS coordinates.
                                        </p>

                                        <div className="mt-4">
                                            <Button
                                                onClick={respondWithGPS}
                                                disabled={responding}
                                                className="w-full"
                                            >
                                                {responding ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <MapPin className="h-4 w-4" />
                                                )}
                                                Confirm with Biometric + GPS
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {allowPc && (
                            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5 backdrop-blur-md">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-300">
                                        {responding ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <ShieldCheck className="h-5 w-5" />
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-bold text-white">
                                            Trusted Company PC
                                        </div>
                                        <p className="mt-1 text-xs leading-5 text-slate-400">
                                            Confirm directly from this approved workstation.
                                        </p>

                                        <div className="mt-4">
                                            <Button
                                                variant="secondary"
                                                onClick={respondLightConfirm}
                                                disabled={responding}
                                                className="w-full"
                                            >
                                                {responding ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <ShieldCheck className="h-4 w-4" />
                                                )}
                                                Confirm from this PC
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {!allowGps && !allowPc && (
                        <div className="rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-4 text-sm text-slate-400">
                            No confirmation action is available for this check.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}










// import React, { useEffect, useMemo, useState } from "react";
// import { useLocation } from "react-router-dom";
// import * as webauthnJson from "@github/webauthn-json";
// import { api } from "../../lib/api.js";
// import { Button } from "../../components/ui/Button.jsx";
// import { Badge } from "../../components/ui/Badge.jsx";
// import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card.jsx";
// import {
//     Loader2,
//     MapPin,
//     ShieldCheck,
//     Clock,
//     CheckCircle2,
//     AlertTriangle,
//     XCircle
// } from "lucide-react";
// import { useToast } from "../../components/ui/toast-store.js";
// import { getOrCreateDeviceFingerprint } from "../../lib/deviceFingerprint.js";
//
// const BASE = "/v1/emp/presence-check";
//
// function useQuery() {
//     return new URLSearchParams(useLocation().search);
// }
//
// export default function PresenceCheck() {
//     const pushToast = useToast((s) => s.push);
//     const query = useQuery();
//     const presenceCheckId = query.get("presenceCheckId");
//
//     const [loading, setLoading] = useState(true);
//     const [responding, setResponding] = useState(false);
//     const [check, setCheck] = useState(null);
//     const [remaining, setRemaining] = useState(null);
//     const [notFoundMessage, setNotFoundMessage] = useState("");
//     const [loadError, setLoadError] = useState("");
//
//     const isByIdMode = useMemo(() => !!presenceCheckId, [presenceCheckId]);
//     const isActionable = check?.status === "PENDING";
//
//     async function loadPresenceCheck() {
//         try {
//             setLoading(true);
//             setLoadError("");
//             setNotFoundMessage("");
//
//             let res;
//
//             if (isByIdMode) {
//                 res = await api.get(`${BASE}/${presenceCheckId}`);
//             } else {
//                 res = await api.get(`${BASE}/current`);
//             }
//
//             const data = res?.data?.data || null;
//             setCheck(data);
//
//             if (!data) {
//                 setNotFoundMessage(
//                     isByIdMode
//                         ? "This presence verification is no longer available."
//                         : "No active presence verification."
//                 );
//             }
//         } catch (e) {
//             const status = e?.response?.status;
//             const message =
//                 e?.response?.data?.message ||
//                 e?.response?.data?.error ||
//                 "Failed to load presence verification.";
//
//             setCheck(null);
//
//             if (status === 404) {
//                 setNotFoundMessage(
//                     isByIdMode
//                         ? "This presence verification is no longer active or could not be found."
//                         : "No active presence verification."
//                 );
//                 return;
//             }
//
//             setLoadError(message);
//
//             pushToast({
//                 title: "Load failed",
//                 message,
//                 variant: "error",
//             });
//         } finally {
//             setLoading(false);
//         }
//     }
//
//     useEffect(() => {
//         loadPresenceCheck();
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [presenceCheckId]);
//
//     useEffect(() => {
//         if (!check?.dueAt || check?.status !== "PENDING") {
//             setRemaining(null);
//             return;
//         }
//
//         const tick = () => {
//             const diff = new Date(check.dueAt).getTime() - Date.now();
//             setRemaining(Math.max(0, Math.floor(diff / 1000)));
//         };
//
//         tick();
//         const interval = setInterval(tick, 1000);
//
//         return () => clearInterval(interval);
//     }, [check]);
//
//     const allowGps =
//         isActionable &&
//         (check?.sourceExpected === "MOBILE_BIOMETRIC" || check?.sourceExpected === "ANY");
//
//     const allowPc =
//         isActionable &&
//         (check?.sourceExpected === "COMPANY_PC" || check?.sourceExpected === "ANY");
//
//     async function respondWithGPS() {
//         if (!check?.id || !isActionable) return;
//
//         if (!navigator.geolocation) {
//             pushToast({
//                 title: "GPS not supported",
//                 message: "This device cannot provide location.",
//                 variant: "error",
//             });
//             return;
//         }
//
//         setResponding(true);
//
//         try {
//             const deviceFingerprint = getOrCreateDeviceFingerprint();
//
//             const optionsRes = await api.post(
//                 `${BASE}/biometric/options?presenceCheckId=${check.id}&deviceFingerprint=${encodeURIComponent(deviceFingerprint)}`
//             );
//
//             const optionsJson = optionsRes?.data?.data;
//             if (!optionsJson) {
//                 throw new Error("No biometric assertion options received");
//             }
//
//             const assertionOptions = JSON.parse(optionsJson);
//             const credential = await webauthnJson.get(assertionOptions);
//
//             if (!credential) {
//                 throw new Error("Biometric verification was cancelled");
//             }
//
//             const verifyRes = await api.post(`${BASE}/biometric/verify`, {
//                 presenceCheckId: check.id,
//                 deviceFingerprint,
//                 credentialJson: JSON.stringify(credential),
//             });
//
//             const proofToken = verifyRes?.data?.data?.proofToken;
//             if (!proofToken) {
//                 throw new Error("No biometric proof token returned");
//             }
//
//             navigator.geolocation.getCurrentPosition(
//                 async (pos) => {
//                     try {
//                         const payload = {
//                             presenceCheckId: check.id,
//                             deviceFingerprint,
//                             biometricProofToken: proofToken,
//                             responseSource: "MOBILE_GPS",
//                             latitude: pos.coords.latitude,
//                             longitude: pos.coords.longitude,
//                             accuracyMeters: pos.coords.accuracy,
//                             locationText: "Auto captured",
//                             responseNote: "Confirmed from mobile with biometric + GPS",
//                         };
//
//                         await api.post(`${BASE}/respond`, payload);
//
//                         pushToast({
//                             title: "Presence confirmed",
//                             message: "Biometric and GPS verification completed successfully.",
//                             variant: "success",
//                         });
//
//                         await loadPresenceCheck();
//                     } catch (e) {
//                         pushToast({
//                             title: "Response failed",
//                             message: e?.response?.data?.message || "Could not submit presence response.",
//                             variant: "error",
//                         });
//                     } finally {
//                         setResponding(false);
//                     }
//                 },
//                 () => {
//                     setResponding(false);
//                     pushToast({
//                         title: "Location error",
//                         message: "Biometric succeeded, but GPS location could not be accessed.",
//                         variant: "error",
//                     });
//                 },
//                 { enableHighAccuracy: true, timeout: 12000 }
//             );
//         } catch (e) {
//             setResponding(false);
//             pushToast({
//                 title: "Biometric verification failed",
//                 message: e?.response?.data?.message || e?.message || "Could not verify biometric proof.",
//                 variant: "error",
//             });
//         }
//     }
//
//     async function respondLightConfirm() {
//         if (!check?.id || !isActionable) return;
//
//         setResponding(true);
//
//         try {
//             const payload = {
//                 presenceCheckId: check.id,
//                 deviceFingerprint: getOrCreateDeviceFingerprint(),
//                 responseSource: "COMPANY_PC",
//                 responseNote: "Confirmed from company workstation",
//             };
//
//             await api.post(`${BASE}/respond`, payload);
//
//             pushToast({
//                 title: "Presence confirmed",
//                 message: "Your response was recorded successfully.",
//                 variant: "success",
//             });
//
//             await loadPresenceCheck();
//         } catch (e) {
//             pushToast({
//                 title: "Response failed",
//                 message: e?.response?.data?.message || "Could not submit presence response.",
//                 variant: "error",
//             });
//         } finally {
//             setResponding(false);
//         }
//     }
//
//     function renderStatusMessage() {
//         if (!check) return null;
//
//         if (check.status === "RESPONDED") {
//             return (
//                 <div className="flex items-center gap-2 text-sm text-green-600">
//                     <CheckCircle2 className="h-4 w-4" />
//                     Presence already confirmed successfully.
//                 </div>
//             );
//         }
//
//         if (check.status === "LATE") {
//             return (
//                 <div className="flex items-center gap-2 text-sm text-amber-600">
//                     <AlertTriangle className="h-4 w-4" />
//                     Presence was confirmed, but after the due time.
//                 </div>
//             );
//         }
//
//         if (check.status === "MISSED") {
//             return (
//                 <div className="flex items-center gap-2 text-sm text-red-600">
//                     <XCircle className="h-4 w-4" />
//                     This presence verification was missed.
//                 </div>
//             );
//         }
//
//         if (!isActionable) {
//             return (
//                 <div className="text-sm text-amber-600">
//                     This presence verification is no longer actionable.
//                 </div>
//             );
//         }
//
//         return null;
//     }
//
//     if (loading) {
//         return (
//             <div className="flex items-center gap-2 text-slate-600">
//                 <Loader2 className="h-4 w-4 animate-spin" />
//                 Loading presence status...
//             </div>
//         );
//     }
//
//     if (loadError) {
//         return (
//             <Card>
//                 <CardContent className="py-10 text-center text-red-600">
//                     {loadError}
//                 </CardContent>
//             </Card>
//         );
//     }
//
//     if (!check) {
//         return (
//             <Card>
//                 <CardContent className="py-10 text-center text-slate-500">
//                     {notFoundMessage || "No active presence verification."}
//                 </CardContent>
//             </Card>
//         );
//     }
//
//     return (
//         <div className="space-y-6">
//             <Card>
//                 <CardHeader>
//                     <CardTitle>Presence Verification Required</CardTitle>
//                 </CardHeader>
//
//                 <CardContent className="space-y-4">
//                     <div className="flex flex-wrap gap-2">
//                         <Badge variant="warning">{check.riskLevel}</Badge>
//                         <Badge variant="neutral">{check.triggerReason}</Badge>
//                         <Badge variant="neutral">{check.sourceExpected}</Badge>
//                         <Badge variant={check.status === "PENDING" ? "success" : "neutral"}>
//                             {check.status}
//                         </Badge>
//                     </div>
//
//                     <div className="text-sm text-slate-600">
//                         {check.triggerDescription || "System requested verification."}
//                     </div>
//
//                     <div className="flex items-center gap-2 text-sm">
//                         <Clock className="h-4 w-4" />
//                         Time remaining:
//                         <span className="font-semibold">
//                             {remaining !== null ? `${remaining}s` : "-"}
//                         </span>
//                     </div>
//
//                     {renderStatusMessage()}
//                 </CardContent>
//             </Card>
//
//             <Card>
//                 <CardHeader>
//                     <CardTitle>Confirm your presence</CardTitle>
//                 </CardHeader>
//
//                 <CardContent className="flex flex-wrap gap-3">
//                     {allowGps && (
//                         <Button onClick={respondWithGPS} disabled={responding}>
//                             {responding ? (
//                                 <Loader2 className="h-4 w-4 animate-spin" />
//                             ) : (
//                                 <MapPin className="h-4 w-4" />
//                             )}
//                             Confirm with Biometric + GPS
//                         </Button>
//                     )}
//
//                     {allowPc && (
//                         <Button
//                             variant="secondary"
//                             onClick={respondLightConfirm}
//                             disabled={responding}
//                         >
//                             {responding ? (
//                                 <Loader2 className="h-4 w-4 animate-spin" />
//                             ) : (
//                                 <ShieldCheck className="h-4 w-4" />
//                             )}
//                             Confirm from this PC
//                         </Button>
//                     )}
//
//                     {!allowGps && !allowPc && (
//                         <div className="text-sm text-slate-500">
//                             No confirmation action is available for this check.
//                         </div>
//                     )}
//                 </CardContent>
//             </Card>
//         </div>
//     );
// }