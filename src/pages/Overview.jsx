import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { SectionTitle } from "../components/common/SectionTitle";
import { Badge } from "../components/ui/Badge";
import { CalendarDays, Clock3, Bell, ShieldCheck, Fingerprint, MapPin } from "lucide-react";
import { authStore } from "../features/auth/store";
import { EmptyState } from "../components/common/EmptyState";
import { useToast } from "../components/ui/Toast";

function Stat({ icon: Icon, label, value, note, variant = "neutral" }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-softer">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <div className="text-xs font-medium text-slate-600">{label}</div>
            <div className="mt-1 text-xl font-semibold text-slate-900">{value}</div>
          </div>
        </div>
        <Badge variant={variant}>{note}</Badge>
      </div>
    </div>
  );
}

export default function Overview() {
  const user = authStore((s) => s.user);
  const toast = useToast((s) => s.push);

  return (
    <div className="space-y-6">
      <SectionTitle
        title={`Welcome, ${user?.name || "User"}`}
        subtitle="Here’s your workspace. Once the backend is connected, these cards will load real data."
        right={
          <button
            className="rounded-2xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            onClick={() =>
              toast({
                title: "Tip",
                message: "Set VITE_API_BASE_URL in .env to connect your backend later.",
              })
            }
          >
            Backend connect tip
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat icon={CalendarDays} label="Next shift" value="—" note="Schedule" />
        <Stat icon={Clock3} label="OT this week" value="—" note="Tracking" />
        <Stat icon={ShieldCheck} label="Verification" value="3 methods" note="Unified" variant="info" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Today’s timeline</CardTitle>
            <CardDescription>Attendance events from all sources will appear here.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              title="No events loaded"
              description="Once your API is ready, this will show entrance device events, mobile biometric verifies, and manual web check‑ins."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Most used actions for employees.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { icon: Bell, t: "Notification settings", d: "Manage push tokens and preferences." },
              { icon: Fingerprint, t: "Verify attendance", d: "Use mobile biometrics + location." },
              { icon: MapPin, t: "Location rules", d: "See allowed geofence / accuracy hints." },
            ].map((x) => (
              <motion.div
                key={x.t}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.15 }}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-softer"
              >
                <div className="flex items-start gap-3">
                  <x.icon className="h-5 w-5 text-slate-700 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{x.t}</div>
                    <div className="mt-1 text-sm text-slate-600">{x.d}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}