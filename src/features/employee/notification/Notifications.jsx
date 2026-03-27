import React, { useEffect, useState } from "react";
import { SectionTitle } from "../../../components/common/SectionTitle.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/Card.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { Badge } from "../../../components/ui/Badge.jsx";
import { Bell, Save, Send, Loader2, Smartphone, ShieldCheck } from "lucide-react";
import { useToast } from "../../../components/ui/Toast.jsx";
import { api } from "../../../lib/api.js";
import {
  enableAndRegisterNotifications,
  disableCurrentDeviceNotifications,
  getMyRegisteredNotificationDevices,
  getNotificationPermissionStatus,
  getSavedFcmToken,
} from "../../../lib/notifications.js";

const LOCAL_PREFS_KEY = "inshift_notification_prefs";

export default function Notifications() {
  const toast = useToast((s) => s.push);

  const [loading, setLoading] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

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

  async function sendTest() {
    setSendingTest(true);

    try {
      const res = await api.post("/v1/admin/notifications/test");
      toast({
        title: "Test sent",
        message: res?.data?.message || "Test notification sent.",
        variant: "success",
      });
    } catch (e) {
      toast({
        title: "Test failed",
        message: e?.response?.data?.message || "Could not send test notification.",
        variant: "error",
      });
    } finally {
      setSendingTest(false);
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

  return (
      <div className="space-y-6">
        <SectionTitle
            title="Notifications"
            subtitle="Push notifications for attendance checks, shift changes, and OT approvals."
            right={
              <Badge variant={enabled ? "success" : "neutral"}>
                {enabled ? "Enabled on this browser" : "Not enabled on this browser"}
              </Badge>
            }
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Device & push setup</CardTitle>
              <CardDescription>
                Enable browser notifications and register this browser token.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <Bell className="h-5 w-5" />
                </span>

                  <div className="space-y-2 text-sm text-slate-700">
                    <p>
                      Enable notifications to receive presence checks, attendance reminders,
                      and approval updates.
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="neutral">Permission: {permissionLabel}</Badge>
                      <Badge variant="neutral">
                        Device: {registeredDevice?.deviceType || "Unknown"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {registeredDevice && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                    <ShieldCheck className="h-5 w-5" />
                  </span>

                      <div className="text-sm text-slate-700">
                        <div className="font-semibold text-slate-900">Current browser registered</div>
                        <div className="mt-1">{registeredDevice.deviceName || "Unnamed device"}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          Type: {registeredDevice.deviceType || "-"}
                        </div>
                        {registeredDevice.lastUsedAt && (
                            <div className="mt-1 text-xs text-slate-500">
                              Last used: {new Date(registeredDevice.lastUsedAt).toLocaleString()}
                            </div>
                        )}
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

                <Button variant="secondary" onClick={sendTest} disabled={sendingTest}>
                  {sendingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send test
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Control which events notify you.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {[
                {
                  key: "attendanceChecks",
                  title: "Attendance checks",
                  desc: "Scheduled / random verification requests.",
                },
                {
                  key: "shiftUpdates",
                  title: "Shift updates",
                  desc: "Swap requests, reschedules, open shifts.",
                },
                {
                  key: "otUpdates",
                  title: "Overtime updates",
                  desc: "Approvals, rejection reasons, payment status.",
                },
              ].map((p) => (
                  <button
                      key={p.key}
                      onClick={() => toggle(p.key)}
                      className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{p.title}</div>
                        <div className="mt-1 text-sm text-slate-600">{p.desc}</div>
                      </div>
                      <Badge variant={prefs[p.key] ? "success" : "neutral"}>
                        {prefs[p.key] ? "On" : "Off"}
                      </Badge>
                    </div>
                  </button>
              ))}

              <div className="pt-2">
                <Button onClick={save} variant="secondary" disabled={savingPrefs}>
                  {savingPrefs ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  );
}