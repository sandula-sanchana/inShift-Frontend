import React, {useEffect, useMemo, useState} from "react";
import { NavLink, useNavigate, Routes, Route, Navigate } from "react-router-dom";
import { listenForeground } from "../../lib/notifications.js";
import { useToast } from "../../components/ui/Toast.jsx";
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
import { authStore } from "../../features/auth/store";
import { LogoMark } from "../../components/common/Logo";


import Notifications from "../../features/employee/notification/Notifications.jsx";
import Attendance from "../../features/employee/Attendance/Attendance.jsx";
import Verify from "../../features/employee/verification/Verify.jsx";
import Shifts from "../../features/employee/shifts/Shifts.jsx";
import Security from "../../features/employee/security.jsx";
import Corrections from "../../features/employee/AttendanceCorrections.jsx";
import {api} from "../../lib/api.js";

function NavItem({ to, icon: Icon, label }) {
    return (
        <NavLink
            to={to}
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

export default function EmployeeDashboard() {
    const navigate = useNavigate();
    const user = authStore((s) => s.user);
    const clearSession = authStore((s) => s.clearSession);

    const [me, setMe] = useState(null);

    useEffect(() => {
        let ignore = false;

        async function loadMe() {
            try {
                const res = await api.get("/v1/emp/me");
                const data = res?.data?.data;
                if (!ignore) setMe(data || null);
            } catch {
                if (!ignore) setMe(null);
            }
        }

        loadMe();
        return () => {
            ignore = true;
        };
    }, []);

    const toast = useToast((s) => s.push);

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

    const nav = useMemo(
        () => [
            { to: "/emp", icon: LayoutDashboard, label: "Overview" },
            { to: "/emp/notifications", icon: Bell, label: "Notifications" },
            { to: "/emp/attendance", icon: BadgeCheck, label: "Attendance" },
            { to: "/emp/corrections", icon: ClipboardList, label: "Corrections" },
            { to: "/emp/verify", icon: Fingerprint, label: "Verify" },
            { to: "/emp/shifts", icon: CalendarDays, label: "My Shifts" },
            { to: "/emp/ot", icon: Clock3, label: "My OT" },
            { to: "/emp/security", icon: ShieldCheck, label: "Security" }
        ],
        []
    );

    if (me?.mustChangePassword) {
        return <Navigate to="/force-change-password" replace />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
            <div className="mx-auto max-w-7xl px-4 py-6 lg:py-8">
                {/* Top bar */}
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
                            {user?.role || "EMPLOYEE"}
                        </div>

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

                {/* Layout */}
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
                        {/* ✅ ROUTES INSIDE EMPLOYEE */}
                        <Routes>
                            <Route index element={<EmpOverview />} />
                            <Route path="notifications" element={<Notifications />} />
                            <Route path="attendance" element={<Attendance />} />
                            <Route path="corrections" element={<Corrections />} />
                            <Route path="verify" element={<Verify />} />
                            <Route path="shifts" element={<Shifts />} />
                            <Route path="ot" element={<div className="text-slate-900 font-semibold">My OT Page</div>} />
                            <Route path="security" element={<Security />} />
                            <Route path="*" element={<Navigate to="/emp" replace />} />
                        </Routes>
                    </main>
                </div>
            </div>
        </div>
    );
}
