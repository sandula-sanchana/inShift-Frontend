import React, { useMemo } from "react";
import { NavLink, useNavigate, Routes, Route, Navigate } from "react-router-dom";
import { LayoutDashboard, Users, MapPin, Settings, LogOut } from "lucide-react";
import { cn } from "../../lib/cn";
import { authStore } from "../../features/auth/store";
import { LogoMark } from "../../components/common/Logo";
import BranchesPage from "../../features/admin/branch/BranchesPage.jsx";
import EmployeesPage from "../../features/admin/EmployeePage.jsx";

function NavItem({ to, icon: Icon, label }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                cn(
                    "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300",
                    !isActive &&
                    "text-slate-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:via-purple-50 hover:to-cyan-50 hover:text-slate-900",
                    isActive &&
                    "text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 shadow-md"
                )
            }
        >
            {({ isActive }) => (
                <>
          <span
              className={cn(
                  "grid h-9 w-9 place-items-center rounded-2xl transition ring-1",
                  isActive
                      ? "bg-white/15 text-white ring-white/20"
                      : "bg-white text-indigo-700 ring-slate-200 group-hover:ring-indigo-200"
              )}
          >
            <Icon className="h-4.5 w-4.5" />
          </span>
                    <span className="truncate">{label}</span>
                </>
            )}
        </NavLink>
    );
}

function AdminOverview() {
    return (
        <>
            <div className="text-2xl font-bold text-slate-900">Admin Dashboard</div>
            <div className="mt-2 text-sm text-slate-600">
                Manage branches, employees, geo rules, and system settings.
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-3xl border border-indigo-100 bg-gradient-to-b from-white to-indigo-50/40 p-5 hover:shadow-sm transition">
                    <div className="text-sm font-semibold text-slate-900">Branches</div>
                    <div className="mt-1 text-xs text-slate-600">Create & manage locations</div>
                </div>
                <div className="rounded-3xl border border-purple-100 bg-gradient-to-b from-white to-purple-50/40 p-5 hover:shadow-sm transition">
                    <div className="text-sm font-semibold text-slate-900">Employees</div>
                    <div className="mt-1 text-xs text-slate-600">Add users, assign branches</div>
                </div>
                <div className="rounded-3xl border border-cyan-100 bg-gradient-to-b from-white to-cyan-50/40 p-5 hover:shadow-sm transition">
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
            { to: "/admin/settings", icon: Settings, label: "Admin Settings" },
        ],
        []
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-sky-50 to-cyan-100">
            {/* ✅ Make the whole layout wider */}
            <div className="mx-auto w-full max-w-[1700px] px-3 sm:px-5 lg:px-8 py-6 lg:py-8">
                {/* Top bar */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-600 shadow-sm ring-1 ring-white/40">
                            {/* if LogoMark is dark, wrap it with a class that makes it white inside your SVG */}
                            <LogoMark />
                        </div>
                        <div className="leading-tight">
                            <div className="text-base font-semibold text-slate-900">InShift</div>
                            <div className="text-xs text-slate-600">Admin Portal</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden sm:block text-right">
                            <div className="text-sm font-semibold text-slate-900">{user?.name || "Admin User"}</div>
                            <div className="text-xs text-slate-600">ADMIN</div>
                        </div>

                        <button
                            className={cn(
                                "inline-flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition",
                                "bg-white/80 text-slate-700 shadow-sm ring-1 ring-slate-200 backdrop-blur",
                                "hover:bg-white hover:text-slate-900 active:scale-[0.99]"
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

                {/* ✅ Wider main area:
            - Sidebar a bit smaller on xl to give more space to content
            - Main area looks bigger and more “open”
        */}
                <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[280px_1fr] 2xl:grid-cols-[300px_1fr] xl:gap-8">
                    {/* Sidebar */}
                    <aside className="h-fit rounded-3xl bg-gradient-to-b from-white/90 to-indigo-50/70 backdrop-blur shadow-sm ring-1 ring-indigo-100 overflow-hidden">
                        <div className="px-5 py-5 border-b border-slate-100">
                            <div className="text-sm font-semibold text-slate-900">Navigation</div>
                            <div className="text-xs text-slate-600">Admin modules</div>
                        </div>

                        <div className="px-3 py-3 space-y-1">
                            {nav.map((n) => (
                                <NavItem key={n.to} {...n} />
                            ))}
                        </div>

                        {/* small color footer */}
                        <div className="px-5 py-4 border-t border-slate-100">
                            <div className="h-2 w-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 opacity-80" />
                            <div className="mt-2 text-[11px] text-slate-500">InShift • Admin</div>
                        </div>
                    </aside>

                    {/* Main */}
                    <main className="min-w-0">
                        {/* ✅ Main container bigger + softer border + more color */}
                        <div className="rounded-3xl bg-gradient-to-b from-white/95 to-cyan-50/60 backdrop-blur shadow-sm ring-1 ring-cyan-100">
                            {/* ✅ reduce padding a bit so pages feel bigger */}
                            <div className="p-4 sm:p-6 lg:p-7">
                                <Routes>
                                    <Route index element={<AdminOverview />} />
                                    <Route path="employees" element={<EmployeesPage />} />
                                    <Route path="branches" element={<BranchesPage />} />
                                    <Route
                                        path="georules"
                                        element={<div className="text-slate-900 font-semibold">Geo Rules Page</div>}
                                    />
                                    <Route
                                        path="settings"
                                        element={<div className="text-slate-900 font-semibold">Admin Settings Page</div>}
                                    />
                                    <Route path="*" element={<Navigate to="/admin" replace />} />
                                </Routes>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
