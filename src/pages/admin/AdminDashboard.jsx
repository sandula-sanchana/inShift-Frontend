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
            end={to === "/admin"} // Ensures the "Overview" doesn't stay active on sub-routes
            className={({ isActive }) =>
                cn(
                    "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1",
                    !isActive &&
                    "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900",
                    isActive &&
                    "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                )
            }
        >
            {({ isActive }) => (
                <>
                    <Icon
                        className={cn(
                            "h-5 w-5 transition-colors",
                            isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-600"
                        )}
                    />
                    <span className="truncate">{label}</span>
                </>
            )}
        </NavLink>
    );
}

function AdminOverview() {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="text-2xl font-bold tracking-tight text-slate-900">Admin Dashboard</div>
            <div className="mt-1.5 text-sm text-slate-500">
                Manage branches, employees, geo rules, and system settings.
            </div>

            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-indigo-200">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                            <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-slate-900">Branches</div>
                            <div className="mt-0.5 text-xs text-slate-500">Create & manage locations</div>
                        </div>
                    </div>
                </div>

                <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-purple-200">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
                            <Users className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-slate-900">Employees</div>
                            <div className="mt-0.5 text-xs text-slate-500">Add users, assign branches</div>
                        </div>
                    </div>
                </div>

                <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-cyan-200">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-cyan-50 p-2 text-cyan-600">
                            <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-slate-900">Geo Rules</div>
                            <div className="mt-0.5 text-xs text-slate-500">Set allowed check-in zones</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
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
        <div className="min-h-screen bg-slate-50/50 selection:bg-indigo-100 selection:text-indigo-900 font-sans">
            <div className="mx-auto w-full max-w-[1700px] px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

                {/* Top bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white px-6 py-4 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-sm shadow-indigo-200 text-white">
                            <LogoMark />
                        </div>
                        <div className="leading-tight">
                            <div className="text-base font-bold tracking-tight text-slate-900">InShift</div>
                            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-0.5">Admin Portal</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:block text-right">
                            <div className="text-sm font-semibold text-slate-900">{user?.name || "Admin User"}</div>
                            <div className="text-xs text-slate-500">Administrator</div>
                        </div>
                        <div className="hidden sm:block h-8 w-px bg-slate-200" /> {/* Divider */}
                        <button
                            className={cn(
                                "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200",
                                "bg-white text-slate-600 border border-slate-200 shadow-sm",
                                "hover:bg-slate-50 hover:text-red-600 hover:border-red-200 focus:ring-2 focus:ring-red-100 active:scale-[0.98]"
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

                <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[260px_1fr] 2xl:grid-cols-[280px_1fr] xl:gap-8">
                    {/* Sidebar */}
                    <aside className="h-fit rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                        <div className="px-6 py-5 border-b border-slate-100">
                            <div className="text-sm font-bold text-slate-900">Navigation</div>
                            <div className="text-xs text-slate-500 mt-0.5">Manage your system</div>
                        </div>

                        <div className="px-3 py-4 space-y-1">
                            {nav.map((n) => (
                                <NavItem key={n.to} {...n} />
                            ))}
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <main className="min-w-0">
                        <div className="min-h-[600px] h-full rounded-2xl bg-white shadow-sm border border-slate-200">
                            <div className="p-6 sm:p-8 lg:p-10">
                                <Routes>
                                    <Route index element={<AdminOverview />} />
                                    <Route path="employees" element={<EmployeesPage />} />
                                    <Route path="branches" element={<BranchesPage />} />
                                    <Route
                                        path="georules"
                                        element={<div className="text-slate-900 font-semibold animate-in fade-in duration-500">Geo Rules Configuration</div>}
                                    />
                                    <Route
                                        path="settings"
                                        element={<div className="text-slate-900 font-semibold animate-in fade-in duration-500">System Settings</div>}
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