import React, { useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import { Button } from "../../components/ui/Button.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card.jsx";
import { Loader2, MapPin, ShieldCheck, Clock } from "lucide-react";
import { useToast } from "../../components/ui/Toast.jsx";
import { getOrCreateDeviceFingerprint } from "../../lib/deviceFingerprint.js";

const BASE = "/v1/emp/presence-check";

export default function PresenceCheck() {
    const toast = useToast((s) => s.push);

    const [loading, setLoading] = useState(true);
    const [responding, setResponding] = useState(false);
    const [check, setCheck] = useState(null);
    const [remaining, setRemaining] = useState(null);

    async function loadCurrent() {
        try {
            setLoading(true);
            const res = await api.get(`${BASE}/current`);
            setCheck(res?.data?.data || null);
        } catch (e) {
            setCheck(null);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadCurrent();
    }, []);

    useEffect(() => {
        if (!check?.dueAt) {
            setRemaining(null);
            return;
        }

        const interval = setInterval(() => {
            const diff = new Date(check.dueAt).getTime() - new Date().getTime();
            setRemaining(Math.max(0, Math.floor(diff / 1000)));
        }, 1000);

        return () => clearInterval(interval);
    }, [check]);

    async function respondWithGPS() {
        if (!check?.id) return;

        if (!navigator.geolocation) {
            toast({
                title: "GPS not supported",
                message: "This device cannot provide location.",
                variant: "error",
            });
            return;
        }

        setResponding(true);

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const payload = {
                        presenceCheckId: check.id,
                        deviceFingerprint: getOrCreateDeviceFingerprint(),
                        responseSource: "MOBILE_GPS",
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                        accuracyMeters: pos.coords.accuracy,
                        locationText: "Auto captured",
                        responseNote: "Confirmed from mobile",
                    };

                    await api.post(`${BASE}/respond`, payload);

                    toast({
                        title: "Presence confirmed",
                        message: "Your response was recorded successfully.",
                        variant: "success",
                    });

                    await loadCurrent();
                } catch (e) {
                    toast({
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
                toast({
                    title: "Location error",
                    message: "Could not access GPS location.",
                    variant: "error",
                });
            },
            { enableHighAccuracy: true, timeout: 12000 }
        );
    }

    async function respondLightConfirm() {
        if (!check?.id) return;

        setResponding(true);

        try {
            const payload = {
                presenceCheckId: check.id,
                deviceFingerprint: getOrCreateDeviceFingerprint(),
                responseSource: "COMPANY_PC",
                responseNote: "Confirmed from company workstation",
            };

            await api.post(`${BASE}/respond`, payload);

            toast({
                title: "Presence confirmed",
                message: "Your response was recorded successfully.",
                variant: "success",
            });

            await loadCurrent();
        } catch (e) {
            toast({
                title: "Response failed",
                message: e?.response?.data?.message || "Could not submit presence response.",
                variant: "error",
            });
        } finally {
            setResponding(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading presence status...
            </div>
        );
    }

    if (!check) {
        return (
            <Card>
                <CardContent className="py-10 text-center text-slate-500">
                    No active presence verification.
                </CardContent>
            </Card>
        );
    }

    const allowGps =
        check.sourceExpected === "MOBILE_BIOMETRIC" || check.sourceExpected === "ANY";

    const allowPc =
        check.sourceExpected === "COMPANY_PC" || check.sourceExpected === "ANY";

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
                            Confirm with GPS
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
                </CardContent>
            </Card>
        </div>
    );
}