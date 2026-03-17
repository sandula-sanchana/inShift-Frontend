import React, { useMemo, useState } from "react";
import { Fingerprint, Loader2 } from "lucide-react";
import * as webauthnJson from "@github/webauthn-json";
import { api } from "../../lib/api.js";

function getErrorMessage(err, fallback = "Passkey registration failed") {
    const msgFromBackend = err?.response?.data?.message || err?.response?.data?.msg;
    if (msgFromBackend) return msgFromBackend;
    return err?.message || fallback;
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

export default function Verify() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");
    const [deviceName, setDeviceName] = useState(() => guessDeviceName());

    async function registerPasskey() {
        try {
            setLoading(true);
            setStatus("");

            const cleanDeviceName = deviceName.trim();
            if (!cleanDeviceName) {
                throw new Error("Device name is required");
            }

            // 1) ask backend for registration options
            const res = await api.post("/v1/emp/passkey/register/options", {
                deviceName: cleanDeviceName,
            });

            const optionsJson = res?.data?.data;

            if (!optionsJson) {
                throw new Error("No registration options received from server");
            }

            // 2) parse options JSON string
            const creationOptions = JSON.parse(optionsJson);

            // 3) create passkey
            const credential = await webauthnJson.create(creationOptions);

            if (!credential) {
                throw new Error("Credential creation failed");
            }

            // 4) send credential back to backend
            const payload = {
                credentialJson: JSON.stringify(credential),
                deviceName: cleanDeviceName,
            };

            await api.post("/v1/emp/passkey/register/verify", payload);

            setStatus("✅ Passkey registered successfully!");
        } catch (err) {
            console.error("Passkey registration error:", err);
            setStatus(`❌ ${getErrorMessage(err)}`);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-md mx-auto py-10 text-center">
            <div className="flex justify-center mb-4">
                <Fingerprint className="h-12 w-12 text-slate-700" />
            </div>

            <h2 className="text-xl font-bold text-slate-900">
                Register Device Passkey
            </h2>

            <p className="text-sm text-slate-600 mt-2">
                Register this device using fingerprint, Face ID, or device screen lock.
            </p>

            <div className="mt-5 text-left">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                    Device Name
                </label>
                <input
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    placeholder="Enter device name"
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-900"
                />
                <p className="mt-2 text-xs text-slate-500">
                    Use a name like “My Android Phone” or “Office Laptop”.
                </p>
            </div>

            <button
                onClick={registerPasskey}
                disabled={loading}
                className="mt-6 w-full rounded-2xl bg-slate-900 text-white py-3 font-semibold hover:bg-slate-800 transition disabled:opacity-50"
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

            {status && (
                <div className="mt-4 text-sm text-slate-700">
                    {status}
                </div>
            )}
        </div>
    );
}