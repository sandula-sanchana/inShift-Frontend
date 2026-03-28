import React, { useEffect, useState } from "react";
import { SectionTitle } from "../../../components/common/SectionTitle.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/Card.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import {
  Bell,
  Save,
  Loader2,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Monitor,
  Settings2
} from "lucide-react";
import { useToast } from "../../../components/ui/toast-store.js";
import {
  enableAndRegisterNotifications,
  disableCurrentDeviceNotifications,
  getMyRegisteredNotificationDevices,
  getNotificationPermissionStatus,
  getSavedFcmToken,
} from "../../../lib/notifications.js";

const LOCAL_PREFS_KEY = "inshift_notification_prefs";

function FuturisticBadge({ children, tone = "slate" }) {
  const tones = {
    success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    warning: "border-amber-500/20 bg-amber-500/10 text-amber-300",
    danger: "border-rose-500/20 bg-rose-500/10 text-rose-300",
    indigo: "border-indigo-500/20 bg-indigo-500/10 text-indigo-300",
    slate: "border-white/10 bg-white/[0.05] text-slate-300",
  };

  return (
      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tones[tone] || tones.slate}`}>
      {children}
    </span>
  );
}

function PrefToggleCard({ title, desc, enabled, onClick }) {
  return (
      <button
          onClick={onClick}
          className="group w-full rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-left backdrop-blur-sm transition-all hover:border-white/20 hover:bg-slate-800/50"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
              {title}
            </div>
            <div className="mt-1 text-sm text-slate-400 leading-6">{desc}</div>
          </div>

          <div
              className={`mt-1 inline-flex min-w-[56px] justify-center rounded-full border px-3 py-1 text-xs font-semibold ${
                  enabled
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                      : "border-white/10 bg-white/[0.05] text-slate-400"
              }`}
          >
            {enabled ? "On" : "Off"}
          </div>
        </div>
      </button>
  );
}

export default function Notifications() {
  const toast = useToast((s) => s.push);

  const [loading, setLoading] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const [permission, setPermission] = useState(getNotificationPermissionStatus());
  const [enabled, setEnabled] = useState(false);
  const [registeredDevice, setRegisteredDevice] = useState(null);

  const [prefs, setPrefs] = useState({
    attendanceChecks: true,
    shiftUpdates: true,
    otUpdates: true,
  });

  function toggle(key) {
    setPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  async function loadMyTokens() {
    try {
      const tokens = await getMyRegisteredNotificationDevices();
      const localToken = getSavedFcmToken();

      const currentDeviceToken = localToken
          ? tokens.find((t) => t.fcmToken === localToken)
          : null;

      setRegisteredDevice(currentDeviceToken || null);
      setEnabled(!!currentDeviceToken);
    } catch (e) {
      setRegisteredDevice(null);
      setEnabled(false);
    }
  }

  useEffect(() => {
    setPermission(getNotificationPermissionStatus());
    loadMyTokens();
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_PREFS_KEY);
      if (raw) {
        setPrefs(JSON.parse(raw));
      }
    } catch {
      // ignore invalid local data
    }
  }, []);

  async function enable() {
    setLoading(true);

    try {
      const token = await enableAndRegisterNotifications();
      setPermission(getNotificationPermissionStatus());

      if (!token) {
        toast({
          title: "Notifications not enabled",
          message: "Permission was denied or this browser does not support push notifications.",
          variant: "warning",
        });
        return;
      }

      toast({
        title: "Notifications enabled",
        message: "This browser is now registered for push notifications.",
        variant: "success",
      });

      await loadMyTokens();
    } catch (e) {
      console.error(e);
      toast({
        title: "Enable failed",
        message: e?.response?.data?.message || "Could not enable notifications on this browser.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function disableCurrentDevice() {
    setLoading(true);

    try {
      const ok = await disableCurrentDeviceNotifications();

      if (!ok) {
        toast({
          title: "No token found",
          message: "This browser does not have a saved device token.",
          variant: "warning",
        });
        return;
      }

      setRegisteredDevice(null);
      setEnabled(false);

      toast({
        title: "Notifications disabled",
        message: "This browser will no longer receive push notifications.",
        variant: "success",
      });

      await loadMyTokens();
    } catch (e) {
      toast({
        title: "Disable failed",
        message: e?.response?.data?.message || "Could not deactivate this browser token.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSavingPrefs(true);

    try {
      localStorage.setItem(LOCAL_PREFS_KEY, JSON.stringify(prefs));

      toast({
        title: "Preferences saved",
        message: "Your notification preferences were saved on this browser.",
        variant: "success",
      });
    } catch (e) {
      toast({
        title: "Save failed",
        message: "Could not save preferences.",
        variant: "error",
      });
    } finally {
      setSavingPrefs(false);
    }
  }

  const permissionLabel =
      permission === "granted"
          ? "Granted"
          : permission === "denied"
              ? "Blocked"
              : permission === "default"
                  ? "Not asked"
                  : "Unsupported";

  const permissionTone =
      permission === "granted"
          ? "success"
          : permission === "denied"
              ? "danger"
              : permission === "default"
                  ? "warning"
                  : "slate";

  return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <SectionTitle
            title="Notifications"
            subtitle="Control push alerts for presence checks, attendance events, shift updates, and overtime activity."
            right={
              <FuturisticBadge tone={enabled ? "success" : "slate"}>
                {enabled ? "Enabled on this browser" : "Not enabled on this browser"}
              </FuturisticBadge>
            }
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <Card className="border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-none">
              <CardHeader>
                <CardTitle className="text-white">Device & Push Setup</CardTitle>
                <CardDescription className="text-slate-400">
                  Enable browser notifications and register this browser token for secure employee alerts.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 backdrop-blur-sm">
                  <div className="flex items-start gap-4">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-300">
                    <Bell className="h-5 w-5" />
                  </span>

                    <div className="space-y-3 text-sm">
                      <p className="leading-6 text-slate-300">
                        Enable notifications to receive presence verification requests, attendance reminders,
                        shift updates, and overtime-related status changes.
                      </p>

                      <div className="flex flex-wrap gap-2">
                        <FuturisticBadge tone={permissionTone}>
                          Permission: {permissionLabel}
                        </FuturisticBadge>

                        <FuturisticBadge tone="indigo">
                          Device: {registeredDevice?.deviceType || "Unknown"}
                        </FuturisticBadge>
                      </div>
                    </div>
                  </div>
                </div>

                {registeredDevice ? (
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 backdrop-blur-sm">
                      <div className="flex items-start gap-4">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                      <CheckCircle2 className="h-5 w-5" />
                    </span>

                        <div className="min-w-0 text-sm">
                          <div className="font-semibold text-white">Current browser registered</div>
                          <div className="mt-2 text-slate-300">
                            {registeredDevice.deviceName || "Unnamed device"}
                          </div>
                          <div className="mt-1 text-xs text-slate-400">
                            Type: {registeredDevice.deviceType || "-"}
                          </div>
                          {registeredDevice.lastUsedAt && (
                              <div className="mt-1 text-xs text-slate-400">
                                Last used: {new Date(registeredDevice.lastUsedAt).toLocaleString()}
                              </div>
                          )}
                        </div>
                      </div>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
                      <div className="flex items-start gap-4">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-slate-300">
                      <Monitor className="h-5 w-5" />
                    </span>

                        <div className="text-sm">
                          <div className="font-semibold text-white">No registered browser token</div>
                          <div className="mt-2 text-slate-400">
                            Enable notifications on this browser to receive push alerts.
                          </div>
                        </div>
                      </div>
                    </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <Button onClick={enable} disabled={loading || enabled}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                    {enabled ? "Enabled" : "Enable Notifications"}
                  </Button>

                  <Button
                      variant="secondary"
                      onClick={disableCurrentDevice}
                      disabled={loading || !enabled}
                  >
                    <Smartphone className="h-4 w-4" />
                    Disable This Browser
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-none">
              <CardHeader>
                <CardTitle className="text-white">Notification Behavior</CardTitle>
                <CardDescription className="text-slate-400">
                  Background notifications already support click-to-open navigation and persistent presence alerts.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                    <div className="flex items-center gap-3">
                      <Bell className="h-4 w-4 text-indigo-300" />
                      <div className="text-sm font-semibold text-white">Foreground Alerts</div>
                    </div>
                    <div className="mt-2 text-xs leading-5 text-slate-400">
                      In-app toast notifications appear while you are actively using the portal.
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-4 w-4 text-emerald-300" />
                      <div className="text-sm font-semibold text-white">Background Alerts</div>
                    </div>
                    <div className="mt-2 text-xs leading-5 text-slate-400">
                      Push notifications remain clickable and can open the correct presence-check route directly.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-none">
            <CardHeader>
              <CardTitle className="text-white">Preferences</CardTitle>
              <CardDescription className="text-slate-400">
                Control which event groups notify you on this browser.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-slate-300">
                    <Settings2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Local Browser Preferences</div>
                    <div className="text-xs text-slate-400">
                      These settings are stored in this browser only.
                    </div>
                  </div>
                </div>
              </div>

              <PrefToggleCard
                  title="Attendance checks"
                  desc="Scheduled and random presence verification requests."
                  enabled={prefs.attendanceChecks}
                  onClick={() => toggle("attendanceChecks")}
              />

              <PrefToggleCard
                  title="Shift updates"
                  desc="Shift changes, reschedules, swap requests, and scheduling updates."
                  enabled={prefs.shiftUpdates}
                  onClick={() => toggle("shiftUpdates")}
              />

              <PrefToggleCard
                  title="Overtime updates"
                  desc="Overtime approvals, rejections, and related status changes."
                  enabled={prefs.otUpdates}
                  onClick={() => toggle("otUpdates")}
              />

              <div className="pt-2">
                <Button onClick={save} variant="secondary" disabled={savingPrefs}>
                  {savingPrefs ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  );
}