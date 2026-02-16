import React, { useMemo, useState } from "react";
import { SectionTitle } from "../../../components/common/SectionTitle.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/Card.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { Badge } from "../../../components/ui/Badge.jsx";
import { Fingerprint, MapPin, Smartphone, ShieldCheck, Loader2 } from "lucide-react";
import { useToast } from "../../../components/ui/Toast.jsx";

function getReqId() {
  const u = new URL(window.location.href);
  return u.searchParams.get("reqId") || "";
}

export default function Verify() {
  const toast = useToast((s) => s.push);
  const reqId = useMemo(() => getReqId(), []);
  const [state, setState] = useState("idle");

  async function onVerify() {
    setState("prompt");
    try {
      await new Promise((r) => setTimeout(r, 800));
      setState("success");
      toast({ title: "Verified (UI)", message: "Hook WebAuthn + location calls later." });
    } catch (e) {
      setState("error");
      toast({ title: "Failed", message: e.message || "Verification failed" });
    }
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Verify attendance"
        subtitle="Notification → open → Verify → fingerprint prompt → send device + location."
        right={<Badge variant={reqId ? "info" : "neutral"}>{reqId ? `reqId: ${reqId}` : "No request"}</Badge>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Biometric verification</CardTitle>
            <CardDescription>Uses passkeys/WebAuthn on supported devices. No fingerprint data stored.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: Fingerprint, label: "Biometric" },
                { icon: MapPin, label: "Location proof" },
                { icon: Smartphone, label: "Device data" },
              ].map((x) => (
                <div key={x.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-center gap-2">
                  <x.icon className="h-4 w-4 text-slate-700" />
                  <div className="text-sm font-semibold text-slate-900">{x.label}</div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-sm text-slate-700">
                When backend is connected, this button triggers the OS fingerprint UI via WebAuthn.
              </div>
            </div>

            <Button onClick={onVerify} disabled={state === "prompt" || state === "success"}>
              {state === "prompt" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {state === "success" ? "Verified" : "Verify now"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manual fallback</CardTitle>
            <CardDescription>Web manual check‑in with location, used only when policy allows.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="secondary"
              onClick={() => toast({ title: "Manual check-in", message: "Hook to /attendance/manual-checkin later." })}
            >
              Manual check‑in
            </Button>
            <div className="text-xs text-slate-500">
              In production, you can enforce geo rules + approvals for manual check-ins.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}