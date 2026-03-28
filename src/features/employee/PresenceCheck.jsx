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
import { useToast } from "../../components/ui/Toast.jsx";
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
                <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    Presence already confirmed successfully.
                </div>
            );
        }

        if (check.status === "LATE") {
            return (
                <div className="flex items-center gap-2 text-sm text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    Presence was confirmed, but after the due time.
                </div>
            );
        }

        if (check.status === "MISSED") {
            return (
                <div className="flex items-center gap-2 text-sm text-red-600">
                    <XCircle className="h-4 w-4" />
                    This presence verification was missed.
                </div>
            );
        }

        if (!isActionable) {
            return (
                <div className="text-sm text-amber-600">
                    This presence verification is no longer actionable.
                </div>
            );
        }

        return null;
    }

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading presence status...
            </div>
        );
    }

    if (loadError) {
        return (
            <Card>
                <CardContent className="py-10 text-center text-red-600">
                    {loadError}
                </CardContent>
            </Card>
        );
    }

    if (!check) {
        return (
            <Card>
                <CardContent className="py-10 text-center text-slate-500">
                    {notFoundMessage || "No active presence verification."}
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Presence Verification Required</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="warning">{check.riskLevel}</Badge>
                        <Badge variant="neutral">{check.triggerReason}</Badge>
                        <Badge variant="neutral">{check.sourceExpected}</Badge>
                        <Badge variant={check.status === "PENDING" ? "success" : "neutral"}>
                            {check.status}
                        </Badge>
                    </div>

                    <div className="text-sm text-slate-600">
                        {check.triggerDescription || "System requested verification."}
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4" />
                        Time remaining:
                        <span className="font-semibold">
                            {remaining !== null ? `${remaining}s` : "-"}
                        </span>
                    </div>

                    {renderStatusMessage()}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Confirm your presence</CardTitle>
                </CardHeader>

                <CardContent className="flex flex-wrap gap-3">
                    {allowGps && (
                        <Button onClick={respondWithGPS} disabled={responding}>
                            {responding ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <MapPin className="h-4 w-4" />
                            )}
                            Confirm with Biometric + GPS
                        </Button>
                    )}

                    {allowPc && (
                        <Button
                            variant="secondary"
                            onClick={respondLightConfirm}
                            disabled={responding}
                        >
                            {responding ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <ShieldCheck className="h-4 w-4" />
                            )}
                            Confirm from this PC
                        </Button>
                    )}

                    {!allowGps && !allowPc && (
                        <div className="text-sm text-slate-500">
                            No confirmation action is available for this check.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}