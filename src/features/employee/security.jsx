import React, { useState } from "react";
import {
    Fingerprint,
    Loader2,
    ShieldCheck,
    Sparkles,
    LockKeyhole,
    Smartphone,
    Monitor,
    CheckCircle2,
    AlertTriangle,
    Info
} from "lucide-react";
import * as webauthnJson from "@github/webauthn-json";
import { api } from "../../lib/api.js";

const DEVICE_FP_KEY = "inshift_device_fingerprint";

function getErrorMessage(err, fallback = "Passkey registration failed") {
    const msgFromBackend = err?.response?.data?.message || err?.response?.data?.msg;
    if (msgFromBackend) return msgFromBackend;
    return err?.message || fallback;
}

function getOrCreateDeviceFingerprint() {
    let fp = localStorage.getItem(DEVICE_FP_KEY);
    if (fp) return fp;

    fp =
        typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    localStorage.setItem(DEVICE_FP_KEY, fp);
    return fp;
}

function guessDeviceName() {
    const ua = navigator.userAgent || "";
    const platform =
        navigator.userAgentData?.platform ||
        navigator.platform ||
        "Unknown Device";

    if (/iPhone/i.test(ua)) return "iPhone";
    if (/iPad/i.test(ua)) return "iPad";
    if (/Android/i.test(ua)) return "Android Phone";
    if (/Mac/i.test(platform)) return "Mac";
    if (/Win/i.test(platform)) return "Windows PC";
    if (/Linux/i.test(platform)) return "Linux PC";

    return "My Device";
}

function detectRequestedTrustType() {
    const ua = navigator.userAgent || "";
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
    return isMobile ? "MOBILE" : "COMPANY_PC";
}

function Pill({ children, tone = "slate" }) {
    const tones = {
        slate: "border-white/10 bg-white/[0.05] text-slate-300",
        green: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
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
    const [deviceName, setDeviceName] = useState(() => guessDeviceName());

    const requestedTrustType = detectRequestedTrustType();

    async function registerPasskey() {
        try {
            setLoading(true);
            setStatus("");
            setStatusType("slate");

            const cleanDeviceName = deviceName.trim();
            if (!cleanDeviceName) {
                throw new Error("Device name is required");
            }

            const deviceFingerprint = getOrCreateDeviceFingerprint();
            const requestedTrustTypeValue = detectRequestedTrustType();

            const res = await api.post("/v1/emp/passkey/register/options", {
                deviceName: cleanDeviceName,
                deviceFingerprint,
                requestedTrustType: requestedTrustTypeValue,
            });

            const optionsJson = res?.data?.data;

            if (!optionsJson) {
                throw new Error("No registration options received from server");
            }

            const creationOptions = JSON.parse(optionsJson);
            const credential = await webauthnJson.create(creationOptions);

            if (!credential) {
                throw new Error("Credential creation failed");
            }

            const payload = {
                credentialJson: JSON.stringify(credential),
                deviceName: cleanDeviceName,
                deviceFingerprint,
            };

            await api.post("/v1/emp/passkey/register/verify", payload);

            setStatus("Passkey registered successfully!");
            setStatusType("green");
        } catch (err) {
            console.error("Passkey registration error:", err);
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
                        <h1 className="text-3xl font-black tracking-tight text-white">Register Passkey</h1>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                        Register this device using fingerprint, Face ID, Windows Hello, or device screen lock.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Pill tone="indigo">
                        <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                        Secure Registration
                    </Pill>
                    <Pill tone="purple">
                        <Sparkles className="mr-1 h-3.5 w-3.5" />
                        WebAuthn
                    </Pill>
                    <Pill tone="cyan">
                        {requestedTrustType === "MOBILE" ? (
                            <>
                                <Smartphone className="mr-1 h-3.5 w-3.5" />
                                Mobile
                            </>
                        ) : (
                            <>
                                <Monitor className="mr-1 h-3.5 w-3.5" />
                                Company PC
                            </>
                        )}
                    </Pill>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
                <GlassCard className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-slate-400">Registration Module</div>
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
                                    Device Passkey
                                </div>
                                <div className="mt-1 text-xs text-slate-500">
                                    Trusted device registration
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-white">
                                Device Name
                            </label>
                            <input
                                value={deviceName}
                                onChange={(e) => setDeviceName(e.target.value)}
                                placeholder="Enter device name"
                                className="w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500/40"
                            />
                            <p className="mt-2 text-xs text-slate-500">
                                Use a name like “My Android Phone” or “Office Laptop”.
                            </p>
                        </div>

                        <button
                            onClick={registerPasskey}
                            disabled={loading}
                            className="w-full rounded-2xl border border-indigo-500/20 bg-indigo-500/10 py-3 text-lg font-semibold text-white transition hover:bg-indigo-500/20 disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Registering...
                                </span>
                            ) : (
                                "Register Passkey"
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
                            What this registration does
                        </div>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                                <div className="text-sm font-semibold text-white">Creates a device-bound credential</div>
                                <div className="mt-2 text-sm text-slate-400">
                                    Registers a passkey that can later be used for secure employee verification flows.
                                </div>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                                <div className="text-sm font-semibold text-white">Links this browser/device</div>
                                <div className="mt-2 text-sm text-slate-400">
                                    Associates the generated credential with your current device fingerprint and device name.
                                </div>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                                <div className="text-sm font-semibold text-white">Uses biometric or secure unlock</div>
                                <div className="mt-2 text-sm text-slate-400">
                                    Depending on your device, this may use fingerprint, Face ID, Windows Hello, or screen lock.
                                </div>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                                <div className="text-sm font-semibold text-white">Requests trust type</div>
                                <div className="mt-2 text-sm text-slate-400">
                                    This device currently requests: <b>{requestedTrustType}</b>.
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
                                <div className="font-semibold text-white">Choose a clear device name</div>
                                <div className="mt-2 text-slate-400">
                                    This helps identify the registered device later during approval or review.
                                </div>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-sm text-slate-300">
                                <div className="font-semibold text-white">Registration may fail if cancelled</div>
                                <div className="mt-2 text-slate-400">
                                    If the system prompt is dismissed or biometric/device unlock is cancelled, registration will not complete.
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}





// import React, { useState } from "react";
// import { Fingerprint, Loader2 } from "lucide-react";
// import * as webauthnJson from "@github/webauthn-json";
// import { api } from "../../lib/api.js";
//
// const DEVICE_FP_KEY = "inshift_device_fingerprint";
//
// function getErrorMessage(err, fallback = "Passkey registration failed") {
//     const msgFromBackend = err?.response?.data?.message || err?.response?.data?.msg;
//     if (msgFromBackend) return msgFromBackend;
//     return err?.message || fallback;
// }
//
// function getOrCreateDeviceFingerprint() {
//     let fp = localStorage.getItem(DEVICE_FP_KEY);
//     if (fp) return fp;
//
//     fp =
//         typeof crypto !== "undefined" && crypto.randomUUID
//             ? crypto.randomUUID()
//             : `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
//
//     localStorage.setItem(DEVICE_FP_KEY, fp);
//     return fp;
// }
//
// function guessDeviceName() {
//     const ua = navigator.userAgent || "";
//     const platform =
//         navigator.userAgentData?.platform ||
//         navigator.platform ||
//         "Unknown Device";
//
//     if (/iPhone/i.test(ua)) return "iPhone";
//     if (/iPad/i.test(ua)) return "iPad";
//     if (/Android/i.test(ua)) return "Android Phone";
//     if (/Mac/i.test(platform)) return "Mac";
//     if (/Win/i.test(platform)) return "Windows PC";
//     if (/Linux/i.test(platform)) return "Linux PC";
//
//     return "My Device";
// }
//
// function detectRequestedTrustType() {
//     const ua = navigator.userAgent || "";
//     const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
//     return isMobile ? "MOBILE" : "COMPANY_PC";
// }
//
// export default function Verify() {
//     const [loading, setLoading] = useState(false);
//     const [status, setStatus] = useState("");
//     const [deviceName, setDeviceName] = useState(() => guessDeviceName());
//
//     async function registerPasskey() {
//         try {
//             setLoading(true);
//             setStatus("");
//
//             const cleanDeviceName = deviceName.trim();
//             if (!cleanDeviceName) {
//                 throw new Error("Device name is required");
//             }
//
//             const deviceFingerprint = getOrCreateDeviceFingerprint();
//             const requestedTrustType = detectRequestedTrustType();
//
//             const res = await api.post("/v1/emp/passkey/register/options", {
//                 deviceName: cleanDeviceName,
//                 deviceFingerprint,
//                 requestedTrustType,
//             });
//
//             const optionsJson = res?.data?.data;
//
//             if (!optionsJson) {
//                 throw new Error("No registration options received from server");
//             }
//
//             const creationOptions = JSON.parse(optionsJson);
//
//             const credential = await webauthnJson.create(creationOptions);
//
//             if (!credential) {
//                 throw new Error("Credential creation failed");
//             }
//
//             const payload = {
//                 credentialJson: JSON.stringify(credential),
//                 deviceName: cleanDeviceName,
//                 deviceFingerprint,
//             };
//
//             await api.post("/v1/emp/passkey/register/verify", payload);
//
//             setStatus("✅ Passkey registered successfully!");
//         } catch (err) {
//             console.error("Passkey registration error:", err);
//             setStatus(`❌ ${getErrorMessage(err)}`);
//         } finally {
//             setLoading(false);
//         }
//     }
//
//     return (
//         <div className="max-w-md mx-auto py-10 text-center">
//             <div className="flex justify-center mb-4">
//                 <Fingerprint className="h-12 w-12 text-slate-700" />
//             </div>
//
//             <h2 className="text-xl font-bold text-slate-900">
//                 Register Device Passkey
//             </h2>
//
//             <p className="text-sm text-slate-600 mt-2">
//                 Register this device using fingerprint, Face ID, or device screen lock.
//             </p>
//
//             <div className="mt-5 text-left">
//                 <label className="mb-2 block text-sm font-medium text-slate-700">
//                     Device Name
//                 </label>
//                 <input
//                     value={deviceName}
//                     onChange={(e) => setDeviceName(e.target.value)}
//                     placeholder="Enter device name"
//                     className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
//                 />
//                 <p className="mt-2 text-xs text-slate-500">
//                     Use a name like “My Android Phone” or “Office Laptop”.
//                 </p>
//             </div>
//
//             <button
//                 onClick={registerPasskey}
//                 disabled={loading}
//                 className="mt-6 w-full rounded-2xl bg-slate-900 text-white py-3 font-semibold hover:bg-slate-800 transition disabled:opacity-50"
//             >
//                 {loading ? (
//                     <span className="flex items-center justify-center gap-2">
//                         <Loader2 className="h-5 w-5 animate-spin" />
//                         Registering...
//                     </span>
//                 ) : (
//                     "Register Passkey"
//                 )}
//             </button>
//
//             {status && (
//                 <div className="mt-4 text-sm text-slate-700">
//                     {status}
//                 </div>
//             )}
//         </div>
//     );
// }