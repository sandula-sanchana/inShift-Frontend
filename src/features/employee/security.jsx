import React, { useState } from "react";
import { Fingerprint, Loader2 } from "lucide-react";
import { api } from "../../lib/api.js";

function base64UrlToBuffer(base64url) {
    const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
}

function bufferToBase64Url(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";

    for (const b of bytes) {
        binary += String.fromCharCode(b);
    }

    return window
        .btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
}

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

            // 1) get register options from backend
            const res = await api.post("/v1/emp/passkey/register/options");
            const options = res?.data?.data;

            if (!options) {
                throw new Error("No registration options received from server");
            }

            // 2) convert challenge + user.id to buffers for WebAuthn API
            const publicKey = {
                ...options,
                challenge: base64UrlToBuffer(options.challenge),
                user: {
                    ...options.user,
                    id: base64UrlToBuffer(options.user.id),
                },
                pubKeyCredParams: options.pubKeyCredParams,
            };

            // 3) trigger browser/device passkey creation
            const credential = await navigator.credentials.create({ publicKey });

            if (!credential) {
                throw new Error("Credential creation failed");
            }

            const response = credential.response;

            // 4) extract real public key from authenticator response
            if (typeof response.getPublicKey !== "function") {
                throw new Error("This browser does not support public key extraction");
            }

            const extractedPublicKey = response.getPublicKey();

            if (!extractedPublicKey) {
                throw new Error("Failed to extract public key from authenticator");
            }

            // 5) send real public key to backend
            const payload = {
                credentialId: credential.id,
                publicKey: bufferToBase64Url(extractedPublicKey),
                signCount: 0,
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