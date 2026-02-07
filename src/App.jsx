import { useMemo, useState } from "react";

/**
 * InShift Employee Dashboard (MVP UI)
 * - Today status (checked-in source + time + location)
 * - Actions: Mobile biometric check-in, Web manual check-in (mocked)
 * - Presence check card (confirm / missed)
 * - Leave quick actions
 *
 * Replace mock data with real API calls later.
 */

const mockEmployee = {
    name: "Sandula",
    branch: "Colombo",
    team: "Operations",
};

const initialToday = {
    dateLabel: new Date().toLocaleDateString(),
    checkIn: {
        status: "NOT_CHECKED_IN", // NOT_CHECKED_IN | CHECKED_IN | PENDING_APPROVAL
        source: null, // ENTRANCE_MACHINE | MOBILE_BIOMETRIC | WEB_MANUAL
        time: null,
        location: null, // "6.92, 79.86" or "Colombo"
    },
    presence: {
        status: "PENDING", // PENDING | CONFIRMED | MISSED | EXEMPT
        dueInMinutes: 8,
        expiresInMinutes: 10,
    },
    leave: {
        todayExempt: false,
        pendingRequests: 1,
    },
};

function pillClass(kind) {
    switch (kind) {
        case "good":
            return "bg-green-50 text-green-700 border-green-200";
        case "warn":
            return "bg-yellow-50 text-yellow-800 border-yellow-200";
        case "bad":
            return "bg-red-50 text-red-700 border-red-200";
        default:
            return "bg-gray-50 text-gray-700 border-gray-200";
    }
}

function sourceLabel(src) {
    if (src === "ENTRANCE_MACHINE") return "Entrance machine";
    if (src === "MOBILE_BIOMETRIC") return "Mobile biometric";
    if (src === "WEB_MANUAL") return "Web manual";
    return "—";
}

export default function App() {
    const [today, setToday] = useState(initialToday);
    const [toast, setToast] = useState(null);

    const statusPill = useMemo(() => {
        const s = today.checkIn.status;
        if (s === "CHECKED_IN") return { text: "Checked in", kind: "good" };
        if (s === "PENDING_APPROVAL") return { text: "Pending approval", kind: "warn" };
        return { text: "Not checked in", kind: "bad" };
    }, [today.checkIn.status]);

    function showToast(message) {
        setToast(message);
        window.clearTimeout(showToast._t);
        showToast._t = window.setTimeout(() => setToast(null), 2200);
    }

    async function getLocationMock() {
        // Later: navigator.geolocation.getCurrentPosition(...)
        // For now: fake GPS-ish text.
        return "6.9271, 79.8612";
    }

    async function mobileBiometricCheckIn() {
        const loc = await getLocationMock();
        // Later: run WebAuthn/passkey flow, then POST /attendance/check-in/webauthn
        setToday((t) => ({
            ...t,
            checkIn: {
                status: "CHECKED_IN",
                source: "MOBILE_BIOMETRIC",
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                location: loc,
            },
        }));
        showToast("Checked in via mobile biometric (mock).");
    }

    async function webManualCheckIn() {
        const loc = await getLocationMock();
        // If your policy requires manager approval for manual:
        setToday((t) => ({
            ...t,
            checkIn: {
                status: "PENDING_APPROVAL",
                source: "WEB_MANUAL",
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                location: loc,
            },
        }));
        showToast("Manual check-in submitted (mock).");
    }

    function confirmPresence() {
        setToday((t) => ({
            ...t,
            presence: { ...t.presence, status: "CONFIRMED" },
        }));
        showToast("Presence confirmed (mock).");
    }

    function requestLeave() {
        showToast("Open Leave Request form (next screen).");
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            {/* Top bar */}
            <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                            IS
                        </div>
                        <div>
                            <div className="text-sm text-slate-500">InShift • Employee</div>
                            <div className="font-semibold">{mockEmployee.name}</div>
                        </div>
                    </div>
                    <div className="text-right text-sm">
                        <div className="text-slate-500">{mockEmployee.branch}</div>
                        <div className="font-medium">{mockEmployee.team}</div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="mx-auto max-w-6xl px-4 py-6">
                {/* Toast */}
                {toast && (
                    <div className="mb-4 rounded-xl border bg-white px-4 py-3 text-sm shadow-sm">
                        {toast}
                    </div>
                )}

                {/* Hero / status */}
                <section className="grid gap-4 md:grid-cols-3">
                    <div className="md:col-span-2 rounded-2xl border bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h1 className="text-xl font-semibold">Today</h1>
                                <p className="text-sm text-slate-500">Date: {today.dateLabel}</p>
                            </div>
                            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm ${pillClass(statusPill.kind)}`}>
                {statusPill.text}
              </span>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            <InfoCard label="Check-in source" value={sourceLabel(today.checkIn.source)} />
                            <InfoCard label="Check-in time" value={today.checkIn.time ?? "—"} />
                            <InfoCard label="Location" value={today.checkIn.location ?? "—"} />
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                            <PrimaryButton onClick={mobileBiometricCheckIn} disabled={today.checkIn.status === "CHECKED_IN"}>
                                Check-in with fingerprint
                            </PrimaryButton>
                            <SecondaryButton onClick={webManualCheckIn} disabled={today.checkIn.status === "CHECKED_IN"}>
                                Manual check-in
                            </SecondaryButton>
                            <SecondaryButton onClick={requestLeave}>Request leave</SecondaryButton>
                        </div>

                        <p className="mt-3 text-xs text-slate-500">
                            Note: Biometric check-in uses passkeys/WebAuthn in the real system. This screen uses mock behavior for now.
                        </p>
                    </div>

                    {/* Presence card */}
                    <div className="rounded-2xl border bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-semibold">Presence check</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Keep your status verified during work hours.
                        </p>

                        <div className="mt-4 rounded-xl border bg-slate-50 p-4">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-medium">Status</div>
                                <span
                                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${
                                        today.presence.status === "CONFIRMED"
                                            ? pillClass("good")
                                            : today.presence.status === "MISSED"
                                                ? pillClass("bad")
                                                : pillClass("warn")
                                    }`}
                                >
                  {today.presence.status}
                </span>
                            </div>

                            <div className="mt-3 text-xs text-slate-600">
                                Due in: <b>{today.presence.dueInMinutes} min</b> • Expires in: <b>{today.presence.expiresInMinutes} min</b>
                            </div>

                            <div className="mt-4">
                                <PrimaryButton onClick={confirmPresence} disabled={today.presence.status === "CONFIRMED"}>
                                    Confirm now
                                </PrimaryButton>
                            </div>
                        </div>

                        <div className="mt-4 text-xs text-slate-500">
                            If you are on approved leave, checks will be marked exempt automatically.
                        </div>
                    </div>
                </section>

                {/* Bottom section */}
                <section className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-semibold">Leave</h2>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <InfoCard label="Exempt today" value={today.leave.todayExempt ? "Yes" : "No"} />
                            <InfoCard label="Pending requests" value={String(today.leave.pendingRequests)} />
                        </div>
                        <div className="mt-4 text-sm text-slate-500">
                            Submit leave requests and track approval status.
                        </div>
                    </div>

                    <div className="rounded-2xl border bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-semibold">Quick tips</h2>
                        <ul className="mt-3 list-disc pl-5 text-sm text-slate-600 space-y-2">
                            <li>Prefer <b>entrance machine</b> when on-site.</li>
                            <li>Use <b>mobile biometric + GPS</b> for reliable verification.</li>
                            <li>Manual check-in may require approval depending on branch policy.</li>
                            <li>Reports and exports are available for managers and admins.</li>
                        </ul>
                    </div>
                </section>
            </main>
        </div>
    );
}

function InfoCard({ label, value }) {
    return (
        <div className="rounded-xl border bg-white p-4">
            <div className="text-xs text-slate-500">{label}</div>
            <div className="mt-1 font-semibold">{value}</div>
        </div>
    );
}

function PrimaryButton({ children, onClick, disabled }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={[
                "rounded-xl px-4 py-2 text-sm font-semibold shadow-sm",
                "bg-slate-900 text-white hover:bg-slate-800",
                "disabled:opacity-50 disabled:cursor-not-allowed",
            ].join(" ")}
        >
            {children}
        </button>
    );
}

function SecondaryButton({ children, onClick, disabled }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={[
                "rounded-xl px-4 py-2 text-sm font-semibold",
                "border bg-white hover:bg-slate-50",
                "disabled:opacity-50 disabled:cursor-not-allowed",
            ].join(" ")}
        >
            {children}
        </button>
    );
}
