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
    ClipboardList,
    ChevronRight,
    UserCircle2,
    Smartphone,
    Monitor,
    Sparkles,
    Zap,
    AlertTriangle
} from "lucide-react";

import { cn } from "../../lib/cn";
import { api } from "../../lib/api.js";
import { authStore } from "../../features/auth/store";
import { LogoMark } from "../../components/common/Logo";
import { useToast } from "../../components/ui/toast-store.js";
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
import MyOvertime from "../../features/employee/MyOvertime.jsx";

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
                    "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 overflow-hidden",
                    !isActive && "text-slate-400 hover:text-white hover:bg-white/5",
                    isActive && "text-white bg-indigo-600/10"
                )
            }
        >
            {({ isActive }) => (
                <>
                    {isActive && (
                        <div className="absolute left-0 h-6 w-1 rounded-r-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.8)]" />
                    )}
                    <Icon
                        className={cn(
                            "h-5 w-5 transition-all duration-300 shrink-0",
                            isActive
                                ? "text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]"
                                : "text-slate-500 group-hover:text-slate-300"
                        )}
                    />
                    <span className="relative z-10 truncate">{label}</span>
                    {isActive && (
                        <div className="ml-auto opacity-40">
                            <ChevronRight className="h-4 w-4" />
                        </div>
                    )}
                </>
            )}
        </NavLink>
    );
}

function OverviewStatCard({ title, value, icon: Icon, tone = "slate", subtitle }) {
    const tones = {
        green: "from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20",
        red: "from-rose-500/20 to-rose-500/5 text-rose-400 border-rose-500/20",
        yellow: "from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20",
        indigo: "from-indigo-500/20 to-indigo-500/5 text-indigo-400 border-indigo-500/20",
        purple: "from-purple-500/20 to-purple-500/5 text-purple-400 border-purple-500/20",
        slate: "from-slate-500/20 to-slate-500/5 text-slate-400 border-slate-500/20",
        cyan: "from-cyan-500/20 to-cyan-500/5 text-cyan-400 border-cyan-500/20",
    };

    const selectedTone = tones[tone] || tones.slate;

    return (
        <div
            className={cn(
                "relative group overflow-hidden rounded-2xl border bg-slate-900/40 backdrop-blur-md p-6 transition-all duration-500 hover:-translate-y-1 hover:border-white/20",
                selectedTone.split(" ").pop()
            )}
        >
            <div
                className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                    selectedTone
                )}
            />

            <div className="relative z-10 flex items-start justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">
                        {title}
                    </p>
                    <div className="mt-3 flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold tracking-tight text-white">{value}</h3>
                    </div>
                    {subtitle && (
                        <p className="mt-2 text-xs text-slate-400 leading-relaxed max-w-[180px]">
                            {subtitle}
                        </p>
                    )}
                </div>

                <div
                    className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl border border-white/5 bg-white/5 backdrop-blur-xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
                        selectedTone.split(" ")[2]
                    )}
                >
                    <Icon className="h-6 w-6" />
                </div>
            </div>

            <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-white/5 blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
        </div>
    );
}

function ModuleCard({ title, subtitle, icon: Icon, tone = "indigo" }) {
    const tones = {
        indigo: "text-indigo-400 border-indigo-500/20 bg-indigo-500/5",
        purple: "text-purple-400 border-purple-500/20 bg-purple-500/5",
        cyan: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5",
        emerald: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
    };

    return (
        <div className="group relative flex items-center gap-4 rounded-2xl border border-white/5 bg-slate-900/30 p-5 backdrop-blur-sm transition-all hover:bg-slate-800/50 hover:border-white/10">
            <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-all duration-300", tones[tone])}>
                <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
                <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">{title}</h4>
                <p className="truncate text-xs text-slate-500">{subtitle}</p>
            </div>
            <Zap className="ml-auto h-4 w-4 text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
}

function DevicePendingApproval() {
    return (
        <div className="mx-auto max-w-2xl rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6 backdrop-blur-md text-amber-300">
            <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl border border-amber-500/20 bg-amber-500/10">
                    <Smartphone className="h-5 w-5" />
                </div>
                <div>
                    <div className="text-lg font-bold text-amber-200">Device Pending Approval</div>
                    <p className="mt-2 text-sm leading-6 text-amber-300/90">
                        This device has been registered and is waiting for admin approval.
                        Until approval, trusted verification features will remain blocked.
                    </p>
                </div>
            </div>
        </div>
    );
}

function DeviceRejectedNotice() {
    return (
        <div className="mx-auto max-w-2xl rounded-3xl border border-rose-500/20 bg-rose-500/5 p-6 backdrop-blur-md text-rose-300">
            <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl border border-rose-500/20 bg-rose-500/10">
                    <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                    <div className="text-lg font-bold text-rose-200">Device Not Approved</div>
                    <p className="mt-2 text-sm leading-6 text-rose-300/90">
                        This device was rejected or revoked. Please contact your administrator or sign in from an approved device.
                    </p>
                </div>
            </div>
        </div>
    );
}

function InfoBanner({ children, tone = "slate" }) {
    const toneClasses = {
        amber: "border-amber-500/20 bg-amber-500/5 text-amber-300",
        emerald: "border-emerald-500/20 bg-emerald-500/5 text-emerald-300",
        indigo: "border-indigo-500/20 bg-indigo-500/5 text-indigo-300",
        slate: "border-white/10 bg-white/[0.03] text-slate-300",
    };

    return (
        <div className={cn("mb-4 rounded-2xl border px-4 py-3 text-sm backdrop-blur-md", toneClasses[tone] || toneClasses.slate)}>
            {children}
        </div>
    );
}

function EmpOverview({ me, deviceEnrollment }) {
    const approvalStatus = deviceEnrollment?.approvalStatus || "UNKNOWN";
    const approvedType = deviceEnrollment?.approvedTrustType || "Awaiting approval";

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-8 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
                        <h1 className="text-3xl font-black tracking-tight text-white lg:text-4xl">
                            Employee Dashboard
                        </h1>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                        Manage your attendance, presence verification, shifts, overtime, and security tools.
                    </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-md">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-indigo-400">
                        <Sparkles className="h-3.5 w-3.5" />
                        Smart Workforce Workspace
                    </div>
                    <div className="mt-2 text-sm font-semibold text-white">
                        Welcome back, {me?.fullName || "Employee"}
                    </div>
                </div>
            </header>

            <div className="mt-10">
                <h2 className="mb-6 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    Your Access Overview
                </h2>

                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                    <OverviewStatCard
                        title="Attendance"
                        value="Ready"
                        subtitle="Open check-in, check-out, and daily attendance pages"
                        icon={BadgeCheck}
                        tone="green"
                    />
                    <OverviewStatCard
                        title="Presence Checks"
                        value={approvalStatus === "APPROVED" ? "Enabled" : "Restricted"}
                        subtitle="Presence verification depends on your trusted device state"
                        icon={ShieldCheck}
                        tone="indigo"
                    />
                    <OverviewStatCard
                        title="Trusted Device"
                        value={approvedType}
                        subtitle="Current approved trust channel for this device"
                        icon={approvedType === "COMPANY_PC" ? Monitor : Smartphone}
                        tone="cyan"
                    />
                    <OverviewStatCard
                        title="Overtime"
                        value="Track"
                        subtitle="Open OT history and related employee actions"
                        icon={Clock3}
                        tone="purple"
                    />
                </div>
            </div>

            <div className="mt-12">
                <h2 className="mb-6 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    Employee Modules
                </h2>

                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    <ModuleCard
                        title="Attendance"
                        subtitle="Daily attendance status, logs, and check actions"
                        icon={BadgeCheck}
                        tone="indigo"
                    />
                    <ModuleCard
                        title="Presence Verification"
                        subtitle="Trusted PC or biometric + GPS confirmation"
                        icon={ShieldCheck}
                        tone="purple"
                    />
                    <ModuleCard
                        title="Notifications"
                        subtitle="System alerts, presence checks, and status updates"
                        icon={Bell}
                        tone="cyan"
                    />
                    <ModuleCard
                        title="Corrections"
                        subtitle="Submit missed punch and attendance fix requests"
                        icon={ClipboardList}
                        tone="emerald"
                    />
                    <ModuleCard
                        title="Shifts"
                        subtitle="See upcoming schedules and assigned shift details"
                        icon={CalendarDays}
                        tone="indigo"
                    />
                    <ModuleCard
                        title="Security"
                        subtitle="Trusted device and passkey management"
                        icon={Fingerprint}
                        tone="purple"
                    />
                </div>
            </div>

            <div className="mt-12 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
                    <div className="text-lg font-bold text-white">Workspace Summary</div>
                    <div className="mt-2 text-sm text-slate-400">
                        Your portal is connected to attendance operations, trusted-device verification, correction requests,
                        overtime records, and notification-driven actions.
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                            <div className="text-sm font-semibold text-white">Presence Workflow</div>
                            <div className="mt-2 text-xs leading-5 text-slate-400">
                                Presence requests can require company PC confirmation or mobile biometric + GPS validation depending on policy.
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                            <div className="text-sm font-semibold text-white">Trusted Device Security</div>
                            <div className="mt-2 text-xs leading-5 text-slate-400">
                                Your device approval and passkey setup control access to sensitive employee actions.
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                            <div className="text-sm font-semibold text-white">Attendance Corrections</div>
                            <div className="mt-2 text-xs leading-5 text-slate-400">
                                Submit correction requests for attendance problems while keeping a proper audit trail.
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                            <div className="text-sm font-semibold text-white">Overtime & Shifts</div>
                            <div className="mt-2 text-xs leading-5 text-slate-400">
                                Review shift schedules, OT records, and related actions from the employee modules.
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/5 text-slate-300 border border-white/10">
                            <UserCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-white">Profile Snapshot</div>
                            <div className="text-xs text-slate-500">Current session information</div>
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Name</div>
                            <div className="mt-2 text-sm font-semibold text-white">{me?.fullName || "--"}</div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Email</div>
                            <div className="mt-2 text-sm font-semibold text-white">{me?.email || "--"}</div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Role</div>
                            <div className="mt-2 text-sm font-semibold text-white">{me?.role || "EMPLOYEE"}</div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Device Approval</div>
                            <div className="mt-2 text-sm font-semibold text-white">
                                {deviceEnrollment?.approvalStatus || "UNKNOWN"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
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
            const title = payload?.notification?.title || "InShift";
            const message = payload?.notification?.body || "New notification received.";

            console.log("FOREGROUND PUSH", payload);

            toast({
                title,
                message,
                variant: "success",
            });

            if ("Notification" in window && Notification.permission === "granted") {
                new Notification(title, {
                    body: message,
                });
            }
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
            <div className="min-h-screen bg-[#020617] text-slate-300 selection:bg-indigo-500/30 font-sans antialiased overflow-x-hidden">
                <div className="fixed inset-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-indigo-600/10 blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-purple-600/5 blur-[120px]" />
                </div>

                <div className="relative min-h-screen grid place-items-center">
                    <div className="rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-2xl px-6 py-5 shadow-2xl">
                        <div className="text-sm font-semibold text-white">Loading your workspace...</div>
                    </div>
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
        <div className="min-h-screen bg-[#020617] text-slate-300 selection:bg-indigo-500/30 font-sans antialiased overflow-x-hidden">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-indigo-600/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-purple-600/5 blur-[120px]" />
                <div className="absolute inset-0 opacity-20 brightness-50 contrast-150 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.10),transparent_25%)]" />
            </div>

            <div className="relative mx-auto w-full max-w-[1700px] px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 px-8 py-5 shadow-2xl">
                    <div className="flex items-center gap-5">
                        <div className="relative group">
                            <div className="absolute inset-0 rounded-2xl bg-indigo-500 blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
                            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-xl">
                                <LogoMark />
                            </div>
                        </div>
                        <div>
                            <div className="text-xl font-black tracking-tighter text-white">
                                InShift<span className="text-indigo-500">.</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-1 w-1 rounded-full bg-indigo-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    Employee Portal
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-4 px-4 py-2 rounded-2xl bg-white/5 border border-white/5">
                            <div className="leading-tight text-right">
                                <p className="text-sm font-bold text-white">
                                    {me?.fullName || user?.email || "Employee"}
                                </p>
                                <p className="text-[10px] font-medium text-indigo-400 uppercase tracking-tight">
                                    {me?.role || user?.role || "EMPLOYEE"}
                                </p>
                            </div>
                        </div>

                        {deviceEnrollment && (
                            <div className="hidden lg:flex items-center gap-4 px-4 py-2 rounded-2xl bg-white/5 border border-white/5">
                                <div className="leading-tight text-right">
                                    <p className="text-sm font-bold text-white">
                                        {approvalStatus || "UNKNOWN"}
                                    </p>
                                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">
                                        {approvedType || "Awaiting approval"}
                                    </p>
                                </div>
                            </div>
                        )}

                        <button
                            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 transition-all hover:bg-rose-500 hover:text-white hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] active:scale-90"
                            onClick={() => {
                                clearSession();
                                navigate("/login");
                            }}
                        >
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </header>

                {isPending ? (
                    <div className="mt-8">
                        <DevicePendingApproval />
                    </div>
                ) : isRejected ? (
                    <div className="mt-8">
                        <DeviceRejectedNotice />
                    </div>
                ) : (
                    <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[280px_1fr] 2xl:grid-cols-[300px_1fr]">
                        <aside className="sticky top-8 h-fit space-y-4">
                            <div className="rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-xl p-3 shadow-sm">
                                <div className="px-4 py-4 mb-2">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                                        Navigation
                                    </p>
                                    <p className="text-[10px] text-slate-500 mt-1">Employee modules</p>
                                </div>

                                <nav className="space-y-1">
                                    {nav.map((n) => (
                                        <NavItem key={n.to} {...n} />
                                    ))}
                                </nav>
                            </div>

                            <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-900 p-6 text-white shadow-xl overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-2 opacity-20">
                                    <ShieldCheck className="h-24 w-24 -mr-8 -mt-8" />
                                </div>
                                <h4 className="text-sm font-bold relative z-10">Trusted Session</h4>
                                <p className="mt-1 text-xs text-indigo-100 opacity-80 relative z-10">
                                    Connected to secure employee services.
                                </p>
                            </div>
                        </aside>

                        <main className="min-w-0">
                            <div className="min-h-[700px] rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
                                <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/5 blur-3xl" />

                                <div className="relative z-10 p-8 sm:p-10 lg:p-12">
                                    {!isApproved && (
                                        <InfoBanner tone="amber">
                                            This device is not fully approved yet.
                                        </InfoBanner>
                                    )}

                                    {isApproved && approvedType === "MOBILE" && (
                                        <InfoBanner tone="emerald">
                                            This device is approved as a trusted mobile device. You can register and use passkey on this device.
                                        </InfoBanner>
                                    )}

                                    {isApproved && approvedType === "COMPANY_PC" && (
                                        <InfoBanner tone="indigo">
                                            This device is approved as a trusted company PC. Presence confirmation can be completed directly from this terminal.
                                        </InfoBanner>
                                    )}

                                    <Routes>
                                        <Route index element={<EmpOverview me={me} deviceEnrollment={deviceEnrollment} />} />
                                        <Route path="notifications" element={<Notifications />} />
                                        <Route path="attendance" element={<Attendance />} />
                                        <Route path="presence-check" element={<PresenceCheck />} />
                                        <Route path="corrections" element={<Corrections />} />
                                        <Route path="verify" element={<Verify />} />
                                        <Route path="shifts" element={<Shifts />} />
                                        <Route path="ot" element={<MyOvertime />} />
                                        <Route path="security" element={<Security />} />
                                        <Route path="*" element={<Navigate to="/emp" replace />} />
                                    </Routes>
                                </div>
                            </div>
                        </main>
                    </div>
                )}
            </div>
        </div>
    );
}













// import React, { useEffect, useMemo, useState } from "react";
// import { NavLink, useNavigate, Routes, Route, Navigate } from "react-router-dom";
// import {
//     LayoutDashboard,
//     Bell,
//     BadgeCheck,
//     Fingerprint,
//     CalendarDays,
//     Clock3,
//     ShieldCheck,
//     LogOut,
//     ClipboardList
// } from "lucide-react";
//
// import { cn } from "../../lib/cn";
// import { api } from "../../lib/api.js";
// import { authStore } from "../../features/auth/store";
// import { LogoMark } from "../../components/common/Logo";
// import { useToast } from "../../components/ui/Toast.jsx";
// import {
//     listenForeground,
//     syncExistingNotificationToken
// } from "../../lib/notifications.js";
// import { useServiceWorkerNavigation } from "../../lib/useServiceWorkerNavigation.js";
// import { getOrCreateDeviceFingerprint } from "../../lib/deviceFingerprint.js";
//
// import Notifications from "../../features/employee/notification/Notifications.jsx";
// import Attendance from "../../features/employee/Attendance/Attendance.jsx";
// import Verify from "../../features/employee/verification/Verify.jsx";
// import Shifts from "../../features/employee/shifts/Shifts.jsx";
// import Security from "../../features/employee/security.jsx";
// import Corrections from "../../features/employee/AttendanceCorrections.jsx";
// import PresenceCheck from "../../features/employee/PresenceCheck.jsx";
// import MyOvertime from "../../features/employee/MyOvertime.jsx";
// import SwapRequests from "../../features/employee/SwapRequests.jsx";
//
// function detectRequestedTrustType() {
//     const ua = navigator.userAgent || "";
//     const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
//     return isMobile ? "MOBILE" : "COMPANY_PC";
// }
//
// function buildDeviceName() {
//     const ua = navigator.userAgent || "Unknown Device";
//
//     if (/Android/i.test(ua)) return "Android Device";
//     if (/iPhone/i.test(ua)) return "iPhone";
//     if (/iPad/i.test(ua)) return "iPad";
//     if (/Windows/i.test(ua)) return "Windows PC";
//     if (/Macintosh|Mac OS X/i.test(ua)) return "Mac";
//     if (/Linux/i.test(ua)) return "Linux Device";
//
//     return "Unknown Device";
// }
//
// function NavItem({ to, icon: Icon, label }) {
//     return (
//         <NavLink
//             to={to}
//             end={to === "/emp"}
//             className={({ isActive }) =>
//                 cn(
//                     "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition",
//                     "ring-1 ring-transparent focus:outline-none focus-visible:ring-slate-300",
//                     !isActive && "text-slate-700 hover:bg-slate-50 hover:text-slate-900",
//                     isActive && "bg-slate-900 text-white shadow-sm ring-1 ring-slate-900"
//                 )
//             }
//         >
//             <span
//                 className={cn(
//                     "grid h-8 w-8 place-items-center rounded-xl transition",
//                     "ring-1 ring-slate-200 bg-white text-slate-700",
//                     "group-hover:bg-white group-hover:text-slate-900",
//                     "group-[.bg-slate-900]:bg-slate-800 group-[.bg-slate-900]:text-white group-[.bg-slate-900]:ring-slate-700"
//                 )}
//             >
//                 <Icon className="h-4.5 w-4.5" />
//             </span>
//             <span className="truncate">{label}</span>
//         </NavLink>
//     );
// }
//
// function EmpOverview() {
//     return (
//         <>
//             <div className="text-xl font-bold text-slate-900">Employee Dashboard</div>
//             <div className="mt-2 text-sm text-slate-600">
//                 Quick overview of your attendance, shifts, and OT.
//             </div>
//
//             <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
//                 <div className="rounded-2xl border border-slate-200 p-4">
//                     <div className="text-sm font-semibold text-slate-900">Today</div>
//                     <div className="mt-1 text-xs text-slate-600">Check-in status</div>
//                 </div>
//                 <div className="rounded-2xl border border-slate-200 p-4">
//                     <div className="text-sm font-semibold text-slate-900">Shifts</div>
//                     <div className="mt-1 text-xs text-slate-600">Next upcoming shift</div>
//                 </div>
//                 <div className="rounded-2xl border border-slate-200 p-4">
//                     <div className="text-sm font-semibold text-slate-900">OT</div>
//                     <div className="mt-1 text-xs text-slate-600">This week OT hours</div>
//                 </div>
//             </div>
//         </>
//     );
// }
//
// function DevicePendingApproval() {
//     return (
//         <div className="mx-auto max-w-xl rounded-3xl border border-amber-200 bg-amber-50 p-6">
//             <div className="text-lg font-bold text-amber-900">Device Pending Approval</div>
//             <p className="mt-2 text-sm text-amber-800">
//                 This device has been registered and is waiting for admin approval.
//                 Until approval, trusted verification features will remain blocked.
//             </p>
//         </div>
//     );
// }
//
// function DeviceRejectedNotice() {
//     return (
//         <div className="mx-auto max-w-xl rounded-3xl border border-rose-200 bg-rose-50 p-6">
//             <div className="text-lg font-bold text-rose-900">Device Not Approved</div>
//             <p className="mt-2 text-sm text-rose-800">
//                 This device was rejected or revoked. Please contact your administrator or sign in from an approved device.
//             </p>
//         </div>
//     );
// }
//
// export default function EmployeeDashboard() {
//     const navigate = useNavigate();
//     const toast = useToast((s) => s.push);
//
//     const user = authStore((s) => s.user);
//     const clearSession = authStore((s) => s.clearSession);
//
//     const [me, setMe] = useState(null);
//     const [meLoading, setMeLoading] = useState(true);
//
//     const [deviceEnrollment, setDeviceEnrollment] = useState(null);
//     const [deviceLoading, setDeviceLoading] = useState(true);
//
//     useServiceWorkerNavigation();
//
//     useEffect(() => {
//         let ignore = false;
//
//         async function bootstrap() {
//             setMeLoading(true);
//             setDeviceLoading(true);
//
//             try {
//                 const meRes = await api.get("/v1/emp/me");
//                 const meData = meRes?.data?.data || null;
//
//                 if (!ignore) setMe(meData);
//
//                 const enrollPayload = {
//                     deviceFingerprint: getOrCreateDeviceFingerprint(),
//                     deviceName: buildDeviceName(),
//                     userAgent: navigator.userAgent || "",
//                     requestedTrustType: detectRequestedTrustType(),
//                 };
//
//                 const enrollRes = await api.post("/v1/emp/device/enroll", enrollPayload);
//                 const enrollData = enrollRes?.data?.data || null;
//
//                 if (!ignore) {
//                     setDeviceEnrollment(enrollData);
//                 }
//             } catch (err) {
//                 console.error("Dashboard bootstrap failed:", err);
//
//                 if (!ignore) {
//                     setMe(null);
//                     setDeviceEnrollment(null);
//                 }
//             } finally {
//                 if (!ignore) {
//                     setMeLoading(false);
//                     setDeviceLoading(false);
//                 }
//             }
//         }
//
//         bootstrap();
//
//         return () => {
//             ignore = true;
//         };
//     }, []);
//
//     useEffect(() => {
//         const unsubscribe = listenForeground((payload) => {
//             const title = payload?.notification?.title || "InShift";
//             const message = payload?.notification?.body || "New notification received.";
//
//             console.log("FOREGROUND PUSH", payload);
//
//             toast({
//                 title,
//                 message,
//                 variant: "success",
//             });
//
//             if ("Notification" in window && Notification.permission === "granted") {
//                 new Notification(title, {
//                     body: message,
//                 });
//             }
//         });
//
//         return () => {
//             if (typeof unsubscribe === "function") unsubscribe();
//         };
//     }, [toast]);
//
//     useEffect(() => {
//         if (!me) return;
//
//         syncExistingNotificationToken().catch((err) => {
//             console.error("Notification token sync failed:", err);
//         });
//     }, [me]);
//
//     const nav = useMemo(
//         () => [
//             { to: "/emp", icon: LayoutDashboard, label: "Overview" },
//             { to: "/emp/notifications", icon: Bell, label: "Notifications" },
//             { to: "/emp/attendance", icon: BadgeCheck, label: "Attendance" },
//             { to: "/emp/presence-check", icon: ShieldCheck, label: "Presence Check" },
//             { to: "/emp/corrections", icon: ClipboardList, label: "Corrections" },
//             { to: "/emp/verify", icon: Fingerprint, label: "Verify" },
//             { to: "/emp/shifts", icon: CalendarDays, label: "My Shifts" },
//             { to: "/emp/ot", icon: Clock3, label: "My OT" },
//             { to: "/emp/security", icon: ShieldCheck, label: "Security" },
//         ],
//         []
//     );
//
//     if (!meLoading && me?.mustChangePassword) {
//         return <Navigate to="/force-change-password" replace />;
//     }
//
//     if (meLoading || deviceLoading) {
//         return (
//             <div className="min-h-screen grid place-items-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
//                 <div className="rounded-2xl bg-white px-6 py-4 shadow-sm ring-1 ring-slate-200">
//                     <div className="text-sm font-semibold text-slate-900">Loading your workspace...</div>
//                 </div>
//             </div>
//         );
//     }
//
//     const approvalStatus = deviceEnrollment?.approvalStatus;
//     const approvedType = deviceEnrollment?.approvedTrustType;
//
//     const isPending = approvalStatus === "PENDING";
//     const isApproved = approvalStatus === "APPROVED";
//     const isRejected = approvalStatus === "REJECTED" || approvalStatus === "REVOKED";
//
//     return (
//         <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
//             <div className="mx-auto max-w-7xl px-4 py-6 lg:py-8">
//                 <div className="flex items-center justify-between gap-3">
//                     <div className="flex items-center gap-3">
//                         <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
//                             <LogoMark />
//                         </div>
//                         <div className="leading-tight">
//                             <div className="text-base font-semibold text-slate-900">InShift</div>
//                             <div className="text-xs text-slate-600">Employee Portal</div>
//                         </div>
//                     </div>
//
//                     <div className="flex items-center gap-3">
//                         <div className="text-sm font-bold text-slate-900">
//                             {me?.fullName || user?.email || "Employee"}
//                         </div>
//
//                         <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-500">
//                             {me?.role || user?.role || "EMPLOYEE"}
//                         </div>
//
//                         {deviceEnrollment && (
//                             <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
//                                 <div className="font-semibold text-slate-900">
//                                     Device: {approvalStatus || "UNKNOWN"}
//                                 </div>
//                                 <div className="text-slate-600">
//                                     {approvedType || "Awaiting approval"}
//                                 </div>
//                             </div>
//                         )}
//
//                         <button
//                             className={cn(
//                                 "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition-all",
//                                 "border border-rose-200 bg-rose-50 text-rose-600 shadow-sm",
//                                 "hover:bg-rose-500 hover:text-white hover:shadow-lg hover:shadow-rose-500/20"
//                             )}
//                             onClick={() => {
//                                 clearSession();
//                                 navigate("/login");
//                             }}
//                         >
//                             <LogOut className="h-4 w-4" />
//                             Sign out
//                         </button>
//                     </div>
//                 </div>
//
//                 {isPending ? (
//                     <div className="mt-8">
//                         <DevicePendingApproval />
//                     </div>
//                 ) : isRejected ? (
//                     <div className="mt-8">
//                         <DeviceRejectedNotice />
//                     </div>
//                 ) : (
//                     <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr] lg:gap-8">
//                         <aside className="h-fit rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
//                             <div className="px-4 py-4">
//                                 <div className="text-sm font-semibold text-slate-900">Navigation</div>
//                                 <div className="text-xs text-slate-600">Employee modules</div>
//                             </div>
//
//                             <div className="px-3 pb-3 space-y-1">
//                                 {nav.map((n) => (
//                                     <NavItem key={n.to} {...n} />
//                                 ))}
//                             </div>
//                         </aside>
//
//                         <main className="min-w-0 rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 p-6">
//                             {!isApproved && (
//                                 <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
//                                     This device is not fully approved yet.
//                                 </div>
//                             )}
//
//                             {isApproved && approvedType === "MOBILE" && (
//                                 <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
//                                     This device is approved as a trusted mobile device. You can register and use passkey on this device.
//                                 </div>
//                             )}
//
//                             {isApproved && approvedType === "COMPANY_PC" && (
//                                 <div className="mb-4 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
//                                     This device is approved as a trusted company PC. Presence confirmation can be completed directly from this terminal.
//                                 </div>
//                             )}
//
//                             <Routes>
//                                 <Route index element={<EmpOverview />} />
//                                 <Route path="notifications" element={<Notifications />} />
//                                 <Route path="attendance" element={<Attendance />} />
//                                 <Route path="presence-check" element={<PresenceCheck />} />
//                                 <Route path="corrections" element={<Corrections />} />
//                                 <Route path="verify" element={<Verify />} />
//                                 <Route
//                                     path="shifts"
//                                     element={<Shifts />}
//                                 />
//                                 <Route path="ot" element={<MyOvertime />} />
//                                 <Route path="ot/swaps" element={<SwapRequests />} />
//                                 <Route path="security" element={<Security />} />
//                                 <Route path="*" element={<Navigate to="/emp" replace />} />
//                             </Routes>
//                         </main>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }