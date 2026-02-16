import React, { useMemo } from "react";
import { NavLink, useNavigate, Routes, Route, Navigate } from "react-router-dom";
import { LayoutDashboard, Users, MapPin, Settings, LogOut } from "lucide-react";
import { cn } from "../../lib/cn";
import { authStore } from "../../features/auth/store";
import { LogoMark } from "../../components/common/Logo";

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

function AdminOverview() {
    return (
        <>
            <div className="text-xl font-bold text-slate-900">Admin Dashboard</div>
            <div className="mt-2 text-sm text-slate-600">
                Manage branches, employees, geo rules, and system settings.
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="text-sm font-semibold text-slate-900">Branches</div>
                    <div className="mt-1 text-xs text-slate-600">Create & manage locations</div>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="text-sm font-semibold text-slate-900">Employees</div>
                    <div className="mt-1 text-xs text-slate-600">Add users, assign branches</div>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="text-sm font-semibold text-slate-900">Geo Rules</div>
                    <div className="mt-1 text-xs text-slate-600">Set allowed check-in zones</div>
                </div>
            </div>
        </>
    );
}

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { user, clear } = authStore();

    const nav = useMemo(
        () => [
            { to: "/admin", icon: LayoutDashboard, label: "Overview" },
            { to: "/admin/employees", icon: Users, label: "Employees" },
            { to: "/admin/branches", icon: MapPin, label: "Branches" },
            { to: "/admin/georules", icon: MapPin, label: "Geo Rules" },
            { to: "/admin/settings", icon: Settings, label: "Admin Settings" }
        ],
        []
    );

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
                            <div className="text-xs text-slate-600">Admin Portal</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden sm:block text-right">
                            <div className="text-sm font-semibold text-slate-900">{user?.name || "Admin"}</div>
                            <div className="text-xs text-slate-600">ADMIN</div>
                        </div>

                        <button
                            className={cn(
                                "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold",
                                "bg-white text-slate-700 shadow-sm ring-1 ring-slate-200",
                                "hover:bg-slate-50 hover:text-slate-900"
                            )}
                            onClick={() => {
                                clear();
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
                            <div className="text-xs text-slate-600">Admin modules</div>
                        </div>

                        <div className="px-3 pb-3 space-y-1">
                            {nav.map((n) => (
                                <NavItem key={n.to} {...n} />
                            ))}
                        </div>
                    </aside>

                    <main className="min-w-0 rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 p-6">
                        {/* ✅ ROUTES INSIDE ADMIN */}
                        <Routes>
                            <Route index element={<AdminOverview />} />
                            <Route path="employees" element={<div className="text-slate-900 font-semibold">Employees Page</div>} />
                            <Route path="branches" element={<div className="text-slate-900 font-semibold">Branches Page</div>} />
                            <Route path="georules" element={<div className="text-slate-900 font-semibold">Geo Rules Page</div>} />
                            <Route path="settings" element={<div className="text-slate-900 font-semibold">Admin Settings Page</div>} />
                            <Route path="*" element={<Navigate to="/admin" replace />} />
                        </Routes>
                    </main>
                </div>
            </div>
        </div>
    );
}
