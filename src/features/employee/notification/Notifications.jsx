import React, { useState } from "react";
import { SectionTitle } from "../../../components/common/SectionTitle.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/Card.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { Badge } from "../../../components/ui/Badge.jsx";
import { Bell, Save, Send } from "lucide-react";
import { useToast } from "../../../components/ui/Toast.jsx";

export default function Notifications() {
  const toast = useToast((s) => s.push);
  const [enabled, setEnabled] = useState(false);
  const [prefs, setPrefs] = useState({
    attendanceChecks: true,
    shiftUpdates: true,
    otUpdates: true,
  });

  function toggle(key) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  }

  async function enable() {
    // Real implementation later: request permission + FCM token + save to backend
    setEnabled(true);
    toast({ title: "Enabled (UI)", message: "Connect your FCM flow later to make it live." });
  }

  async function save() {
    toast({ title: "Saved (UI)", message: "Preferences will be persisted once backend is connected." });
  }

  async function sendTest() {
    toast({ title: "Test requested", message: "Backend endpoint will trigger an FCM message later." });
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Notifications"
        subtitle="Push notifications for attendance checks, shift changes, and OT approvals."
        right={<Badge variant={enabled ? "success" : "neutral"}>{enabled ? "Enabled" : "Not enabled"}</Badge>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Device & push setup</CardTitle>
            <CardDescription>Enable notifications and store your device token.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <Bell className="h-5 w-5" />
                </span>
                <div className="text-sm text-slate-700">
                  In production: browser permission → FCM token → save token for the logged in user.
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={enable}><Save className="h-4 w-4" />Enable</Button>
              <Button variant="secondary" onClick={sendTest}><Send className="h-4 w-4" />Send test</Button>
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
              { key: "attendanceChecks", title: "Attendance checks", desc: "Scheduled / random verification requests." },
              { key: "shiftUpdates", title: "Shift updates", desc: "Swap requests, reschedules, open shifts." },
              { key: "otUpdates", title: "Overtime updates", desc: "Approvals, rejection reasons, payment status." },
            ].map((p) => (
              <button
                key={p.key}
                onClick={() => toggle(p.key)}
                className="w-full text-left rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{p.title}</div>
                    <div className="mt-1 text-sm text-slate-600">{p.desc}</div>
                  </div>
                  <Badge variant={prefs[p.key] ? "success" : "neutral"}>{prefs[p.key] ? "On" : "Off"}</Badge>
                </div>
              </button>
            ))}

            <div className="pt-2">
              <Button onClick={save} variant="secondary">Save preferences</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}