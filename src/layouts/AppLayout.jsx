import React, { useEffect, useMemo } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { enableNotifications, listenForeground } from "../lib/fcm";
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
import { useServiceWorkerNavigation } from "../lib/swNavigation";
// import { api } from "../lib/api"; // ✅ uncomment when backend endpoint is ready

function NavItem({ to, icon: Icon, label }) {
  return (
      <NavLink
          to={to}
          className={({ isActive }) =>
              cn(
                  // Base
                  "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition",
                  "ring-1 ring-transparent focus:outline-none focus-visible:ring-slate-300",
                  // Inactive
                  !isActive &&
                  "text-slate-700 hover:bg-slate-50 hover:text-slate-900",
                  // Active
                  isActive &&
                  "bg-slate-900 text-white shadow-sm ring-1 ring-slate-900"
              )
          }
      >
      <span
          className={cn(
              "grid h-8 w-8 place-items-center rounded-xl transition",
              "ring-1 ring-slate-200 bg-white text-slate-700",
              "group-hover:bg-white group-hover:text-slate-900",
              // When active, invert the icon chip
              // (NavLink gives isActive only in className callback, so we style with group + parent bg)
              "group-[.bg-slate-900]:bg-slate-800 group-[.bg-slate-900]:text-white group-[.bg-slate-900]:ring-slate-700"
          )}
      >
        <Icon className="h-4.5 w-4.5" />
      </span>

        <span className="truncate">{label}</span>
      </NavLink>
  );
}

export default function AppLayout() {
  const navigate = useNavigate();
  const toast = useToast((s) => s.push);

  const { user, clear } = authStore();
  const role = user?.role || "EMPLOYEE";

  // ✅ must be called INSIDE component
  useServiceWorkerNavigation();

  // ✅ Setup FCM (ask permission, get token)
  useEffect(() => {
    async function setupFCM() {
      try {
        const token = await enableNotifications(); // token OR null
        if (!token) return;

        // ✅ when backend is ready:
        // await api.post("/notifications/fcm-token", { token, device: navigator.userAgent });
      } catch (err) {
        console.log("FCM error:", err);
      }
    }

    setupFCM();
  }, [toast]);

  // ✅ Foreground notifications (app open) → show toast → navigate
  useEffect(() => {
    const unsub = listenForeground((payload) => {
      const title = payload?.notification?.title ?? "InShift";
      const body = payload?.notification?.body ?? "";
      const url = payload?.data?.url ?? "/app/notifications";

      toast({
        title,
        message: body,
        actionLabel: "Open",
        onAction: () => navigate(url)
      });
    });

    return () => unsub();
  }, [toast, navigate]);

  const nav = useMemo(() => {
    const common = [
      { to: "/app", icon: LayoutDashboard, label: "Overview" },
      { to: "/app/notifications", icon: Bell, label: "Notifications" },
      { to: "/app/attendance", icon: BadgeCheck, label: "Attendance" },
      { to: "/app/verify", icon: Fingerprint, label: "Verify" },
      { to: "/app/shifts", icon: CalendarDays, label: "My Shifts" },
      { to: "/app/ot", icon: Clock3, label: "My OT" },
      { to: "/app/settings/security", icon: ShieldCheck, label: "Security" }
    ];
    const admin = [
      { to: "/app/admin/employees", icon: Users, label: "Employees" },
      { to: "/app/admin/geofences", icon: MapPin, label: "Geo Rules" },
      { to: "/app/admin/settings", icon: Settings, label: "Admin Settings" }
    ];
    return role === "ADMIN" ? [...common, ...admin] : common;
  }, [role]);

  return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        {/* Subtle background decoration */}
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-slate-200/40 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-slate-200/30 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6 lg:py-8">
          {/* Top bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                <LogoMark />
              </div>
              <div className="leading-tight">
                <div className="text-base font-semibold text-slate-900">InShift</div>
                <div className="text-xs text-slate-600">
                  Smart attendance • Shifts • OT
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <div className="hidden sm:block text-right">
                <div className="text-sm font-semibold text-slate-900">
                  {user?.name || "User"}
                </div>
                <div className="text-xs text-slate-600">{role}</div>
              </div>

              <button
                  className={cn(
                      "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold",
                      "bg-white text-slate-700 shadow-sm ring-1 ring-slate-200",
                      "hover:bg-slate-50 hover:text-slate-900",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                  )}
                  onClick={() => {
                    clear();
                    toast({ title: "Signed out", message: "See you next time." });
                    navigate("/");
                  }}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>

          {/* Layout */}
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr] lg:gap-8">
            <aside className="lg:sticky lg:top-6 h-fit">
              <div className="rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
                {/* Sidebar header */}
                <div className="flex items-center justify-between px-4 py-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      Navigation
                    </div>
                    <div className="text-xs text-slate-600">
                      Quick access modules
                    </div>
                  </div>
                </div>

                <div className="px-3 pb-3">
                  <div className="space-y-1">
                    {nav.map((n) => (
                        <NavItem key={n.to} {...n} />
                    ))}
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-slate-700">
                        Backend
                      </div>
                      <span className="text-[11px] font-medium text-slate-500">
                      env
                    </span>
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      Uses <span className="font-mono">VITE_API_BASE_URL</span>.
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            <main className="min-w-0">
              {/* Page surface */}
              <div className="rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
                <div className="p-4 sm:p-6">
                  <Outlet />
                </div>
              </div>
            </main>
          </div>
        </div>

        <ToastHost />
      </div>
  );
}
