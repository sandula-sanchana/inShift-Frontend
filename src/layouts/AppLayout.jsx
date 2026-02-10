import React, { useMemo } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Bell,
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Fingerprint,
  CalendarDays,
  Clock3,
  BadgeCheck,
  ShieldCheck,
  MapPin
} from "lucide-react";
import { LogoMark } from "../components/common/Logo";
import { cn } from "../lib/cn";
import { authStore } from "../features/auth/store";
import { ToastHost, useToast } from "../components/ui/Toast";

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold transition",
          isActive ? "bg-slate-900 text-white shadow-soft" : "text-slate-700 hover:bg-slate-100"
        )
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </NavLink>
  );
}

export default function AppLayout() {
  const navigate = useNavigate();
  const toast = useToast((s) => s.push);
  const { user, clear } = authStore();
  const role = user?.role || "EMPLOYEE";

  const nav = useMemo(() => {
    const common = [
      { to: "/app", icon: LayoutDashboard, label: "Overview" },
      { to: "/app/notifications", icon: Bell, label: "Notifications" },
      { to: "/app/attendance", icon: BadgeCheck, label: "Attendance" },
      { to: "/app/verify", icon: Fingerprint, label: "Verify" },
      { to: "/app/shifts", icon: CalendarDays, label: "My Shifts" },
      { to: "/app/ot", icon: Clock3, label: "My OT" },
      { to: "/app/settings/security", icon: ShieldCheck, label: "Security" },
    ];
    const admin = [
      { to: "/app/admin/employees", icon: Users, label: "Employees" },
      { to: "/app/admin/geofences", icon: MapPin, label: "Geo Rules" },
      { to: "/app/admin/settings", icon: Settings, label: "Admin Settings" },
    ];
    return role === "ADMIN" ? [...common, ...admin] : common;
  }, [role]);

  return (
    <div className="min-h-auto bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LogoMark />
            <div>
              <div className="text-sm font-semibold text-slate-900">InShift</div>
              <div className="text-xs text-slate-600">Smart attendance • Shifts • OT</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-semibold text-slate-900">{user?.name || "User"}</div>
              <div className="text-xs text-slate-600">{role}</div>
            </div>
            <button
              className="rounded-2xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              onClick={() => {
                clear();
                toast({ title: "Signed out", message: "See you next time." });
                navigate("/");
              }}
            >
              <span className="inline-flex items-center gap-2"><LogOut className="h-4 w-4" />Sign out</span>
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <aside className="lg:sticky lg:top-6 h-fit rounded-2xl bg-white shadow-soft ring-1 ring-slate-200 p-3">
            <div className="space-y-1">
              {nav.map((n) => (
                <NavItem key={n.to} {...n} />
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs font-semibold text-slate-700">Backend</div>
              <div className="mt-1 text-xs text-slate-600">
                <span className="font-mono">VITE_API_BASE_URL</span>.
              </div>
            </div>
          </aside>

          <main className="min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
      <ToastHost />
    </div>
  );
}