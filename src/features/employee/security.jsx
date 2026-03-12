import React, { useState } from "react";
import { Fingerprint, Loader2 } from "lucide-react";
import * as webauthnJson from "@github/webauthn-json";
import { api } from "../../lib/api.js";

function getErrorMessage(err, fallback = "Passkey registration failed") {
    const msgFromBackend = err?.response?.data?.message || err?.response?.data?.msg;
    if (msgFromBackend) return msgFromBackend;
    return err?.message || fallback;
}

export default function Verify() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");

    async function registerPasskey() {
        try {
            setLoading(true);
            setStatus("");

            // 1) get registration options JSON string from backend
            const res = await api.post("/v1/emp/passkey/register/options");
            const optionsJson = res?.data?.data;

            if (!optionsJson) {
                throw new Error("No registration options received from server");
            }

            // 2) parse backend JSON string into object
            const creationOptions = JSON.parse(optionsJson);

            // 3) create passkey using webauthn-json helper
            const credential = await webauthnJson.create(creationOptions);

            if (!credential) {
                throw new Error("Credential creation failed");
            }

            // 4) send full encoded credential JSON to backend
            const payload = {
                credentialJson: JSON.stringify(credential),
                deviceName: navigator.userAgent,
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