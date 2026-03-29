import React, { useState } from "react";
import {
    Fingerprint,
    Loader2,
    CheckCircle2,
    ShieldCheck,
    Sparkles,
    LockKeyhole,
    AlertTriangle,
    Info
} from "lucide-react";
import * as webauthnJson from "@github/webauthn-json";
import { api } from "../../../lib/api.js";

function getErrorMessage(err, fallback = "Passkey verification failed") {
    const msgFromBackend =
        err?.response?.data?.message ||
        err?.response?.data?.msg ||
        err?.response?.data?.data?.message;

    if (msgFromBackend) return msgFromBackend;
    return err?.message || fallback;
}

function Pill({ children, tone = "slate" }) {
    const tones = {
        slate: "border-white/10 bg-white/[0.05] text-slate-300",
        green: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
        red: "border-rose-500/20 bg-rose-500/10 text-rose-300",
        indigo: "border-indigo-500/20 bg-indigo-500/10 text-indigo-300",
        purple: "border-purple-500/20 bg-purple-500/10 text-purple-300",
    };

    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
            {children}
        </span>
    );
}

function GlassCard({ children, className = "" }) {
    return (
        <div className={`rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-none ${className}`}>
            {children}
        </div>
    );
}

export default function Verify() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");
    const [statusType, setStatusType] = useState("slate");

    async function verifyPasskey() {
        try {
            setLoading(true);
            setStatus("");
            setStatusType("slate");

            const res = await api.post("/v1/emp/passkey/assertion/options");
            const optionsJson = res?.data?.data;

            if (!optionsJson) {
                throw new Error("No assertion options received from server");
            }

            const requestOptions = JSON.parse(optionsJson);
            const credential = await webauthnJson.get(requestOptions);

            if (!credential) {
                throw new Error("Passkey verification was cancelled or failed");
            }

            await api.post("/v1/emp/passkey/assertion/verify", {
                credentialJson: JSON.stringify(credential),
            });

            setStatus("Passkey verified successfully!");
            setStatusType("green");
        } catch (err) {
            console.error("Passkey assertion error:", err);
            setStatus(getErrorMessage(err));
            setStatusType("red");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-8 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
                        <h1 className="text-3xl font-black tracking-tight text-white">Verify Passkey</h1>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                        Test whether your registered passkey works on this device using fingerprint,
                        Face ID, Windows Hello, or screen lock.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Pill tone="indigo">
                        <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                        Secure Verification
                    </Pill>
                    <Pill tone="purple">
                        <Sparkles className="mr-1 h-3.5 w-3.5" />
                        WebAuthn
                    </Pill>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
                <GlassCard className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-slate-400">Verification Module</div>
                        <Pill tone={loading ? "indigo" : statusType}>
                            {loading ? "Running" : status ? "Finished" : "Ready"}
                        </Pill>
                    </div>

                    <div className="mt-8 flex justify-center">
                        <div className="relative">
                            <div className="h-44 w-44 rounded-full border border-white/10 bg-white/[0.03]" />
                            <div className="absolute inset-3 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 blur-xl" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <Fingerprint className="h-12 w-12 text-indigo-300" />
                                <div className="mt-3 text-lg font-bold text-white">
                                    Passkey Test
                                </div>
                                <div className="mt-1 text-xs text-slate-500">
                                    Secure device authentication
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 space-y-4">
                        <button
                            onClick={verifyPasskey}
                            disabled={loading}
                            className="w-full rounded-2xl border border-indigo-500/20 bg-indigo-500/10 py-3 text-lg font-semibold text-white transition hover:bg-indigo-500/20 disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Verifying...
                                </span>
                            ) : (
                                "Verify Passkey"
                            )}
                        </button>
                    </div>

                    {status && (
                        <div
                            className={`mt-5 rounded-2xl border p-4 text-sm ${
                                statusType === "green"
                                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                                    : "border-rose-500/20 bg-rose-500/10 text-rose-200"
                            }`}
                        >
                            <div className="flex items-start gap-2">
                                {statusType === "green" ? (
                                    <CheckCircle2 className="mt-0.5 h-4 w-4" />
                                ) : (
                                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                                )}
                                <div>{status}</div>
                            </div>
                        </div>
                    )}
                </GlassCard>

                <div className="space-y-6">
                    <GlassCard className="p-6">
                        <div className="flex items-center gap-2 text-sm font-semibold text-white">
                            <LockKeyhole className="h-4 w-4 text-indigo-300" />
                            What this test checks
                        </div>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                                <div className="text-sm font-semibold text-white">Passkey availability</div>
                                <div className="mt-2 text-sm text-slate-400">
                                    Confirms that a registered passkey can be used on this device and browser.
                                </div>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                                <div className="text-sm font-semibold text-white">Biometric or device unlock</div>
                                <div className="mt-2 text-sm text-slate-400">
                                    Uses fingerprint, Face ID, Windows Hello, or secure device unlock if available.
                                </div>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                                <div className="text-sm font-semibold text-white">Server-side validation</div>
                                <div className="mt-2 text-sm text-slate-400">
                                    The signed assertion is verified by the backend before success is confirmed.
                                </div>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                                <div className="text-sm font-semibold text-white">Device trust confidence</div>
                                <div className="mt-2 text-sm text-slate-400">
                                    Helps confirm this device can be used for protected employee actions.
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6">
                        <div className="flex items-center gap-2 text-sm font-semibold text-white">
                            <Info className="h-4 w-4 text-indigo-300" />
                            Notes
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-sm text-slate-300">
                                <div className="font-semibold text-white">If verification succeeds</div>
                                <div className="mt-2 text-slate-400">
                                    Your passkey is working correctly on this device.
                                </div>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-sm text-slate-300">
                                <div className="font-semibold text-white">If verification fails</div>
                                <div className="mt-2 text-slate-400">
                                    The passkey may be missing, unavailable in this browser, or the device prompt may have been cancelled.
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}