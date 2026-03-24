import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate, Routes, Route, Navigate } from "react-router-dom";
import {
    LayoutDashboard,
    Bell,
    BadgeCheck,
    Fingerprint,
    CalendarDays,
    Clock3,
    ShieldCheck,
    LogOut,
    ClipboardList
} from "lucide-react";

import { cn } from "../../lib/cn";
import { api } from "../../lib/api.js";
import { authStore } from "../../features/auth/store";
import { LogoMark } from "../../components/common/Logo";
import { useToast } from "../../components/ui/Toast.jsx";
import {
    listenForeground,
    syncExistingNotificationToken
} from "../../lib/notifications.js";
import { useServiceWorkerNavigation } from "../../lib/useServiceWorkerNavigation.js";
import { getOrCreateDeviceFingerprint } from "../../lib/deviceFingerprint.js";

import Notifications from "../../features/employee/notification/Notifications.jsx";
import Attendance from "../../features/employee/Attendance/Attendance.jsx";
import Verify from "../../features/employee/verification/Verify.jsx";
import Shifts from "../../features/employee/shifts/Shifts.jsx";
import Security from "../../features/employee/security.jsx";
import Corrections from "../../features/employee/AttendanceCorrections.jsx";
import PresenceCheck from "../../features/employee/PresenceCheck.jsx";

function detectRequestedTrustType() {
    const ua = navigator.userAgent || "";
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
    return isMobile ? "MOBILE" : "COMPANY_PC";
}

function buildDeviceName() {
    const ua = navigator.userAgent || "Unknown Device";

    if (/Android/i.test(ua)) return "Android Device";
    if (/iPhone/i.test(ua)) return "iPhone";
    if (/iPad/i.test(ua)) return "iPad";
    if (/Windows/i.test(ua)) return "Windows PC";
    if (/Macintosh|Mac OS X/i.test(ua)) return "Mac";
    if (/Linux/i.test(ua)) return "Linux Device";

    return "Unknown Device";
}

function NavItem({ to, icon: Icon, label }) {
    return (
        <NavLink
            to={to}
            end={to === "/emp"}
            className={({ isActive }) =>
                cn(
                    "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition",
                    "ring-1 ring-transparent focus:outline-none focus-visible:ring-slate-300",
                    !isActive && "text-slate-700 hover:bg-slate-50 hover:text-slate-900",
                    isActive && "bg-slate-900 text-white shadow-sm ring-1 ring-slate-900"
                )
            }
        >
            <span
                className={cn(
                    "grid h-8 w-8 place-items-center rounded-xl transition",
                    "ring-1 ring-slate-200 bg-white text-slate-700",
                    "group-hover:bg-white group-hover:text-slate-900",
                    "group-[.bg-slate-900]:bg-slate-800 group-[.bg-slate-900]:text-white group-[.bg-slate-900]:ring-slate-700"
                )}
            >
                <Icon className="h-4.5 w-4.5" />
            </span>
            <span className="truncate">{label}</span>
        </NavLink>
    );
}

function EmpOverview() {
    return (
        <>
            <div className="text-xl font-bold text-slate-900">Employee Dashboard</div>
            <div className="mt-2 text-sm text-slate-600">
                Quick overview of your attendance, shifts, and OT.
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="text-sm font-semibold text-slate-900">Today</div>
                    <div className="mt-1 text-xs text-slate-600">Check-in status</div>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="text-sm font-semibold text-slate-900">Shifts</div>
                    <div className="mt-1 text-xs text-slate-600">Next upcoming shift</div>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="text-sm font-semibold text-slate-900">OT</div>
                    <div className="mt-1 text-xs text-slate-600">This week OT hours</div>
                </div>
            </div>
        </>
    );
}

function DevicePendingApproval() {
    return (
        <div className="mx-auto max-w-xl rounded-3xl border border-amber-200 bg-amber-50 p-6">
            <div className="text-lg font-bold text-amber-900">Device Pending Approval</div>
            <p className="mt-2 text-sm text-amber-800">
                This device has been registered and is waiting for admin approval.
                Until approval, trusted verification features will remain blocked.
            </p>
        </div>
    );
}

function DeviceRejectedNotice() {
    return (
        <div className="mx-auto max-w-xl rounded-3xl border border-rose-200 bg-rose-50 p-6">
            <div className="text-lg font-bold text-rose-900">Device Not Approved</div>
            <p className="mt-2 text-sm text-rose-800">
                This device was rejected or revoked. Please contact your administrator or sign in from an approved device.
            </p>
        </div>
    );
}

export default function EmployeeDashboard() {
    const navigate = useNavigate();
    const toast = useToast((s) => s.push);

    const user = authStore((s) => s.user);
    const clearSession = authStore((s) => s.clearSession);

    const [me, setMe] = useState(null);
    const [meLoading, setMeLoading] = useState(true);

    const [deviceEnrollment, setDeviceEnrollment] = useState(null);
    const [deviceLoading, setDeviceLoading] = useState(true);

    useServiceWorkerNavigation();

    useEffect(() => {
        let ignore = false;

        async function bootstrap() {
            setMeLoading(true);
            setDeviceLoading(true);

            try {
                const meRes = await api.get("/v1/emp/me");
                const meData = meRes?.data?.data || null;

                if (!ignore) setMe(meData);

                const enrollPayload = {
                    deviceFingerprint: getOrCreateDeviceFingerprint(),
                    deviceName: buildDeviceName(),
                    userAgent: navigator.userAgent || "",
                    requestedTrustType: detectRequestedTrustType(),
                };

                const enrollRes = await api.post("/v1/emp/device/enroll", enrollPayload);
                const enrollData = enrollRes?.data?.data || null;

                if (!ignore) {
                    setDeviceEnrollment(enrollData);
                }
            } catch (err) {
                console.error("Dashboard bootstrap failed:", err);

                if (!ignore) {
                    setMe(null);
                    setDeviceEnrollment(null);
                }
            } finally {
                if (!ignore) {
                    setMeLoading(false);
                    setDeviceLoading(false);
                }
            }
        }

        bootstrap();

        return () => {
            ignore = true;
        };
    }, []);

    useEffect(() => {
        const unsubscribe = listenForeground((payload) => {
            toast({
                title: payload?.notification?.title || "InShift",
                message: payload?.notification?.body || "New notification received.",
                variant: "success",
            });
        });

        return () => {
            if (typeof unsubscribe === "function") unsubscribe();
        };
    }, [toast]);

    useEffect(() => {
        if (!me) return;

        syncExistingNotificationToken().catch((err) => {
            console.error("Notification token sync failed:", err);
        });
    }, [me]);

    const nav = useMemo(
        () => [
            { to: "/emp", icon: LayoutDashboard, label: "Overview" },
            { to: "/emp/notifications", icon: Bell, label: "Notifications" },
            { to: "/emp/attendance", icon: BadgeCheck, label: "Attendance" },
            { to: "/emp/presence-check", icon: ShieldCheck, label: "Presence Check" },
            { to: "/emp/corrections", icon: ClipboardList, label: "Corrections" },
            { to: "/emp/verify", icon: Fingerprint, label: "Verify" },
            { to: "/emp/shifts", icon: CalendarDays, label: "My Shifts" },
            { to: "/emp/ot", icon: Clock3, label: "My OT" },
            { to: "/emp/security", icon: ShieldCheck, label: "Security" },
        ],
        []
    );

    if (!meLoading && me?.mustChangePassword) {
        return <Navigate to="/force-change-password" replace />;
    }

    if (meLoading || deviceLoading) {
        return (
            <div className="min-h-screen grid place-items-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
                <div className="rounded-2xl bg-white px-6 py-4 shadow-sm ring-1 ring-slate-200">
                    <div className="text-sm font-semibold text-slate-900">Loading your workspace...</div>
                </div>
            </div>
        );
    }

    const approvalStatus = deviceEnrollment?.approvalStatus;
    const approvedType = deviceEnrollment?.approvedTrustType;

    const isPending = approvalStatus === "PENDING";
    const isApproved = approvalStatus === "APPROVED";
    const isRejected = approvalStatus === "REJECTED" || approvalStatus === "REVOKED";

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
            <div className="mx-auto max-w-7xl px-4 py-6 lg:py-8">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                            <LogoMark />
                        </div>
                        <div className="leading-tight">
                            <div className="text-base font-semibold text-slate-900">InShift</div>
                            <div className="text-xs text-slate-600">Employee Portal</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-sm font-bold text-slate-900">
                            {me?.fullName || user?.email || "Employee"}
                        </div>

                        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-500">
                            {me?.role || user?.role || "EMPLOYEE"}
                        </div>

                        {deviceEnrollment && (
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                                <div className="font-semibold text-slate-900">
                                    Device: {approvalStatus || "UNKNOWN"}
                                </div>
                                <div className="text-slate-600">
                                    {approvedType || "Awaiting approval"}
                                </div>
                            </div>
                        )}

                        <button
                            className={cn(
                                "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition-all",
                                "border border-rose-200 bg-rose-50 text-rose-600 shadow-sm",
                                "hover:bg-rose-500 hover:text-white hover:shadow-lg hover:shadow-rose-500/20"
                            )}
                            onClick={() => {
                                clearSession();
                                navigate("/login");
                            }}
                        >
                            <LogOut className="h-4 w-4" />
                            Sign out
                        </button>
                    </div>
                </div>

                {isPending ? (
                    <div className="mt-8">
                        <DevicePendingApproval />
                    </div>
                ) : isRejected ? (
                    <div className="mt-8">
                        <DeviceRejectedNotice />
                    </div>
                ) : (
                    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr] lg:gap-8">
                        <aside className="h-fit rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
                            <div className="px-4 py-4">
                                <div className="text-sm font-semibold text-slate-900">Navigation</div>
                                <div className="text-xs text-slate-600">Employee modules</div>
                            </div>

                            <div className="px-3 pb-3 space-y-1">
                                {nav.map((n) => (
                                    <NavItem key={n.to} {...n} />
                                ))}
                            </div>
                        </aside>

                        <main className="min-w-0 rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 p-6">
                            {!isApproved && (
                                <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                    This device is not fully approved yet.
                                </div>
                            )}

                            {isApproved && approvedType === "MOBILE" && (
                                <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                                    This device is approved as a trusted mobile device. You can register and use passkey on this device.
                                </div>
                            )}

                            {isApproved && approvedType === "COMPANY_PC" && (
                                <div className="mb-4 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
                                    This device is approved as a trusted company PC. Presence confirmation can be completed directly from this terminal.
                                </div>
                            )}

                            <Routes>
                                <Route index element={<EmpOverview />} />
                                <Route path="notifications" element={<Notifications />} />
                                <Route path="attendance" element={<Attendance />} />
                                <Route path="presence-check" element={<PresenceCheck />} />
                                <Route path="corrections" element={<Corrections />} />
                                <Route path="verify" element={<Verify />} />
                                <Route
                                    path="shifts"
                                    element={<Shifts />}
                                />
                                <Route
                                    path="ot"
                                    element={<div className="text-slate-900 font-semibold">My OT Page</div>}
                                />
                                <Route path="security" element={<Security />} />
                                <Route path="*" element={<Navigate to="/emp" replace />} />
                            </Routes>
                        </main>
                    </div>
                )}
            </div>
        </div>
    );
}