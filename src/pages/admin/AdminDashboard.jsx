import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate, Routes, Route, Navigate } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    MapPin,
    Settings,
    LogOut,
    CalendarClock,
    UserCheck,
    UserX,
    Clock3,
    AlertTriangle,
    ClipboardList,
    TimerReset,
    RefreshCw,
    ChevronRight,
    ShieldCheck,
    Zap
} from "lucide-react";
import { cn } from "../../lib/cn";
import { api } from "../../lib/api.js";
import { authStore } from "../../features/auth/store";
import { LogoMark } from "../../components/common/Logo";
import BranchesPage from "../../features/admin/BranchesPage.jsx";
import EmployeesPage from "../../features/admin/EmployeePage.jsx";
import AdminAttendancePage from "../../features/admin/AdminAttendancePage.jsx";
import ShiftSettingsPage from "../../features/admin/ShiftSettingsPage.jsx";
import AttendanceCorrectionsPage from "../../features/admin/AdminAttendanceCorrectionsPage.jsx";

const DASHBOARD_BASE = "/v1/admin/attendance/dashboard";

// Logic functions preserved exactly as requested
function unwrapApiResponse(resData) {
    if (resData && typeof resData === "object" && "data" in resData) return resData.data;
    return resData;
}

function getErrorMessage(err, fallback = "Request failed") {
    const msgFromBackend = err?.response?.data?.message || err?.response?.data?.msg;
    if (msgFromBackend) return msgFromBackend;
    const status = err?.response?.status;
    if (status) return `${fallback} (${status})`;
    return err?.message || fallback;
}

// --- UI COMPONENTS ---

function NavItem({ to, icon: Icon, label }) {
    return (
        <NavLink
            to={to}
            end={to === "/admin"}
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
                            "h-5 w-5 transition-all duration-300",
                            isActive ? "text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]" : "text-slate-500 group-hover:text-slate-300"
                        )}
                    />
                    <span className="relative z-10">{label}</span>
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
    };

    const selectedTone = tones[tone] || tones.slate;

    return (
        <div className={cn(
            "relative group overflow-hidden rounded-2xl border bg-slate-900/40 backdrop-blur-md p-6 transition-all duration-500 hover:-translate-y-1 hover:border-white/20",
            selectedTone.split(' ').pop()
        )}>
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", selectedTone)} />

            <div className="relative z-10 flex items-start justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 group-hover:text-slate-300 transition-colors">
                        {title}
                    </p>
                    <div className="mt-3 flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold tracking-tight text-white">
                            {value ?? 0}
                        </h3>
                    </div>
                    {subtitle && (
                        <p className="mt-2 text-xs text-slate-400 leading-relaxed max-w-[150px]">
                            {subtitle}
                        </p>
                    )}
                </div>

                <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl border border-white/5 bg-white/5 backdrop-blur-xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
                    selectedTone.split(' ')[2]
                )}>
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
    };

    return (
        <div className="group relative flex items-center gap-4 rounded-2xl border border-white/5 bg-slate-900/30 p-5 backdrop-blur-sm transition-all hover:bg-slate-800/50 hover:border-white/10 cursor-pointer">
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

function AdminOverview() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        presentToday: 0,
        absentToday: 0,
        lateToday: 0,
        pendingApprovals: 0,
        incompleteToday: 0,
        overtimeToday: 0,
    });

    const fetchStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`${DASHBOARD_BASE}/today`);
            const data = unwrapApiResponse(res.data) || {};
            setStats({
                presentToday: data.presentToday ?? 0,
                absentToday: data.absentToday ?? 0,
                lateToday: data.lateToday ?? 0,
                pendingApprovals: data.pendingApprovals ?? 0,
                incompleteToday: data.incompleteToday ?? 0,
                overtimeToday: data.overtimeToday ?? 0,
            });
        } catch (e) {
            setError(getErrorMessage(e, "Failed to load dashboard stats"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-8 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
                        <h1 className="text-3xl font-black tracking-tight text-white lg:text-4xl">
                            Admin Dashboard
                        </h1>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                        Manage branches, employees, attendance operations, and system settings.
                    </p>
                </div>

                <button
                    onClick={fetchStats}
                    disabled={loading}
                    className="group relative flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-white/10 hover:border-white/20 active:scale-95 disabled:opacity-50"
                >
                    <RefreshCw className={cn("h-4 w-4 transition-transform duration-500 group-hover:rotate-180", loading && "animate-spin")} />
                    Refresh Overview
                </button>
            </header>

            {error && (
                <div className="mt-8 overflow-hidden rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 backdrop-blur-md text-sm text-rose-400">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>{error}</p>
                    </div>
                </div>
            )}

            <div className="mt-10">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-6">
                    Today Attendance Overview
                </h2>

                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    <OverviewStatCard
                        title="Present Today"
                        value={loading ? "..." : stats.presentToday}
                        subtitle="Employees with valid check-in"
                        icon={UserCheck}
                        tone="green"
                    />
                    <OverviewStatCard
                        title="Absent Today"
                        value={loading ? "..." : stats.absentToday}
                        subtitle="No valid attendance today"
                        icon={UserX}
                        tone="red"
                    />
                    <OverviewStatCard
                        title="Late Today"
                        value={loading ? "..." : stats.lateToday}
                        subtitle="Shift late arrivals"
                        icon={Clock3}
                        tone="yellow"
                    />
                    <OverviewStatCard
                        title="Pending Approvals"
                        value={loading ? "..." : stats.pendingApprovals}
                        subtitle="Web/manual attendance waiting"
                        icon={ClipboardList}
                        tone="indigo"
                    />
                    <OverviewStatCard
                        title="Incomplete Today"
                        value={loading ? "..." : stats.incompleteToday}
                        subtitle="Check-in without check-out"
                        icon={AlertTriangle}
                        tone="purple"
                    />
                    <OverviewStatCard
                        title="Overtime Today"
                        value={loading ? "..." : stats.overtimeToday}
                        subtitle="Employees with overtime"
                        icon={TimerReset}
                        tone="slate"
                    />
                </div>
            </div>

            <div className="mt-12">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-6">
                    System Modules
                </h2>

                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    <ModuleCard
                        title="Branches"
                        subtitle="Create & manage locations"
                        icon={MapPin}
                        tone="indigo"
                    />
                    <ModuleCard
                        title="Employees"
                        subtitle="Add users, assign branches & shifts"
                        icon={Users}
                        tone="purple"
                    />
                    <ModuleCard
                        title="Geo Rules"
                        subtitle="Set allowed check-in zones"
                        icon={MapPin}
                        tone="cyan"
                    />
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
            { to: "/admin/attendance", icon: CalendarClock, label: "Attendance" },
            { to: "/admin/attendance-corrections", icon: ClipboardList, label: "Corrections" },
            { to: "/admin/shifts", icon: Clock3, label: "Shift Settings" },
            { to: "/admin/georules", icon: MapPin, label: "Geo Rules" },
            { to: "/admin/settings", icon: Settings, label: "Admin Settings" },
        ],
        []
    );

    return (
        <div className="min-h-screen bg-[#020617] text-slate-300 selection:bg-indigo-500/30 font-sans antialiased overflow-x-hidden">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-indigo-600/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-purple-600/5 blur-[120px]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50 contrast-150" />
            </div>

            <div className="relative mx-auto w-full max-w-[1700px] px-4 sm:px-6 lg:px-8 py-6 lg:py-8">

                {/* Futuristic Header */}
                <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 px-8 py-5 shadow-2xl">
                    <div className="flex items-center gap-5">
                        <div className="relative group">
                            <div className="absolute inset-0 rounded-2xl bg-indigo-500 blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
                            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-xl">
                                <LogoMark />
                            </div>
                        </div>
                        <div>
                            <div className="text-xl font-black tracking-tighter text-white">InShift<span className="text-indigo-500">.</span></div>
                            <div className="flex items-center gap-2">
                                <div className="h-1 w-1 rounded-full bg-indigo-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Admin Portal</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-4 px-4 py-2 rounded-2xl bg-white/5 border border-white/5">
                            <div className="leading-tight text-right">
                                <p className="text-sm font-bold text-white">{user?.name || "Admin User"}</p>
                                <p className="text-[10px] font-medium text-indigo-400 uppercase tracking-tight">Administrator</p>
                            </div>
                        </div>

                        <button
                            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 transition-all hover:bg-rose-500 hover:text-white hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] active:scale-90"
                            onClick={() => {
                                clear();
                                navigate("/login");
                            }}
                        >
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </header>

                <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[280px_1fr] 2xl:grid-cols-[300px_1fr]">

                    {/* Side Navigation */}
                    <aside className="sticky top-8 h-fit space-y-4">
                        <div className="rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-xl p-3 shadow-sm">
                            <div className="px-4 py-4 mb-2">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Navigation</p>
                                <p className="text-[10px] text-slate-500 mt-1">Manage your system</p>
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
                            <h4 className="text-sm font-bold relative z-10">System Status</h4>
                            <p className="mt-1 text-xs text-indigo-100 opacity-80 relative z-10">Connected to secure server.</p>
                        </div>
                    </aside>

                    {/* Main Workspace */}
                    <main className="min-w-0">
                        <div className="min-h-[700px] rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
                            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-indigo-500/5 blur-3xl" />

                            <div className="relative z-10 p-8 sm:p-10 lg:p-12">
                                <Routes>
                                    <Route index element={<AdminOverview />} />
                                    <Route path="employees" element={<EmployeesPage />} />
                                    <Route path="branches" element={<BranchesPage />} />
                                    <Route
                                        path="georules"
                                        element={
                                            <div className="text-white font-semibold animate-in fade-in duration-500">
                                                Geo Rules Configuration
                                            </div>
                                        }
                                    />
                                    <Route path="attendance" element={<AdminAttendancePage />} />
                                    <Route path="attendance-corrections" element={<AttendanceCorrectionsPage />} />
                                    <Route path="shifts" element={<ShiftSettingsPage />} />
                                    <Route
                                        path="settings"
                                        element={
                                            <div className="text-white font-semibold animate-in fade-in duration-500">
                                                System Settings
                                            </div>
                                        }
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