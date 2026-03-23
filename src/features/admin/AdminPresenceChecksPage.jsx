import React, { useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import { Button } from "../../components/ui/Button.jsx";
import { Badge } from "../../components/ui/Badge.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/Card.jsx";
import { Loader2, RefreshCw, Send } from "lucide-react";

const ADMIN_BASE = "/v1/admin/presence-check";
const EMP_BASE = "/v1/admin/employees";

function unwrapApiResponse(resData) {
    if (resData && typeof resData === "object" && "data" in resData) return resData.data;
    return resData;
}

function getErrorMessage(err, fallback = "Request failed") {
    const msgFromBackend = err?.response?.data?.message || err?.response?.data?.msg;
    if (msgFromBackend) return msgFromBackend;
    const status = err?.response?.status;
    if (status) return `${fallback} (${status})`;
    return err?.message || fallback;
}

export default function AdminPresenceChecksPage() {
    const [employees, setEmployees] = useState([]);
    const [activeChecks, setActiveChecks] = useState([]);
    const [historyChecks, setHistoryChecks] = useState([]);

    const [loadingEmployees, setLoadingEmployees] = useState(true);
    const [loadingActive, setLoadingActive] = useState(true);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [triggering, setTriggering] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [error, setError] = useState(null);

    const [form, setForm] = useState({
        employeeId: "",
        triggerReason: "ADMIN_MANUAL",
        sourceExpected: "ANY",
        triggerDescription: "",
        adminNote: "",
        dueInSeconds: 300,
    });

    async function loadEmployees() {
        try {
            setLoadingEmployees(true);
            const res = await api.get(EMP_BASE);
            const data = unwrapApiResponse(res.data) || [];
            setEmployees(Array.isArray(data) ? data : []);
        } catch {
            setEmployees([]);
        } finally {
            setLoadingEmployees(false);
        }
    }

    async function loadActiveChecks() {
        try {
            setLoadingActive(true);
            const res = await api.get(`${ADMIN_BASE}/active`);
            const data = unwrapApiResponse(res.data) || [];
            setActiveChecks(Array.isArray(data) ? data : []);
        } catch {
            setActiveChecks([]);
        } finally {
            setLoadingActive(false);
        }
    }

    async function loadHistoryChecks() {
        try {
            setLoadingHistory(true);
            const res = await api.get(`${ADMIN_BASE}/history`);
            const data = unwrapApiResponse(res.data) || [];
            setHistoryChecks(Array.isArray(data) ? data : []);
        } catch {
            setHistoryChecks([]);
        } finally {
            setLoadingHistory(false);
        }
    }

    async function loadAll() {
        setError(null);
        setRefreshing(true);
        try {
            await Promise.all([
                loadEmployees(),
                loadActiveChecks(),
                loadHistoryChecks(),
            ]);
        } catch (e) {
            setError(getErrorMessage(e, "Failed to refresh presence checks"));
        } finally {
            setRefreshing(false);
        }
    }

    useEffect(() => {
        loadAll();
    }, []);

    function updateField(key, value) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    async function triggerManualCheck(e) {
        e.preventDefault();

        if (!form.employeeId) {
            setError("Please select an employee.");
            return;
        }

        setTriggering(true);
        setError(null);

        try {
            await api.post(`${ADMIN_BASE}/trigger`, {
                employeeId: Number(form.employeeId),
                triggerReason: form.triggerReason,
                sourceExpected: form.sourceExpected,
                triggerDescription: form.triggerDescription || null,
                adminNote: form.adminNote || null,
                dueInSeconds: Number(form.dueInSeconds),
            });

            setForm((prev) => ({
                ...prev,
                triggerDescription: "",
                adminNote: "",
            }));

            await Promise.all([loadActiveChecks(), loadHistoryChecks()]);
        } catch (e) {
            setError(getErrorMessage(e, "Failed to trigger presence check"));
        } finally {
            setTriggering(false);
        }
    }

    return (
        <div className="space-y-8">
            <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white">Presence Checks</h1>
                    <p className="mt-2 text-sm text-slate-400">
                        Trigger manual presence checks and monitor active and historical verification events.
                    </p>
                </div>

                <Button
                    onClick={loadAll}
                    disabled={refreshing}
                    className="bg-white/5 border border-white/10 text-white hover:bg-white/10"
                >
                    {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Refresh
                </Button>
            </header>

            {error && (
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-300">
                    {error}
                </div>
            )}

            <Card className="bg-white/[0.03] border-white/10 text-white">
                <CardHeader>
                    <CardTitle>Manual Trigger</CardTitle>
                    <CardDescription className="text-slate-400">
                        Send an immediate presence verification request to an employee.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={triggerManualCheck} className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm text-slate-300">Employee</label>
                            <select
                                value={form.employeeId}
                                onChange={(e) => updateField("employeeId", e.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white outline-none"
                                disabled={loadingEmployees}
                            >
                                <option value="">Select employee</option>
                                {employees.map((emp) => (
                                    <option key={emp.employeeId} value={emp.employeeId}>
                                        {emp.fullName || emp.name} {emp.empCode ? `(${emp.empCode})` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm text-slate-300">Trigger Reason</label>
                            <select
                                value={form.triggerReason}
                                onChange={(e) => updateField("triggerReason", e.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white outline-none"
                            >
                                <option value="ADMIN_MANUAL">ADMIN_MANUAL</option>
                                <option value="RANDOM">RANDOM</option>
                                <option value="RISK_PATTERN">RISK_PATTERN</option>
                                <option value="LOCATION_ANOMALY">LOCATION_ANOMALY</option>
                                <option value="DEVICE_ANOMALY">DEVICE_ANOMALY</option>
                                <option value="RULE_ENGINE">RULE_ENGINE</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm text-slate-300">Expected Source</label>
                            <select
                                value={form.sourceExpected}
                                onChange={(e) => updateField("sourceExpected", e.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white outline-none"
                            >
                                <option value="ANY">ANY</option>
                                <option value="COMPANY_PC">COMPANY_PC</option>
                                <option value="MOBILE_BIOMETRIC">MOBILE_BIOMETRIC</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm text-slate-300">Due In Seconds</label>
                            <input
                                type="number"
                                min="30"
                                value={form.dueInSeconds}
                                onChange={(e) => updateField("dueInSeconds", e.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white outline-none"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm text-slate-300">Description</label>
                            <input
                                type="text"
                                value={form.triggerDescription}
                                onChange={(e) => updateField("triggerDescription", e.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white outline-none"
                                placeholder="Optional trigger description"
                            />
                        </div>

                        <div className="lg:col-span-2">
                            <label className="mb-2 block text-sm text-slate-300">Admin Note</label>
                            <textarea
                                value={form.adminNote}
                                onChange={(e) => updateField("adminNote", e.target.value)}
                                className="min-h-[110px] w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-white outline-none"
                                placeholder="Optional admin note"
                            />
                        </div>

                        <div className="lg:col-span-2">
                            <Button type="submit" disabled={triggering} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                                {triggering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                Trigger Presence Check
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card className="bg-white/[0.03] border-white/10 text-white">
                <CardHeader>
                    <CardTitle>Active Checks</CardTitle>
                    <CardDescription className="text-slate-400">
                        Live pending presence verification requests.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingActive ? (
                        <div className="flex items-center gap-2 text-slate-400">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading active checks...
                        </div>
                    ) : activeChecks.length === 0 ? (
                        <div className="text-sm text-slate-500">No active presence checks.</div>
                    ) : (
                        <div className="space-y-3">
                            {activeChecks.map((item) => (
                                <div
                                    key={item.id}
                                    className="rounded-2xl border border-white/10 bg-slate-900/40 p-4"
                                >
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                        <div>
                                            <div className="text-sm font-bold text-white">
                                                {item.employeeName} {item.empCode ? `(${item.empCode})` : ""}
                                            </div>
                                            <div className="mt-1 text-xs text-slate-400">
                                                {item.triggerReason} • Due: {item.dueAt ? new Date(item.dueAt).toLocaleString() : "-"}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="neutral">{item.status}</Badge>
                                            <Badge variant="neutral">{item.riskLevel}</Badge>
                                            <Badge variant="neutral">{item.sourceExpected}</Badge>
                                            {item.escalationLevel > 0 && (
                                                <Badge variant="warning">Escalation {item.escalationLevel}</Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="bg-white/[0.03] border-white/10 text-white">
                <CardHeader>
                    <CardTitle>History</CardTitle>
                    <CardDescription className="text-slate-400">
                        Recent presence verification outcomes.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingHistory ? (
                        <div className="flex items-center gap-2 text-slate-400">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading history...
                        </div>
                    ) : historyChecks.length === 0 ? (
                        <div className="text-sm text-slate-500">No presence-check history yet.</div>
                    ) : (
                        <div className="space-y-3">
                            {historyChecks.slice(0, 20).map((item) => (
                                <div
                                    key={item.id}
                                    className="rounded-2xl border border-white/10 bg-slate-900/40 p-4"
                                >
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                        <div>
                                            <div className="text-sm font-bold text-white">
                                                {item.employeeName} {item.empCode ? `(${item.empCode})` : ""}
                                            </div>
                                            <div className="mt-1 text-xs text-slate-400">
                                                {item.triggerReason} • Created: {item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}
                                            </div>
                                            <div className="mt-1 text-xs text-slate-500">
                                                Response: {item.responseSource || "-"} • Delay: {item.responseDelaySeconds ?? "-"}s
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="neutral">{item.status}</Badge>
                                            {item.lateResponse && <Badge variant="warning">Late</Badge>}
                                            {item.missedResponse && <Badge variant="danger">Missed</Badge>}
                                            <Badge variant="neutral">{item.riskLevel}</Badge>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}