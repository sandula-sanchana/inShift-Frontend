import React, { useEffect, useMemo, useState } from "react";
import {
    Clock3,
    CalendarDays,
    RefreshCw,
    CheckCircle2,
    XCircle,
    ArrowRightLeft,
    Loader2,
    TimerReset,
    User,
    MessageSquare,
    X,
    Inbox
} from "lucide-react";
import { api } from "../../lib/api.js";
import { Button } from "../../components/ui/Button.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card.jsx";
import { useToast } from "../../components/ui/toast-store.js";

function ToneBadge({ children, tone = "slate" }) {
    const tones = {
        emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
        amber: "border-amber-500/20 bg-amber-500/10 text-amber-300",
        rose: "border-rose-500/20 bg-rose-500/10 text-rose-300",
        cyan: "border-cyan-500/20 bg-cyan-500/10 text-cyan-300",
        indigo: "border-indigo-500/20 bg-indigo-500/10 text-indigo-300",
        slate: "border-white/10 bg-white/[0.05] text-slate-300",
    };

    return (
        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${tones[tone] || tones.slate}`}>
      {children}
    </span>
    );
}

function getStatusTone(status) {
    switch ((status || "").toUpperCase()) {
        case "ASSIGNED":
            return "indigo";
        case "ACCEPTED":
        case "APPROVED":
        case "PAID":
            return "emerald";
        case "DECLINED":
        case "REJECTED":
        case "CANCELLED":
            return "rose";
        case "SWAP_PENDING":
        case "PENDING":
            return "amber";
        default:
            return "slate";
    }
}

function formatDate(date) {
    if (!date) return "-";
    try {
        return new Date(date).toLocaleDateString();
    } catch {
        return date;
    }
}

function formatDateTime(value) {
    if (!value) return "-";
    try {
        return new Date(value).toLocaleString();
    } catch {
        return value;
    }
}

function formatTime(value) {
    if (!value) return "-";
    return String(value).slice(0, 5);
}

function StatCard({ title, value, hint, icon: Icon, tone = "indigo" }) {
    const tones = {
        indigo: "border-indigo-500/20 bg-indigo-500/5 text-indigo-300",
        emerald: "border-emerald-500/20 bg-emerald-500/5 text-emerald-300",
        amber: "border-amber-500/20 bg-amber-500/5 text-amber-300",
        cyan: "border-cyan-500/20 bg-cyan-500/5 text-cyan-300",
    };

    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</div>
                    <div className="mt-3 text-2xl font-bold text-white">{value}</div>
                    <div className="mt-2 text-xs text-slate-400">{hint}</div>
                </div>

                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${tones[tone] || tones.indigo}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </div>
    );
}

function Drawer({ open, title, onClose, children }) {
    return (
        <>
            <div
                className={`fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm transition ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
                onClick={onClose}
            />
            <div
                className={`fixed right-0 top-0 z-[80] h-full w-full max-w-xl transform border-l border-white/10 bg-[#07111f]/95 shadow-2xl backdrop-blur-2xl transition-transform duration-300 ${
                    open ? "translate-x-0" : "translate-x-full"
                }`}
            >
                <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                    <div>
                        <div className="text-lg font-bold text-white">{title}</div>
                        <div className="text-xs text-slate-400">Overtime actions</div>
                    </div>

                    <button
                        onClick={onClose}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="h-[calc(100%-81px)] overflow-y-auto p-6">
                    {children}
                </div>
            </div>
        </>
    );
}

export default function MyOvertime() {
    const toast = useToast((s) => s.push);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [submittingId, setSubmittingId] = useState(null);

    const [assignments, setAssignments] = useState([]);
    const [incomingSwaps, setIncomingSwaps] = useState([]);

    const [declineOpen, setDeclineOpen] = useState(false);
    const [swapOpen, setSwapOpen] = useState(false);

    const [selectedAssignment, setSelectedAssignment] = useState(null);

    const [declineNote, setDeclineNote] = useState("");
    const [swapToEmployeeId, setSwapToEmployeeId] = useState("");
    const [swapNote, setSwapNote] = useState("");

    async function loadAll(silent = false) {
        try {
            if (silent) setRefreshing(true);
            else setLoading(true);

            const [assignmentRes, swapRes] = await Promise.all([
                api.get("/v1/emp/ot/my"),
                api.get("/v1/emp/ot/swaps/incoming"),
            ]);

            setAssignments(assignmentRes?.data?.data || []);
            setIncomingSwaps(swapRes?.data?.data || []);
        } catch (e) {
            toast({
                title: "Load failed",
                message: e?.response?.data?.message || "Could not load overtime data.",
                variant: "error",
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    useEffect(() => {
        loadAll();
    }, []);

    const stats = useMemo(() => {
        const total = assignments.length;
        const needAction = assignments.filter((a) => a.status === "ASSIGNED").length;
        const accepted = assignments.filter((a) => a.status === "ACCEPTED").length;
        const swaps = incomingSwaps.filter((s) => s.status === "PENDING").length;
        return { total, needAction, accepted, swaps };
    }, [assignments, incomingSwaps]);

    function openDecline(assignment) {
        setSelectedAssignment(assignment);
        setDeclineNote("");
        setDeclineOpen(true);
    }

    function openSwap(assignment) {
        setSelectedAssignment(assignment);
        setSwapToEmployeeId("");
        setSwapNote("");
        setSwapOpen(true);
    }

    async function acceptOvertime(id) {
        try {
            setSubmittingId(id);
            await api.patch(`/v1/emp/ot/${id}/accept`);
            toast({
                title: "OT accepted",
                message: "Your overtime assignment was accepted successfully.",
                variant: "success",
            });
            await loadAll(true);
        } catch (e) {
            toast({
                title: "Accept failed",
                message: e?.response?.data?.message || "Could not accept overtime.",
                variant: "error",
            });
        } finally {
            setSubmittingId(null);
        }
    }

    async function submitDecline() {
        if (!selectedAssignment?.id) return;

        try {
            setSubmittingId(selectedAssignment.id);
            await api.patch(`/v1/emp/ot/${selectedAssignment.id}/decline`, {
                note: declineNote,
            });

            toast({
                title: "OT declined",
                message: "Your decline response was submitted.",
                variant: "success",
            });

            setDeclineOpen(false);
            setSelectedAssignment(null);
            await loadAll(true);
        } catch (e) {
            toast({
                title: "Decline failed",
                message: e?.response?.data?.message || "Could not decline overtime.",
                variant: "error",
            });
        } finally {
            setSubmittingId(null);
        }
    }

    async function submitSwapOffer() {
        if (!selectedAssignment?.id) return;

        try {
            setSubmittingId(selectedAssignment.id);
            await api.post(`/v1/emp/ot/${selectedAssignment.id}/swap-offer`, {
                toEmployeeId: Number(swapToEmployeeId),
                note: swapNote,
            });

            toast({
                title: "Swap request sent",
                message: "Your OT swap offer was sent successfully.",
                variant: "success",
            });

            setSwapOpen(false);
            setSelectedAssignment(null);
            await loadAll(true);
        } catch (e) {
            toast({
                title: "Swap offer failed",
                message: e?.response?.data?.message || "Could not send swap request.",
                variant: "error",
            });
        } finally {
            setSubmittingId(null);
        }
    }

    async function respondToSwap(id, action) {
        try {
            setSubmittingId(`swap-${id}-${action}`);
            await api.patch(`/v1/emp/ot/swaps/${id}/${action}`);

            toast({
                title: action === "accept" ? "Swap accepted" : "Swap rejected",
                message:
                    action === "accept"
                        ? "The OT swap request was accepted."
                        : "The OT swap request was rejected.",
                variant: "success",
            });

            await loadAll(true);
        } catch (e) {
            toast({
                title: "Swap response failed",
                message: e?.response?.data?.message || "Could not update swap request.",
                variant: "error",
            });
        } finally {
            setSubmittingId(null);
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="text-3xl font-black tracking-tight text-white">My Overtime</div>
                    <div className="mt-2 text-sm text-slate-400">
                        Review your OT assignments, respond to new requests, and manage swap offers.
                    </div>
                </div>

                <Button variant="secondary" onClick={() => loadAll(true)} disabled={refreshing || loading}>
                    {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Refresh
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard title="Total OT" value={stats.total} hint="All assignments in your OT history" icon={Clock3} tone="indigo" />
                <StatCard title="Need Action" value={stats.needAction} hint="Assignments waiting for your response" icon={TimerReset} tone="amber" />
                <StatCard title="Accepted" value={stats.accepted} hint="Assignments you have accepted" icon={CheckCircle2} tone="emerald" />
                <StatCard title="Incoming Swaps" value={stats.swaps} hint="Pending swap requests from coworkers" icon={ArrowRightLeft} tone="cyan" />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <Card className="border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-none">
                    <CardHeader>
                        <CardTitle className="text-white">My OT Assignments</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {loading ? (
                            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/40 p-5 text-slate-300">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading overtime assignments...
                            </div>
                        ) : assignments.length === 0 ? (
                            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-8 text-center">
                                <Inbox className="mx-auto h-8 w-8 text-slate-500" />
                                <div className="mt-3 text-sm font-semibold text-white">No overtime assignments yet</div>
                                <div className="mt-1 text-xs text-slate-400">Your OT assignments will appear here.</div>
                            </div>
                        ) : (
                            assignments.map((item) => {
                                const canAcceptOrDecline = item.status === "ASSIGNED";
                                const canSwap = item.status === "ASSIGNED" || item.status === "ACCEPTED";

                                return (
                                    <div
                                        key={item.id}
                                        className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 backdrop-blur-sm"
                                    >
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="space-y-3">
                                                <div className="flex flex-wrap gap-2">
                                                    <ToneBadge tone={getStatusTone(item.status)}>{item.status}</ToneBadge>
                                                    <ToneBadge tone="indigo">{formatDate(item.otDate)}</ToneBadge>
                                                </div>

                                                <div className="grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarDays className="h-4 w-4 text-slate-500" />
                                                        OT Date: {formatDate(item.otDate)}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock3 className="h-4 w-4 text-slate-500" />
                                                        Time: {formatTime(item.startTime)} - {formatTime(item.endTime)}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <TimerReset className="h-4 w-4 text-slate-500" />
                                                        Duration: {item.durationMinutes} min
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-slate-500" />
                                                        Assigned by: {item.assignedByName || "-"}
                                                    </div>
                                                </div>

                                                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                                                    <div className="font-semibold text-white">Reason</div>
                                                    <div className="mt-2 leading-6">{item.reason || "-"}</div>
                                                </div>

                                                {item.employeeResponseNote && (
                                                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200">
                                                        <div className="font-semibold">Your response note</div>
                                                        <div className="mt-2 leading-6">{item.employeeResponseNote}</div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-3 lg:w-[260px] lg:flex-col">
                                                {canAcceptOrDecline && (
                                                    <>
                                                        <Button
                                                            onClick={() => acceptOvertime(item.id)}
                                                            disabled={submittingId === item.id}
                                                        >
                                                            {submittingId === item.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <CheckCircle2 className="h-4 w-4" />
                                                            )}
                                                            Accept
                                                        </Button>

                                                        <Button
                                                            variant="secondary"
                                                            onClick={() => openDecline(item)}
                                                            disabled={submittingId === item.id}
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                            Decline
                                                        </Button>
                                                    </>
                                                )}

                                                {canSwap && (
                                                    <Button
                                                        variant="secondary"
                                                        onClick={() => openSwap(item)}
                                                        disabled={String(submittingId).startsWith("swap-")}
                                                    >
                                                        <ArrowRightLeft className="h-4 w-4" />
                                                        Offer Swap
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </CardContent>
                </Card>

                <Card className="border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-none">
                    <CardHeader>
                        <CardTitle className="text-white">Incoming Swap Requests</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {loading ? (
                            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/40 p-5 text-slate-300">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading incoming swaps...
                            </div>
                        ) : incomingSwaps.length === 0 ? (
                            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-8 text-center">
                                <ArrowRightLeft className="mx-auto h-8 w-8 text-slate-500" />
                                <div className="mt-3 text-sm font-semibold text-white">No incoming swap requests</div>
                                <div className="mt-1 text-xs text-slate-400">Pending OT swap offers will appear here.</div>
                            </div>
                        ) : (
                            incomingSwaps.map((swap) => {
                                const acceptKey = `swap-${swap.id}-accept`;
                                const rejectKey = `swap-${swap.id}-reject`;

                                return (
                                    <div
                                        key={swap.id}
                                        className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 backdrop-blur-sm"
                                    >
                                        <div className="flex flex-wrap gap-2">
                                            <ToneBadge tone={getStatusTone(swap.status)}>{swap.status}</ToneBadge>
                                            <ToneBadge tone="cyan">Swap #{swap.id}</ToneBadge>
                                        </div>

                                        <div className="mt-4 space-y-2 text-sm text-slate-300">
                                            <div><span className="text-slate-500">From:</span> {swap.fromEmployeeName}</div>
                                            <div><span className="text-slate-500">To:</span> {swap.toEmployeeName}</div>
                                            <div><span className="text-slate-500">Created:</span> {formatDateTime(swap.createdAt)}</div>
                                        </div>

                                        {swap.note && (
                                            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                                                <div className="flex items-center gap-2 font-semibold text-white">
                                                    <MessageSquare className="h-4 w-4" />
                                                    Note
                                                </div>
                                                <div className="mt-2 leading-6">{swap.note}</div>
                                            </div>
                                        )}

                                        {swap.status === "PENDING" && (
                                            <div className="mt-4 flex flex-wrap gap-3">
                                                <Button
                                                    onClick={() => respondToSwap(swap.id, "accept")}
                                                    disabled={submittingId === acceptKey || submittingId === rejectKey}
                                                >
                                                    {submittingId === acceptKey ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <CheckCircle2 className="h-4 w-4" />
                                                    )}
                                                    Accept Swap
                                                </Button>

                                                <Button
                                                    variant="secondary"
                                                    onClick={() => respondToSwap(swap.id, "reject")}
                                                    disabled={submittingId === acceptKey || submittingId === rejectKey}
                                                >
                                                    {submittingId === rejectKey ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <XCircle className="h-4 w-4" />
                                                    )}
                                                    Reject Swap
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </CardContent>
                </Card>
            </div>

            <Drawer
                open={declineOpen}
                title="Decline Overtime"
                onClose={() => {
                    setDeclineOpen(false);
                    setSelectedAssignment(null);
                }}
            >
                <div className="space-y-5">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                        Declining OT requires a note. This will notify the admin who assigned it.
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-white">Decline note</label>
                        <textarea
                            value={declineNote}
                            onChange={(e) => setDeclineNote(e.target.value)}
                            rows={6}
                            className="w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500/40"
                            placeholder="Explain why you are declining this overtime assignment..."
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button
                            onClick={submitDecline}
                            disabled={!declineNote.trim() || submittingId === selectedAssignment?.id}
                        >
                            {submittingId === selectedAssignment?.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <XCircle className="h-4 w-4" />
                            )}
                            Submit Decline
                        </Button>

                        <Button
                            variant="secondary"
                            onClick={() => {
                                setDeclineOpen(false);
                                setSelectedAssignment(null);
                            }}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </Drawer>

            <Drawer
                open={swapOpen}
                title="Offer OT Swap"
                onClose={() => {
                    setSwapOpen(false);
                    setSelectedAssignment(null);
                }}
            >
                <div className="space-y-5">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                        Enter the target employee ID to offer a swap. Later you can replace this with a searchable employee selector.
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-white">Target employee ID</label>
                        <input
                            type="number"
                            value={swapToEmployeeId}
                            onChange={(e) => setSwapToEmployeeId(e.target.value)}
                            className="w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500/40"
                            placeholder="Enter employee ID"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-white">Note</label>
                        <textarea
                            value={swapNote}
                            onChange={(e) => setSwapNote(e.target.value)}
                            rows={5}
                            className="w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500/40"
                            placeholder="Add an optional note for the other employee..."
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button
                            onClick={submitSwapOffer}
                            disabled={!swapToEmployeeId || submittingId === selectedAssignment?.id}
                        >
                            {submittingId === selectedAssignment?.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <ArrowRightLeft className="h-4 w-4" />
                            )}
                            Send Swap Offer
                        </Button>

                        <Button
                            variant="secondary"
                            onClick={() => {
                                setSwapOpen(false);
                                setSelectedAssignment(null);
                            }}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </Drawer>
        </div>
    );
}