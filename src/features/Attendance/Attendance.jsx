import React, { useState } from "react";
import { SectionTitle } from "../../components/common/SectionTitle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/common/EmptyState";
import { Fingerprint, Building2, Globe, MapPin, History, Filter } from "lucide-react";
import { useToast } from "../../components/ui/Toast";

const tabs = [
  { key: "timeline", label: "Timeline" },
  { key: "sources", label: "Sources" },
  { key: "history", label: "History" },
];

export default function Attendance() {
  const toast = useToast((s) => s.push);
  const [tab, setTab] = useState("timeline");

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Attendance"
        subtitle="Unified view across entrance device, mobile biometrics, and web manual check‑in."
        right={<Badge variant="info">3 sources</Badge>}
      />

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-2xl px-3 py-2 text-sm font-semibold transition ${
              tab === t.key ? "bg-slate-900 text-white shadow-soft" : "bg-white ring-1 ring-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "timeline" ? (
        <Card>
          <CardHeader>
            <CardTitle>Today timeline</CardTitle>
            <CardDescription>Events will appear in chronological order.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              title="No events loaded"
              description="Connect backend to show entrance fingerprint device logs, mobile biometric verifies, and web manual check-ins."
              onAction={() => toast({ title: "Backend", message: "Set VITE_API_BASE_URL and implement /attendance endpoints." })}
            />
          </CardContent>
        </Card>
      ) : null}

      {tab === "sources" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[
            { icon: Building2, title: "Entrance device integration", desc: "Fingerprint machine at entrance sends check‑in/out events." },
            { icon: Fingerprint, title: "Mobile biometrics + location", desc: "Push → open page → verify via WebAuthn → send device + location." },
            { icon: Globe, title: "Web manual check‑in + location", desc: "Fallback manual check‑in with location proof and policy rules." },
          ].map((c) => (
            <Card key={c.title}>
              <CardHeader>
                <CardTitle>{c.title}</CardTitle>
                <CardDescription>{c.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="secondary"
                  onClick={() => toast({ title: "Coming from backend", message: "This UI is ready. Hook your API later." })}
                >
                  Configure
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {tab === "history" ? (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>History</CardTitle>
                <CardDescription>Filter by date, source, and status.</CardDescription>
              </div>
              <Button variant="secondary" onClick={() => toast({ title: "Filters", message: "Hook up your /attendance/history API later." })}>
                <Filter className="h-4 w-4" /> Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <EmptyState title="No history yet" description="Once backend is connected, this table will show attendance history with filters." />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}