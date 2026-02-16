import React, { useState } from "react";
import { SectionTitle } from "../../../components/common/SectionTitle.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/Card.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { Badge } from "../../../components/ui/Badge.jsx";
import { EmptyState } from "../../../components/common/EmptyState.jsx";
import { CalendarDays, Repeat2, Shuffle, PlusCircle, Users } from "lucide-react";
import { useToast } from "../../../components/ui/Toast.jsx";

const tabs = [
  { key: "calendar", label: "Calendar" },
  { key: "requests", label: "Requests" },
  { key: "open", label: "Open shifts" },
  { key: "availability", label: "Availability" },
];

export default function Shifts() {
  const toast = useToast((s) => s.push);
  const [tab, setTab] = useState("calendar");

  return (
    <div className="space-y-6">
      <SectionTitle
        title="My Shifts"
        subtitle="View schedule, request reschedule, swap shifts, pick open shifts, and set availability."
        right={<Badge variant="info">Self-service</Badge>}
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

      {tab === "calendar" ? (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Shift calendar</CardTitle>
                <CardDescription>Calendar/list view with shift details and actions.</CardDescription>
              </div>
              <Button variant="secondary" onClick={() => toast({ title: "Calendar", message: "Hook /shifts endpoints later." })}>
                <CalendarDays className="h-4 w-4" /> View modes
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <EmptyState title="No shifts loaded" description="Once backend is ready, this view will show upcoming shifts and details." />
          </CardContent>
        </Card>
      ) : null}

      {tab === "requests" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Request reschedule</CardTitle>
              <CardDescription>Propose new time/date and reason.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => toast({ title: "Reschedule", message: "Hook /shifts/reschedule-request later." })}>
                <Repeat2 className="h-4 w-4" /> Create request
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shift swap</CardTitle>
              <CardDescription>Offer your shift, select coworkers, accept/decline with audit trail.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={() => toast({ title: "Swap", message: "Hook /shifts/swap endpoints later." })}>
                <Shuffle className="h-4 w-4" /> Offer swap
              </Button>
              <div className="text-xs text-slate-500">
                Includes audit trail: offered → selected coworker → accepted/declined → timestamps.
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "open" ? (
        <Card>
          <CardHeader>
            <CardTitle>Open shifts</CardTitle>
            <CardDescription>Pick up shifts that are available.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="secondary" onClick={() => toast({ title: "Open shifts", message: "Hook /shifts/open endpoints later." })}>
              <PlusCircle className="h-4 w-4" /> Browse open shifts
            </Button>
            <EmptyState title="No open shifts loaded" description="Backend will provide open shifts list with eligibility rules." />
          </CardContent>
        </Card>
      ) : null}

      {tab === "availability" ? (
        <Card>
          <CardHeader>
            <CardTitle>Availability</CardTitle>
            <CardDescription>Set availability/unavailability to improve scheduling.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => toast({ title: "Availability", message: "Hook /availability endpoints later." })}>
              <Users className="h-4 w-4" /> Set availability
            </Button>
            <EmptyState title="No availability data" description="Connect backend to save availability windows and preferences." />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}