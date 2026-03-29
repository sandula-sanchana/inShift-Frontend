import React, { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, Pencil, Trash2, X, RefreshCw } from "lucide-react";
import { createPortal } from "react-dom";
import { api } from "../../lib/api";

const EMP_BASE = "/v1/admin/employees";
const BRANCH_BASE = "/v1/admin/branches";

function cn(...xs) {
    return xs.filter(Boolean).join(" ");
}

function unwrapApiResponse(resData) {
    if (resData && typeof resData === "object" && "data" in resData) return resData.data;
    return resData;
}

function apiMessage(resData) {
    return resData?.message || resData?.msg || "";
}

function getErrorMessage(err, fallback = "Request failed") {
    const msgFromBackend =
        err?.response?.data?.message ||
        err?.response?.data?.msg ||
        err?.response?.data?.data?.message;

    if (msgFromBackend) return msgFromBackend;

    const s = err?.response?.status;
    if (s) return `${fallback} (${s})`;

    return err?.message || fallback;
}

function validateEmployee(form) {
    const e = {};

    if (!form.fullName?.trim()) e.fullName = "Full name is required";
    if (!form.branchId) e.branchId = "Branch is required";
    if (form.email?.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = "Invalid email";
    if (form.phone?.trim() && !/^(?:\+94|0)?7\d{8}$/.test(form.phone.trim())) e.phone = "Invalid SL phone";

    return e;
}

function SlideOver({ open, title, subtitle, children, onClose }) {
    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999]">
            <div onClick={onClose} className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
            <div className="absolute right-0 top-0 h-full w-full sm:w-[560px] border-l border-white/10 bg-[#020617] shadow-2xl">
                <div className="border-b border-white/10 bg-white/[0.03] px-5 py-4 backdrop-blur-xl">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="text-base font-semibold text-white">{title}</div>
                            {subtitle && <div className="mt-0.5 text-xs text-slate-400">{subtitle}</div>}
                        </div>

                        <button
                            onClick={onClose}
                            className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-slate-300 transition hover:bg-white/[0.06]"
                            aria-label="Close"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="h-[calc(100%-73px)] overflow-y-auto p-5 sm:p-6">{children}</div>
            </div>
        </div>,
        document.body
    );
}

function Field({
                   label,
                   value,
                   onChange,
                   placeholder,
                   error,
                   type = "text",
                   disabled = false,
                   readOnly = false
               }) {
    return (
        <div>
            <div className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</div>
            <input
                type={type}
                value={value ?? ""}
                onChange={(e) => onChange?.(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                readOnly={readOnly}
                className={cn(
                    "w-full rounded-2xl border bg-white/[0.04] px-4 py-3 text-sm outline-none transition placeholder:text-slate-500",
                    disabled || readOnly
                        ? "cursor-not-allowed border-white/10 bg-white/[0.03] text-slate-400"
                        : "text-white focus:border-indigo-500/30 focus:bg-white/[0.06]",
                    error ? "border-rose-500/30 ring-2 ring-rose-500/10" : "border-white/10"
                )}
            />
            {error && <div className="mt-2 text-xs text-rose-400">{error}</div>}
        </div>
    );
}

function Select({ label, value, onChange, options, error }) {
    return (
        <div>
            <div className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</div>
            <select
                value={value ?? ""}
                onChange={(e) => onChange?.(e.target.value)}
                className={cn(
                    "w-full rounded-2xl border bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition",
                    "focus:border-indigo-500/30 focus:bg-white/[0.06]",
                    error ? "border-rose-500/30 ring-2 ring-rose-500/10" : "border-white/10"
                )}
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value} className="bg-slate-900 text-white">
                        {o.label}
                    </option>
                ))}
            </select>
            {error && <div className="mt-2 text-xs text-rose-400">{error}</div>}
        </div>
    );
}

function Badge({ active }) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
                active
                    ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20"
                    : "bg-slate-500/10 text-slate-300 ring-slate-500/20"
            )}
        >
            <span className={cn("h-2 w-2 rounded-full", active ? "bg-emerald-400" : "bg-slate-400")} />
            {active ? "Active" : "Inactive"}
        </span>
    );
}

export default function EmployeesPage() {
    const [employees, setEmployees] = useState([]);
    const [branches, setBranches] = useState([]);

    const [q, setQ] = useState("");
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState("create"); // create | edit
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const emptyForm = useMemo(
        () => ({
            employeeId: null,
            empCode: "",
            fullName: "",
            email: "",
            phone: "",
            role: "EMPLOYEE",
            branchId: "",
            active: true,
        }),
        []
    );

    const [form, setForm] = useState(emptyForm);
    const abortRef = useRef(null);

    async function loadAll() {
        if (abortRef.current) abortRef.current.abort();

        const controller = new AbortController();
        abortRef.current = controller;

        setLoading(true);
        setStatus("Loading employees...");

        try {
            const [empRes, brRes] = await Promise.all([
                api.get(EMP_BASE, { signal: controller.signal }),
                api.get(BRANCH_BASE, { signal: controller.signal }),
            ]);

            const emp = unwrapApiResponse(empRes.data);
            const br = unwrapApiResponse(brRes.data);

            setEmployees(Array.isArray(emp) ? emp : []);
            setBranches(Array.isArray(br) ? br : []);
            setStatus("");
        } catch (e) {
            if (e?.code === "ERR_CANCELED") return;
            setStatus(getErrorMessage(e, "Load failed"));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadAll();
        return () => abortRef.current?.abort?.();
    }, []);

    const branchOptions = useMemo(() => {
        const opts = branches.map((b) => ({
            value: String(b.branchId),
            label: `${b.branchCode ?? ""} ${b.branchName ?? ""}`.trim() || `Branch #${b.branchId}`,
        }));

        return [{ value: "", label: "Select branch..." }, ...opts];
    }, [branches]);

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return employees;

        return employees.filter((e) => {
            const branchName = e.branchName || e.branch?.branchName || "";

            return (
                String(e.empCode || "").toLowerCase().includes(s) ||
                String(e.fullName || "").toLowerCase().includes(s) ||
                String(e.email || "").toLowerCase().includes(s) ||
                String(e.phone || "").toLowerCase().includes(s) ||
                String(branchName).toLowerCase().includes(s)
            );
        });
    }, [employees, q]);

    function setField(key, val) {
        setForm((p) => ({ ...p, [key]: val }));
        setErrors((p) => ({ ...p, [key]: undefined }));
    }

    function openCreate() {
        setMode("create");
        setForm(emptyForm);
        setErrors({});
        setStatus("");
        setOpen(true);
    }

    function openEdit(emp) {
        setMode("edit");
        setForm({
            employeeId: emp.employeeId ?? emp.id ?? null,
            empCode: emp.empCode ?? "",
            fullName: emp.fullName ?? emp.name ?? "",
            email: emp.email ?? "",
            phone: emp.phone ?? emp.contactNumber ?? "",
            role: emp.role ?? "EMPLOYEE",
            branchId: String(emp.branchId ?? emp.branch?.branchId ?? ""),
            active: emp.active ?? true,
        });
        setErrors({});
        setStatus("");
        setOpen(true);
    }

    async function save() {
        const v = validateEmployee(form);
        setErrors(v);

        if (Object.keys(v).length) {
            setStatus("❌ Fix highlighted fields.");
            return;
        }

        const payload = {
            employeeId: mode === "edit" ? Number(form.employeeId) : null,
            fullName: form.fullName.trim(),
            email: form.email.trim() || null,
            phone: form.phone.trim() || null,
            role: form.role,
            branchId: Number(form.branchId),
            active: !!form.active,
        };

        if (mode === "edit") {
            payload.empCode = form.empCode;
        }

        try {
            setSaving(true);
            setStatus(mode === "edit" ? "Updating..." : "Saving...");

            if (mode === "edit") {
                await api.put(`${EMP_BASE}/${payload.employeeId}`, payload);
                setStatus("✅ Updated!");
            } else {
                const res = await api.post(EMP_BASE, payload);
                const data = unwrapApiResponse(res.data);
                const tempPassword = data?.tempPassword;

                if (tempPassword) {
                    alert(
                        `Employee Created Successfully!\n\nTemporary Password:\n${tempPassword}\n\n⚠️ Give this to the employee.`
                    );
                }

                setStatus(apiMessage(res.data) || "✅ Created!");
            }

            setOpen(false);
            await loadAll();
        } catch (e) {
            setStatus(getErrorMessage(e, mode === "edit" ? "Update failed" : "Save failed"));
        } finally {
            setSaving(false);
        }
    }

    async function remove(emp) {
        const id = emp.employeeId ?? emp.id;
        if (!id) return;

        const ok = window.confirm(`Delete employee ${emp.empCode || id}?`);
        if (!ok) return;

        try {
            setStatus("Deleting...");
            await api.delete(`${EMP_BASE}/${id}`);
            setStatus("✅ Deleted");
            await loadAll();
        } catch (e) {
            setStatus(getErrorMessage(e, "Delete failed"));
        }
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-8 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
                        <h1 className="text-3xl font-black tracking-tight text-white lg:text-4xl">
                            Employees
                        </h1>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                        Search, add, edit, and manage employee accounts across your branches.
                    </p>
                </div>

                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
                >
                    <Plus className="h-4 w-4" />
                    Add Employee
                </button>
            </header>

            <div className="mt-8 flex flex-wrap items-center gap-3">
                <div className="relative min-w-[220px] flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search by code, name, email, phone, branch..."
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500/30 focus:bg-white/[0.06]"
                    />
                </div>

                <button
                    onClick={loadAll}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]"
                >
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    Refresh
                </button>
            </div>

            {status && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300 backdrop-blur-xl">
                    {status}
                </div>
            )}

            <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-xl backdrop-blur-2xl">
                <div className="hidden overflow-x-auto lg:block">
                    <table className="w-full text-sm">
                        <thead className="bg-white/[0.03] text-slate-300">
                        <tr className="border-b border-white/10">
                            <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Code</th>
                            <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Name</th>
                            <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Email</th>
                            <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Phone</th>
                            <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Branch</th>
                            <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">Status</th>
                            <th className="px-4 py-4" />
                        </tr>
                        </thead>

                        <tbody>
                        {filtered.map((e) => (
                            <tr
                                key={e.employeeId ?? e.id}
                                className="border-t border-white/5 transition hover:bg-white/[0.03]"
                            >
                                <td className="px-4 py-4 font-mono text-slate-300">{e.empCode}</td>
                                <td className="px-4 py-4 font-semibold text-white">{e.fullName}</td>
                                <td className="px-4 py-4 text-slate-300">{e.email ?? "—"}</td>
                                <td className="px-4 py-4 text-slate-300">{e.phone ?? "—"}</td>
                                <td className="px-4 py-4 text-slate-300">
                                    {e.branchName ?? e.branch?.branchName ?? e.branchCode ?? "—"}
                                </td>
                                <td className="px-4 py-4">
                                    <Badge active={!!e.active} />
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => openEdit(e)}
                                            className="rounded-xl border border-white/10 bg-white/[0.03] p-2 transition hover:bg-indigo-500/10"
                                            title="Edit"
                                        >
                                            <Pencil className="h-4 w-4 text-indigo-300" />
                                        </button>
                                        <button
                                            onClick={() => remove(e)}
                                            className="rounded-xl border border-white/10 bg-white/[0.03] p-2 transition hover:bg-rose-500/10"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4 text-rose-300" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {!loading && filtered.length === 0 && (
                            <tr>
                                <td className="px-4 py-12 text-center text-slate-500" colSpan={7}>
                                    No employees found.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                <div className="space-y-3 p-4 lg:hidden">
                    {filtered.map((e) => (
                        <div
                            key={e.employeeId ?? e.id}
                            className="rounded-3xl border border-white/10 bg-white/[0.03] p-4"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="text-sm font-semibold text-white">{e.fullName}</div>
                                    <div className="mt-1 font-mono text-xs text-slate-500">{e.empCode}</div>
                                </div>
                                <Badge active={!!e.active} />
                            </div>

                            <div className="mt-3 grid gap-1 text-sm text-slate-300">
                                <div>
                                    <span className="text-slate-500">Email:</span> {e.email ?? "—"}
                                </div>
                                <div>
                                    <span className="text-slate-500">Phone:</span> {e.phone ?? "—"}
                                </div>
                                <div>
                                    <span className="text-slate-500">Branch:</span> {e.branchName ?? e.branch?.branchName ?? "—"}
                                </div>
                            </div>

                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={() => openEdit(e)}
                                    className="flex-1 rounded-2xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => remove(e)}
                                    className="flex-1 rounded-2xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}

                    {!loading && filtered.length === 0 && (
                        <div className="py-10 text-center text-sm text-slate-500">No employees found.</div>
                    )}
                </div>
            </div>

            <SlideOver
                open={open}
                title={mode === "edit" ? "Edit Employee" : "Add Employee"}
                subtitle={mode === "edit" ? "Update employee details" : "Create a new employee"}
                onClose={() => setOpen(false)}
            >
                <div className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        {mode === "edit" ? (
                            <Field
                                label="Employee Code"
                                value={form.empCode}
                                readOnly
                                disabled
                            />
                        ) : (
                            <Field
                                label="Employee Code"
                                value="Auto-generated by system"
                                readOnly
                                disabled
                            />
                        )}

                        <Field
                            label="Full Name"
                            placeholder="Sandula Sanchana"
                            value={form.fullName}
                            onChange={(v) => setField("fullName", v)}
                            error={errors.fullName}
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                            label="Email"
                            placeholder="name@example.com"
                            value={form.email}
                            onChange={(v) => setField("email", v)}
                            error={errors.email}
                            type="email"
                        />
                        <Field
                            label="Phone"
                            placeholder="076xxxxxxx"
                            value={form.phone}
                            onChange={(v) => setField("phone", v)}
                            error={errors.phone}
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Select
                            label="Role"
                            value={form.role}
                            onChange={(v) => setField("role", v)}
                            options={[
                                { value: "EMPLOYEE", label: "EMPLOYEE" },
                                { value: "SUPERVISOR", label: "SUPERVISOR" },
                                { value: "HR", label: "HR" },
                                { value: "ADMIN", label: "ADMIN" },
                            ]}
                        />
                        <Select
                            label="Branch"
                            value={form.branchId}
                            onChange={(v) => setField("branchId", v)}
                            options={branchOptions}
                            error={errors.branchId}
                        />
                    </div>

                    <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-300">
                        <input
                            type="checkbox"
                            checked={!!form.active}
                            onChange={(e) => setField("active", e.target.checked)}
                            className="h-4 w-4 rounded border-white/20 bg-slate-900"
                        />
                        Active
                    </label>

                    {status && (
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                            {status}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={saving}
                            onClick={save}
                            className="flex-1 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
                        >
                            {saving ? "Saving..." : mode === "edit" ? "Update" : "Save"}
                        </button>
                    </div>
                </div>
            </SlideOver>
        </div>
    );
}