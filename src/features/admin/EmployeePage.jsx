import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Plus, Search, Pencil, Trash2, X, RefreshCw, Users } from "lucide-react";
import { createPortal } from "react-dom";


/** If you already have cn() util, you can remove this and import yours */
function cn(...xs) {
    return xs.filter(Boolean).join(" ");
}

function unwrapApi(resData) {
    // supports APIResponse<T> { code,message,data }
    return resData?.data ?? resData;
}

function getAxiosErrorMessage(err, fallback = "Request failed") {
    if (err?.code === "ERR_CANCELED") return "Canceled";
    const s = err?.response?.status;
    if (s) return `${fallback} (${s})`;
    return err?.message || fallback;
}

function validateEmployee(form) {
    const e = {};
    if (!form.empCode?.trim()) e.empCode = "Employee code is required";
    if (!form.fullName?.trim()) e.fullName = "Full name is required";
    if (!form.branchId) e.branchId = "Branch is required";
    if (form.email?.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = "Invalid email";
    if (form.phone?.trim() && !/^(?:\+94|0)?7\d{8}$/.test(form.phone.trim())) e.phone = "Invalid SL phone";
    return e;
}

/** Slide-over drawer (hidden until open=true) */
function SlideOver({ open, title, subtitle, children, onClose }) {
    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999]">
            {/* Backdrop */}
            <div
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/35 backdrop-blur-[2px]"
            />

            {/* Panel */}
            <div className="absolute right-0 top-0 h-full w-full sm:w-[560px] bg-white shadow-2xl">
                <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="text-base font-semibold text-white">{title}</div>
                            {subtitle && <div className="text-xs text-white/80 mt-0.5">{subtitle}</div>}
                        </div>

                        <button
                            onClick={onClose}
                            className="rounded-xl p-2 text-white/90 hover:bg-white/10"
                            aria-label="Close"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="p-5 sm:p-6 overflow-y-auto h-[calc(100%-64px)]">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}



function Field({ label, value, onChange, placeholder, error, type = "text" }) {
    return (
        <div>
            <div className="mb-1 text-xs font-semibold text-slate-600">{label}</div>
            <input
                type={type}
                value={value ?? ""}
                onChange={(e) => onChange?.(e.target.value)}
                placeholder={placeholder}
                className={cn(
                    "w-full rounded-2xl border bg-white px-3 py-2.5 text-sm outline-none",
                    "focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300",
                    error ? "border-rose-300 ring-2 ring-rose-100" : "border-slate-200"
                )}
            />
            {error && <div className="mt-1 text-xs text-rose-600">{error}</div>}
        </div>
    );
}

function Select({ label, value, onChange, options, error }) {
    return (
        <div>
            <div className="mb-1 text-xs font-semibold text-slate-600">{label}</div>
            <select
                value={value ?? ""}
                onChange={(e) => onChange?.(e.target.value)}
                className={cn(
                    "w-full rounded-2xl border bg-white px-3 py-2.5 text-sm outline-none",
                    "focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300",
                    error ? "border-rose-300 ring-2 ring-rose-100" : "border-slate-200"
                )}
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
            {error && <div className="mt-1 text-xs text-rose-600">{error}</div>}
        </div>
    );
}

function Badge({ active }) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                active ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
            )}
        >
      <span className={cn("h-2 w-2 rounded-full", active ? "bg-emerald-500" : "bg-slate-400")} />
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

    // drawer
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
                axios.get("/api/v1/employees", { signal: controller.signal }),
                axios.get("/api/v1/branch", { signal: controller.signal }),
            ]);

            const emp = unwrapApi(empRes.data);
            const br = unwrapApi(brRes.data);

            setEmployees(Array.isArray(emp) ? emp : []);
            setBranches(Array.isArray(br) ? br : []);
            setStatus("");
        } catch (e) {
            if (e?.code === "ERR_CANCELED") return;
            setStatus(getAxiosErrorMessage(e, "Load failed"));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadAll();
        return () => abortRef.current?.abort?.();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            empCode: form.empCode.trim(),
            fullName: form.fullName.trim(),
            email: form.email.trim() || null,
            phone: form.phone.trim() || null,
            role: form.role,
            branchId: Number(form.branchId),
            active: !!form.active,
        };

        try {
            setSaving(true);
            setStatus(mode === "edit" ? "Updating..." : "Saving...");

            if (mode === "edit") {
                await axios.put(`/api/v1/employees/${payload.employeeId}`, payload);
            } else {
                await axios.post("/api/v1/employees", payload);
            }

            setOpen(false);
            setStatus("✅ Saved!");
            await loadAll();
        } catch (e) {
            setStatus(getAxiosErrorMessage(e, mode === "edit" ? "Update failed" : "Save failed"));
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
            await axios.delete(`/api/v1/employees/${id}`);
            setStatus("✅ Deleted");
            await loadAll();
        } catch (e) {
            setStatus(getAxiosErrorMessage(e, "Delete failed"));
        }
    }

    return (
        <div className="space-y-5">
            {/* header */}
            <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 text-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                            <Users className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <div className="text-lg font-bold">Employees</div>
                            <div className="text-xs text-white/80">Search, add, edit and manage employees</div>
                        </div>
                    </div>

                    <button
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20 hover:bg-white/20"
                    >
                        <Plus className="h-4 w-4" />
                        Add Employee
                    </button>
                </div>
            </div>

            {/* toolbar */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[220px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search by code, name, email, phone, branch..."
                        className="w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
                    />
                </div>

                <button
                    onClick={loadAll}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    Refresh
                </button>

                {status && <div className="text-sm text-slate-600">{status}</div>}
            </div>

            {/* list container */}
            <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
                {/* desktop table */}
                <div className="hidden lg:block">
                    <table className="w-full text-sm">
                        <thead className="bg-gradient-to-r from-indigo-50 via-purple-50 to-cyan-50 text-slate-700">
                        <tr>
                            <th className="text-left font-semibold px-4 py-3">Code</th>
                            <th className="text-left font-semibold px-4 py-3">Name</th>
                            <th className="text-left font-semibold px-4 py-3">Email</th>
                            <th className="text-left font-semibold px-4 py-3">Phone</th>
                            <th className="text-left font-semibold px-4 py-3">Branch</th>
                            <th className="text-left font-semibold px-4 py-3">Status</th>
                            <th className="px-4 py-3" />
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.map((e) => (
                            <tr key={e.employeeId ?? e.id} className="border-t hover:bg-slate-50/60">
                                <td className="px-4 py-3 font-mono text-slate-700">{e.empCode}</td>
                                <td className="px-4 py-3 font-semibold text-slate-900">{e.fullName}</td>
                                <td className="px-4 py-3 text-slate-700">{e.email ?? "—"}</td>
                                <td className="px-4 py-3 text-slate-700">{e.phone ?? "—"}</td>
                                <td className="px-4 py-3 text-slate-700">
                                    {e.branchName ?? e.branch?.branchName ?? e.branchCode ?? "—"}
                                </td>
                                <td className="px-4 py-3">
                                    <Badge active={!!e.active} />
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => openEdit(e)}
                                            className="rounded-xl border border-slate-200 bg-white p-2 hover:bg-indigo-50"
                                            title="Edit"
                                        >
                                            <Pencil className="h-4 w-4 text-indigo-700" />
                                        </button>
                                        <button
                                            onClick={() => remove(e)}
                                            className="rounded-xl border border-slate-200 bg-white p-2 hover:bg-rose-50"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4 text-rose-600" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {!loading && filtered.length === 0 && (
                            <tr>
                                <td className="px-4 py-10 text-center text-slate-500" colSpan={7}>
                                    No employees found.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                {/* mobile cards */}
                <div className="lg:hidden p-3 sm:p-4 space-y-3">
                    {filtered.map((e) => (
                        <div key={e.employeeId ?? e.id} className="rounded-3xl border border-slate-200 p-4 bg-gradient-to-b from-white to-indigo-50/30">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="text-sm font-semibold text-slate-900">{e.fullName}</div>
                                    <div className="mt-1 text-xs text-slate-600 font-mono">{e.empCode}</div>
                                </div>
                                <Badge active={!!e.active} />
                            </div>

                            <div className="mt-3 grid gap-1 text-sm text-slate-700">
                                <div><span className="text-slate-500">Email:</span> {e.email ?? "—"}</div>
                                <div><span className="text-slate-500">Phone:</span> {e.phone ?? "—"}</div>
                                <div>
                                    <span className="text-slate-500">Branch:</span>{" "}
                                    {e.branchName ?? e.branch?.branchName ?? "—"}
                                </div>
                            </div>

                            <div className="mt-3 flex gap-2">
                                <button
                                    onClick={() => openEdit(e)}
                                    className="flex-1 rounded-2xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => remove(e)}
                                    className="flex-1 rounded-2xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"
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

            {/* drawer (form not visible until open) */}
            <SlideOver
                open={open}
                title={mode === "edit" ? "Edit Employee" : "Add Employee"}
                subtitle={mode === "edit" ? "Update employee details" : "Create a new employee"}
                onClose={() => setOpen(false)}
            >
                <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <Field
                            label="Employee Code"
                            placeholder="EMP-001"
                            value={form.empCode}
                            onChange={(v) => setField("empCode", v)}
                            error={errors.empCode}
                        />
                        <Field
                            label="Full Name"
                            placeholder="Sandula Sanchana"
                            value={form.fullName}
                            onChange={(v) => setField("fullName", v)}
                            error={errors.fullName}
                        />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
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

                    <div className="grid gap-3 sm:grid-cols-2">
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

                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <input
                            type="checkbox"
                            checked={!!form.active}
                            onChange={(e) => setField("active", e.target.checked)}
                            className="h-4 w-4"
                        />
                        Active
                    </label>

                    {status && <div className="text-sm text-slate-600">{status}</div>}

                    <div className="flex gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={saving}
                            onClick={save}
                            className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
                        >
                            {saving ? "Saving..." : mode === "edit" ? "Update" : "Save"}
                        </button>
                    </div>
                </div>
            </SlideOver>
        </div>
    );
}
