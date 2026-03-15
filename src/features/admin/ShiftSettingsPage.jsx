import React, { useEffect, useMemo, useState } from "react";
import {
    Clock3,
    Save,
    RefreshCw,
    AlertTriangle,
    ShieldCheck,
    TimerReset,
    Coffee,
    CalendarClock
} from "lucide-react";
import { api } from "../../lib/api.js";
import { cn } from "../../lib/cn";

const SHIFT_BASE = "/v1/admin/shifts/default";

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

function FieldCard({ title, subtitle, icon: Icon, children }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 backdrop-blur-xl">
            <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white">{title}</h3>
                    {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
                </div>
            </div>
            {children}
        </div>
    );
}

function InputLabel({ children }) {
    return (
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
            {children}
        </label>
    );
}

function TextInput(props) {
    return (
        <input
            {...props}
            className={cn(
                "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition",
                "placeholder:text-slate-500 focus:border-indigo-500/40 focus:bg-white/10",
                props.className
            )}
        />
    );
}

function NumberInput(props) {
    return (
        <input
            {...props}
            type="number"
            className={cn(
                "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition",
                "placeholder:text-slate-500 focus:border-indigo-500/40 focus:bg-white/10",
                props.className
            )}
        />
    );
}

function TimeInput(props) {
    return (
        <input
            {...props}
            type="time"
            className={cn(
                "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition",
                "focus:border-indigo-500/40 focus:bg-white/10",
                props.className
            )}
        />
    );
}

function Toggle({ checked, onChange, label, hint }) {
    return (
        <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div>
                <div className="text-sm font-semibold text-white">{label}</div>
                {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
            </div>

            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={cn(
                    "relative mt-0.5 h-7 w-12 rounded-full transition",
                    checked ? "bg-indigo-500" : "bg-slate-700"
                )}
            >
                <span
                    className={cn(
                        "absolute top-1 h-5 w-5 rounded-full bg-white transition",
                        checked ? "left-6" : "left-1"
                    )}
                />
            </button>
        </label>
    );
}

function buildDefaultForm() {
    return {
        shiftId: null,
        shiftName: "Default Office Shift",
        startTime: "08:00",
        endTime: "17:00",
        graceMinutes: 15,
        earlyCheckInMinutes: 30,
        earlyLeaveGraceMinutes: 10,
        overtimeAfterMinutes: 30,
        breakMinutes: 60,
        active: true,
        isDefault: true,
    };
}

export default function ShiftSettingsPage() {
    const [form, setForm] = useState(buildDefaultForm());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState("");

    const summary = useMemo(() => {
        const start = form.startTime || "--:--";
        const end = form.endTime || "--:--";
        return `${start} → ${end}`;
    }, [form.startTime, form.endTime]);

    const updateField = (key, value) => {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const resetDefaults = () => {
        setForm(buildDefaultForm());
        setSuccess("");
        setError(null);
    };

    const fetchShift = async () => {
        setLoading(true);
        setError(null);
        setSuccess("");

        try {
            const res = await api.get(SHIFT_BASE);
            const data = unwrapApiResponse(res.data);

            if (data) {
                setForm({
                    shiftId: data.shiftId ?? null,
                    shiftName: data.shiftName ?? "Default Office Shift",
                    startTime: data.startTime ?? "08:00",
                    endTime: data.endTime ?? "17:00",
                    graceMinutes: data.graceMinutes ?? 15,
                    earlyCheckInMinutes: data.earlyCheckInMinutes ?? 30,
                    earlyLeaveGraceMinutes: data.earlyLeaveGraceMinutes ?? 10,
                    overtimeAfterMinutes: data.overtimeAfterMinutes ?? 30,
                    breakMinutes: data.breakMinutes ?? 60,
                    active: data.active ?? true,
                    isDefault: true,
                });
            } else {
                setForm(buildDefaultForm());
            }
        } catch (e) {
            setError(getErrorMessage(e, "Failed to load shift settings"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShift();
    }, []);

    const validate = () => {
        if (!form.shiftName?.trim()) return "Shift name is required";
        if (!form.startTime) return "Start time is required";
        if (!form.endTime) return "End time is required";
        if (form.endTime <= form.startTime) return "End time must be after start time";

        const numericFields = [
            ["graceMinutes", "Grace minutes"],
            ["earlyCheckInMinutes", "Early check-in minutes"],
            ["earlyLeaveGraceMinutes", "Early leave grace minutes"],
            ["overtimeAfterMinutes", "Overtime after minutes"],
            ["breakMinutes", "Break minutes"],
        ];

        for (const [key, label] of numericFields) {
            const value = Number(form[key]);
            if (Number.isNaN(value) || value < 0) return `${label} cannot be negative`;
        }

        return null;
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess("");

        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        const payload = {
            shiftId: form.shiftId,
            shiftName: form.shiftName.trim(),
            startTime: form.startTime,
            endTime: form.endTime,
            graceMinutes: Number(form.graceMinutes),
            earlyCheckInMinutes: Number(form.earlyCheckInMinutes),
            earlyLeaveGraceMinutes: Number(form.earlyLeaveGraceMinutes),
            overtimeAfterMinutes: Number(form.overtimeAfterMinutes),
            breakMinutes: Number(form.breakMinutes),
            active: !!form.active,
            isDefault: true,
        };

        try {
            setSaving(true);
            const res = await api.put(SHIFT_BASE, payload);
            const data = unwrapApiResponse(res.data);

            setForm({
                shiftId: data?.shiftId ?? form.shiftId,
                shiftName: data?.shiftName ?? payload.shiftName,
                startTime: data?.startTime ?? payload.startTime,
                endTime: data?.endTime ?? payload.endTime,
                graceMinutes: data?.graceMinutes ?? payload.graceMinutes,
                earlyCheckInMinutes: data?.earlyCheckInMinutes ?? payload.earlyCheckInMinutes,
                earlyLeaveGraceMinutes: data?.earlyLeaveGraceMinutes ?? payload.earlyLeaveGraceMinutes,
                overtimeAfterMinutes: data?.overtimeAfterMinutes ?? payload.overtimeAfterMinutes,
                breakMinutes: data?.breakMinutes ?? payload.breakMinutes,
                active: data?.active ?? payload.active,
                isDefault: true,
            });

            setSuccess("Shift settings saved successfully.");
        } catch (e) {
            setError(getErrorMessage(e, "Failed to save shift settings"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-8 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
                        <h1 className="text-3xl font-black tracking-tight text-white lg:text-4xl">
                            Shift Settings
                        </h1>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                        Configure the default company work schedule used to evaluate attendance, late arrivals, early leave, and overtime.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={fetchShift}
                        disabled={loading || saving}
                        className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
                    >
                        <RefreshCw className={cn("h-4 w-4", (loading || saving) && "animate-spin")} />
                        Reload
                    </button>

                    <button
                        onClick={resetDefaults}
                        disabled={saving}
                        className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-sm font-bold text-amber-300 transition hover:bg-amber-500/15 disabled:opacity-50"
                    >
                        <TimerReset className="h-4 w-4" />
                        Reset Form
                    </button>
                </div>
            </header>

            {error && (
                <div className="mt-8 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-400">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>{error}</p>
                    </div>
                </div>
            )}

            {success && (
                <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-400">
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>{success}</p>
                    </div>
                </div>
            )}

            <div className="mt-10 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
                <form onSubmit={handleSave} className="space-y-6">
                    <FieldCard
                        icon={CalendarClock}
                        title="Default Work Schedule"
                        subtitle="This schedule is used for attendance calculation when no employee-specific shift is assigned."
                    >
                        <div className="grid gap-5 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <InputLabel>Shift name</InputLabel>
                                <TextInput
                                    value={form.shiftName}
                                    onChange={(e) => updateField("shiftName", e.target.value)}
                                    placeholder="Default Office Shift"
                                    disabled={loading || saving}
                                />
                            </div>

                            <div>
                                <InputLabel>Start time</InputLabel>
                                <TimeInput
                                    value={form.startTime}
                                    onChange={(e) => updateField("startTime", e.target.value)}
                                    disabled={loading || saving}
                                />
                            </div>

                            <div>
                                <InputLabel>End time</InputLabel>
                                <TimeInput
                                    value={form.endTime}
                                    onChange={(e) => updateField("endTime", e.target.value)}
                                    disabled={loading || saving}
                                />
                            </div>
                        </div>
                    </FieldCard>

                    <FieldCard
                        icon={Clock3}
                        title="Check-in Rules"
                        subtitle="Controls when employees are allowed to punch in and when late status begins."
                    >
                        <div className="grid gap-5 md:grid-cols-2">
                            <div>
                                <InputLabel>Grace minutes</InputLabel>
                                <NumberInput
                                    min="0"
                                    value={form.graceMinutes}
                                    onChange={(e) => updateField("graceMinutes", e.target.value)}
                                    disabled={loading || saving}
                                />
                            </div>

                            <div>
                                <InputLabel>Early check-in minutes</InputLabel>
                                <NumberInput
                                    min="0"
                                    value={form.earlyCheckInMinutes}
                                    onChange={(e) => updateField("earlyCheckInMinutes", e.target.value)}
                                    disabled={loading || saving}
                                />
                            </div>
                        </div>
                    </FieldCard>

                    <FieldCard
                        icon={TimerReset}
                        title="Check-out & Overtime Rules"
                        subtitle="Controls early leave tolerance and how overtime begins after shift end."
                    >
                        <div className="grid gap-5 md:grid-cols-2">
                            <div>
                                <InputLabel>Early leave grace minutes</InputLabel>
                                <NumberInput
                                    min="0"
                                    value={form.earlyLeaveGraceMinutes}
                                    onChange={(e) => updateField("earlyLeaveGraceMinutes", e.target.value)}
                                    disabled={loading || saving}
                                />
                            </div>

                            <div>
                                <InputLabel>Overtime after minutes</InputLabel>
                                <NumberInput
                                    min="0"
                                    value={form.overtimeAfterMinutes}
                                    onChange={(e) => updateField("overtimeAfterMinutes", e.target.value)}
                                    disabled={loading || saving}
                                />
                            </div>
                        </div>
                    </FieldCard>

                    <FieldCard
                        icon={Coffee}
                        title="Break Policy"
                        subtitle="Stored for future work-hour and overtime calculations."
                    >
                        <div className="grid gap-5 md:grid-cols-2">
                            <div>
                                <InputLabel>Break minutes</InputLabel>
                                <NumberInput
                                    min="0"
                                    value={form.breakMinutes}
                                    onChange={(e) => updateField("breakMinutes", e.target.value)}
                                    disabled={loading || saving}
                                />
                            </div>

                            <div className="md:self-end">
                                <Toggle
                                    checked={!!form.active}
                                    onChange={(value) => updateField("active", value)}
                                    label="Default shift active"
                                    hint="Attendance uses this shift only when it is active."
                                />
                            </div>
                        </div>
                    </FieldCard>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="submit"
                            disabled={loading || saving}
                            className="group flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-500 active:scale-95 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {saving ? "Saving..." : "Save Shift Settings"}
                        </button>
                    </div>
                </form>

                <div className="space-y-6">
                    <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-600/20 to-slate-900/40 p-6 shadow-xl backdrop-blur-xl">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/10 text-indigo-300">
                                <Clock3 className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-300/70">
                                    Current Schedule
                                </p>
                                <h3 className="mt-1 text-xl font-black text-white">{summary}</h3>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-3">
                            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                <p className="text-xs uppercase tracking-widest text-slate-500">Late starts after</p>
                                <p className="mt-2 text-lg font-bold text-white">
                                    {form.startTime || "--:--"} + {form.graceMinutes || 0} min
                                </p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                <p className="text-xs uppercase tracking-widest text-slate-500">Earliest check-in</p>
                                <p className="mt-2 text-lg font-bold text-white">
                                    {form.earlyCheckInMinutes || 0} min before shift
                                </p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                <p className="text-xs uppercase tracking-widest text-slate-500">Early leave grace</p>
                                <p className="mt-2 text-lg font-bold text-white">
                                    {form.earlyLeaveGraceMinutes || 0} min
                                </p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                <p className="text-xs uppercase tracking-widest text-slate-500">Overtime begins after</p>
                                <p className="mt-2 text-lg font-bold text-white">
                                    {form.overtimeAfterMinutes || 0} min past shift end
                                </p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                <p className="text-xs uppercase tracking-widest text-slate-500">Break duration</p>
                                <p className="mt-2 text-lg font-bold text-white">
                                    {form.breakMinutes || 0} min
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-900/30 p-5 backdrop-blur-xl">
                        <h3 className="text-sm font-bold text-white">How attendance uses this shift</h3>
                        <div className="mt-4 space-y-3 text-sm text-slate-400">
                            <p>
                                <span className="font-semibold text-slate-200">Check-in:</span> the system compares the punch time with shift start, early check-in allowance, and grace minutes to decide on-time or late.
                            </p>
                            <p>
                                <span className="font-semibold text-slate-200">Check-out:</span> the system compares the punch time with shift end, early leave grace, and overtime threshold to decide early leave, normal, or overtime.
                            </p>
                            <p>
                                <span className="font-semibold text-slate-200">Fallback rule:</span> if an employee has no custom shift, this default active shift is used automatically.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}