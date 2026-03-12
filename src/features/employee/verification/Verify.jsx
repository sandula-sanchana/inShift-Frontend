import React, { useState } from "react";
import { Fingerprint, Loader2, CheckCircle2 } from "lucide-react";
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

export default function Verify() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");

    async function verifyPasskey() {
        try {
            setLoading(true);
            setStatus("");

            // 1) get assertion options JSON string from backend
            const res = await api.post("/v1/emp/passkey/assertion/options");
            const optionsJson = res?.data?.data;

            if (!optionsJson) {
                throw new Error("No assertion options received from server");
            }

            // 2) parse backend JSON string into object
            const requestOptions = JSON.parse(optionsJson);

            // 3) ask browser/device to verify with passkey
            const credential = await webauthnJson.get(requestOptions);

            if (!credential) {
                throw new Error("Passkey verification was cancelled or failed");
            }

            // 4) send full assertion JSON to backend
            await api.post("/v1/emp/passkey/assertion/verify", {
                credentialJson: JSON.stringify(credential),
            });

            setStatus("✅ Passkey verified successfully!");
        } catch (err) {
            console.error("Passkey assertion error:", err);
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
                Verify Registered Passkey
            </h2>

            <p className="text-sm text-slate-600 mt-2">
                Test whether your registered passkey works on this device using fingerprint,
                Face ID, or screen lock.
            </p>

            <button
                onClick={verifyPasskey}
                disabled={loading}
                className="mt-6 w-full rounded-2xl bg-slate-900 text-white py-3 font-semibold hover:bg-slate-800 transition disabled:opacity-50"
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

            {status && (
                <div className="mt-4 text-sm text-slate-700 flex items-center justify-center gap-2">
                    {status.startsWith("✅") && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    <span>{status}</span>
                </div>
            )}
        </div>
    );
}