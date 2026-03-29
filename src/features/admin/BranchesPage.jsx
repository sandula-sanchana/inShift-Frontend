import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, Circle } from "react-leaflet";
import { Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import L from "leaflet";
import { api } from "../../lib/api.js";

// ======= CONFIG (change here if your paths differ) =======
const GEO_BASE = "/v1/admin/geocode";
const BRANCH_BASE = "/v1/admin/branches";
// =========================================================

// Fix leaflet default marker in Vite
const markerIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

function PanTo({ lat, lng }) {
    const map = useMap();
    useEffect(() => {
        if (lat != null && lng != null) map.setView([lat, lng], 16, { animate: true });
    }, [lat, lng, map]);
    return null;
}

function ClickToPick({ onPick }) {
    useMapEvents({
        click(e) {
            onPick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

function useDebounced(value, ms = 450) {
    const [d, setD] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setD(value), ms);
        return () => clearTimeout(t);
    }, [value, ms]);
    return d;
}

// ========== APIResponse helpers ==========
function unwrapApiResponse(resData) {
    if (resData && typeof resData === "object" && "data" in resData) return resData.data;
    return resData;
}

function apiMessage(resData) {
    return resData?.message || resData?.msg || "";
}

// Geo endpoints return APIResponse<String> where data is JSON string
function parseJsonStringMaybe(x) {
    if (x == null) return null;
    if (typeof x === "string") {
        try {
            return JSON.parse(x);
        } catch {
            return x;
        }
    }
    return x;
}

function getErrorMessage(err, fallback = "Request failed") {
    const status = err?.response?.status;
    const msgFromBackend =
        err?.response?.data?.message ||
        err?.response?.data?.msg ||
        err?.response?.data?.data?.message;

    if (msgFromBackend) return msgFromBackend;
    if (status) return `${fallback} (${status})`;
    return err?.message || fallback;
}
// =========================================

function pickCity(addr, fallback = "") {
    const raw =
        addr.city ||
        addr.town ||
        addr.village ||
        addr.municipality ||
        addr.city_district ||
        addr.suburb ||
        addr.hamlet ||
        addr.county ||
        fallback;

    if (typeof raw !== "string") return fallback;
    return raw.replace(/\s*DS Division\s*/i, "").trim();
}

function validateBranch(form) {
    const errors = {};
    if (!form.branchCode?.trim()) errors.branchCode = "Branch code is required";
    if (!form.branchName?.trim()) errors.branchName = "Branch name is required";
    if (!form.addressLine1?.trim()) errors.addressLine1 = "Address line 1 is required";
    if (!form.city?.trim()) errors.city = "City is required";
    if (!form.district?.trim()) errors.district = "District is required";
    if (!form.province?.trim()) errors.province = "Province is required";

    if (form.latitude == null || Number.isNaN(Number(form.latitude))) errors.latitude = "Pick a location on the map";
    if (form.longitude == null || Number.isNaN(Number(form.longitude))) errors.longitude = "Pick a location on the map";

    const r = Number(form.radiusMeters);
    if (!Number.isFinite(r) || r <= 0) errors.radiusMeters = "Radius must be > 0 meters";
    if (r < 10) errors.radiusMeters = "Radius must be at least 10 meters";
    if (r > 5000) errors.radiusMeters = "Radius must be 5000 meters or less";

    if (form.email?.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = "Invalid email";
    return errors;
}

function emptyBranchForm() {
    return {
        branchId: null,
        branchCode: "",
        branchName: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        district: "",
        province: "",
        latitude: null,
        longitude: null,
        radiusMeters: 200,
        contactNumber: "",
        email: "",
        active: true,
    };
}

export default function BranchesPage() {
    const [branches, setBranches] = useState([]);
    const [q, setQ] = useState("");

    const [mode, setMode] = useState("create"); // create | edit
    const [form, setForm] = useState(emptyBranchForm());

    const [addressQuery, setAddressQuery] = useState("");
    const debouncedQuery = useDebounced(addressQuery, 650);
    const [suggestions, setSuggestions] = useState([]);
    const [status, setStatus] = useState("");

    const [loadingList, setLoadingList] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const abortSearchRef = useRef(null);
    const abortReverseRef = useRef(null);
    const abortListRef = useRef(null);

    const mapCenter = useMemo(
        () => [form.latitude ?? 6.9271, form.longitude ?? 79.8612],
        [form.latitude, form.longitude]
    );

    const filteredBranches = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return branches;

        return branches.filter((b) => {
            return (
                String(b.branchCode || "").toLowerCase().includes(s) ||
                String(b.branchName || "").toLowerCase().includes(s) ||
                String(b.city || "").toLowerCase().includes(s) ||
                String(b.district || "").toLowerCase().includes(s) ||
                String(b.province || "").toLowerCase().includes(s) ||
                String(b.email || "").toLowerCase().includes(s) ||
                String(b.contactNumber || "").toLowerCase().includes(s)
            );
        });
    }, [branches, q]);

    async function loadBranches() {
        if (abortListRef.current) abortListRef.current.abort();

        const controller = new AbortController();
        abortListRef.current = controller;

        try {
            setLoadingList(true);
            setStatus("Loading branches...");

            const res = await api.get(BRANCH_BASE, { signal: controller.signal });
            const data = unwrapApiResponse(res.data);

            setBranches(Array.isArray(data) ? data : []);
            setStatus("");
        } catch (e) {
            if (e?.code === "ERR_CANCELED") return;
            setStatus(getErrorMessage(e, "Failed to load branches"));
        } finally {
            setLoadingList(false);
        }
    }

    useEffect(() => {
        loadBranches();
        return () => {
            abortListRef.current?.abort?.();
            abortSearchRef.current?.abort?.();
            abortReverseRef.current?.abort?.();
        };
    }, []);

    // SEARCH address
    useEffect(() => {
        const qv = debouncedQuery.trim();
        if (qv.length < 4) {
            setSuggestions([]);
            return;
        }

        if (abortSearchRef.current) abortSearchRef.current.abort();
        const controller = new AbortController();
        abortSearchRef.current = controller;

        (async () => {
            try {
                setStatus("Searching address...");
                const res = await api.get(`${GEO_BASE}/search`, {
                    params: { q: qv },
                    signal: controller.signal,
                });

                const raw = unwrapApiResponse(res.data);
                const parsed = parseJsonStringMaybe(raw);

                setSuggestions(Array.isArray(parsed) ? parsed : []);
                setStatus(Array.isArray(parsed) && parsed.length ? "" : "No matches. Try more details.");
            } catch (e) {
                if (e?.code === "ERR_CANCELED") return;
                setStatus(getErrorMessage(e, "Search failed"));
            }
        })();
    }, [debouncedQuery]);

    function selectSuggestion(s) {
        const lat = Number(s.lat);
        const lng = Number(s.lon);
        const addr = s.address || {};

        setForm((prev) => ({
            ...prev,
            addressLine1: addr.road || addr.neighbourhood || prev.addressLine1,
            city: pickCity(addr, prev.city),
            district: addr.state_district || addr.county || prev.district,
            province: addr.state || prev.province,
            latitude: lat,
            longitude: lng,
        }));

        setAddressQuery(s.display_name || "");
        setSuggestions([]);
        setStatus("✅ Location selected. You can adjust by clicking the map.");
        setErrors((e) => ({ ...e, latitude: undefined, longitude: undefined }));
    }

    // REVERSE geocode when map clicked
    async function onPick(lat, lng) {
        setStatus("📍 Location set. Finding address...");

        if (abortReverseRef.current) abortReverseRef.current.abort();
        const controller = new AbortController();
        abortReverseRef.current = controller;

        try {
            const res = await api.get(`${GEO_BASE}/reverse`, {
                params: { lat, lng },
                signal: controller.signal,
            });

            const raw = unwrapApiResponse(res.data);
            const parsed = parseJsonStringMaybe(raw) || {};
            const addr = parsed.address || {};

            setForm((prev) => ({
                ...prev,
                latitude: lat,
                longitude: lng,
                addressLine1:
                    [addr.house_number, addr.road].filter(Boolean).join(" ") ||
                    addr.neighbourhood ||
                    addr.suburb ||
                    prev.addressLine1,
                city: pickCity(addr, prev.city),
                district: addr.state_district || addr.county || prev.district,
                province: addr.state || prev.province,
            }));

            setStatus("✅ Address filled from selected point.");
        } catch (e) {
            if (e?.code === "ERR_CANCELED") return;
            setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
            setStatus("⚠️ Couldn't fetch address. You can type it manually.");
        }
    }

    function useMyLocation() {
        if (!navigator.geolocation) {
            setStatus("Geolocation not supported.");
            return;
        }

        setStatus("Getting your location...");

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude, accuracy } = pos.coords;
                setStatus(`📍 Location set (accuracy ~${Math.round(accuracy)}m). Filling address...`);
                onPick(latitude, longitude);
            },
            (err) => {
                setStatus(err.code === 1 ? "Location permission denied." : "Failed to get location.");
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
        );
    }

    function setField(key, val) {
        setForm((p) => ({ ...p, [key]: val }));
        setErrors((e) => ({ ...e, [key]: undefined }));
    }

    function resetForm() {
        setMode("create");
        setForm(emptyBranchForm());
        setAddressQuery("");
        setSuggestions([]);
        setErrors({});
        setStatus("");
    }

    function openCreate() {
        resetForm();
        setStatus("Ready to create a new branch.");
    }

    function openEdit(branch) {
        setMode("edit");
        setForm({
            branchId: branch.branchId ?? null,
            branchCode: branch.branchCode ?? "",
            branchName: branch.branchName ?? "",
            addressLine1: branch.addressLine1 ?? "",
            addressLine2: branch.addressLine2 ?? "",
            city: branch.city ?? "",
            district: branch.district ?? "",
            province: branch.province ?? "",
            latitude: branch.latitude ?? null,
            longitude: branch.longitude ?? null,
            radiusMeters: branch.radiusMeters ?? 200,
            contactNumber: branch.contactNumber ?? "",
            email: branch.email ?? "",
            active: branch.active ?? true,
        });

        setAddressQuery(
            [
                branch.addressLine1,
                branch.addressLine2,
                branch.city,
                branch.district,
                branch.province,
            ]
                .filter(Boolean)
                .join(", ")
        );

        setSuggestions([]);
        setErrors({});
        setStatus(`Editing ${branch.branchName || branch.branchCode || "branch"}`);
    }

    async function saveBranch() {
        const v = validateBranch(form);
        setErrors(v);

        if (Object.keys(v).length) {
            setStatus("❌ Please fix the highlighted fields.");
            return;
        }

        const payload = {
            branchId: form.branchId,
            branchCode: form.branchCode.trim(),
            branchName: form.branchName.trim(),
            addressLine1: form.addressLine1.trim(),
            addressLine2: form.addressLine2.trim() || null,
            city: form.city.trim(),
            district: form.district.trim(),
            province: form.province.trim(),
            latitude: Number(form.latitude),
            longitude: Number(form.longitude),
            radiusMeters: Number(form.radiusMeters),
            contactNumber: form.contactNumber.trim() || null,
            email: form.email.trim() || null,
            active: !!form.active,
        };

        try {
            setSaving(true);
            setStatus(mode === "edit" ? "Updating branch..." : "Saving branch...");

            let res;
            if (mode === "edit" && form.branchId != null) {
                res = await api.put(`${BRANCH_BASE}/${form.branchId}`, payload, {
                    headers: { "Content-Type": "application/json" },
                });
            } else {
                res = await api.post(BRANCH_BASE, payload, {
                    headers: { "Content-Type": "application/json" },
                });
            }

            const msg = apiMessage(res.data) || (mode === "edit" ? "✅ Branch updated!" : "✅ Branch saved!");
            setStatus(msg);

            await loadBranches();

            if (mode === "create") {
                resetForm();
            }
        } catch (e) {
            setStatus(getErrorMessage(e, mode === "edit" ? "Update failed" : "Save failed"));
        } finally {
            setSaving(false);
        }
    }

    async function deleteBranch(branch) {
        const id = branch.branchId;
        if (!id) return;

        const ok = window.confirm(
            `Delete branch ${branch.branchCode || ""} ${branch.branchName || ""}?`.trim()
        );
        if (!ok) return;

        try {
            setStatus("Deleting branch...");
            await api.delete(`${BRANCH_BASE}/${id}`);
            setStatus("✅ Branch deleted");

            if (form.branchId === id) {
                resetForm();
            }

            await loadBranches();
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
                            Branches
                        </h1>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                        Add, edit, and manage branches with exact map location and attendance radius.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
                    >
                        <Plus className="h-4 w-4" />
                        New Branch
                    </button>

                    <button
                        type="button"
                        onClick={loadBranches}
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]"
                    >
                        <RefreshCw className={`h-4 w-4 ${loadingList ? "animate-spin" : ""}`} />
                        Refresh
                    </button>
                </div>
            </header>

            {status && (
                <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300 backdrop-blur-xl">
                    {status}
                </div>
            )}

            <div className="mt-10 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                {/* Left: form and map logic preserved */}
                <div className="space-y-6">
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 backdrop-blur-2xl shadow-xl">
                        <div className="mb-6 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                                    {mode === "edit" ? "Edit Branch" : "Branch Information"}
                                </h2>
                                <div className="mt-1 text-sm font-semibold text-white">
                                    {mode === "edit" ? "Update selected branch" : "Create a new branch"}
                                </div>
                            </div>

                            {mode === "edit" && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]"
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>

                        <div className="grid gap-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field
                                    label="Branch Code"
                                    placeholder="e.g., COL-01"
                                    value={form.branchCode}
                                    onChange={(v) => setField("branchCode", v)}
                                    error={errors.branchCode}
                                />
                                <Field
                                    label="Branch Name"
                                    placeholder="e.g., Colombo HQ"
                                    value={form.branchName}
                                    onChange={(v) => setField("branchName", v)}
                                    error={errors.branchName}
                                />
                            </div>

                            <div className="relative">
                                <Field
                                    label="Search Address"
                                    placeholder="Type address (IJSE Panadura...)"
                                    value={addressQuery}
                                    onChange={(v) => setAddressQuery(v)}
                                />
                                {suggestions.length > 0 && (
                                    <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0f172a] shadow-2xl backdrop-blur-2xl">
                                        {suggestions.map((s) => (
                                            <button
                                                key={`${s.place_id}-${s.osm_id}`}
                                                type="button"
                                                onClick={() => selectSuggestion(s)}
                                                className="w-full border-b border-white/5 px-4 py-3 text-left text-sm text-slate-300 transition hover:bg-white/[0.04] last:border-b-0"
                                            >
                                                {s.display_name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field
                                    label="Address Line 1"
                                    placeholder="Road / building"
                                    value={form.addressLine1}
                                    onChange={(v) => setField("addressLine1", v)}
                                    error={errors.addressLine1}
                                />
                                <Field
                                    label="Address Line 2"
                                    placeholder="Optional"
                                    value={form.addressLine2}
                                    onChange={(v) => setField("addressLine2", v)}
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <Field label="City" value={form.city} onChange={(v) => setField("city", v)} error={errors.city} />
                                <Field label="District" value={form.district} onChange={(v) => setField("district", v)} error={errors.district} />
                                <Field label="Province" value={form.province} onChange={(v) => setField("province", v)} error={errors.province} />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field
                                    label="Allowed Radius (meters)"
                                    placeholder="e.g., 200"
                                    value={form.radiusMeters}
                                    onChange={(v) => setField("radiusMeters", v)}
                                    error={errors.radiusMeters}
                                />
                                <Field
                                    label="Contact Number"
                                    value={form.contactNumber}
                                    onChange={(v) => setField("contactNumber", v)}
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field
                                    label="Email"
                                    value={form.email}
                                    onChange={(v) => setField("email", v)}
                                    error={errors.email}
                                />
                                <div />
                            </div>

                            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={!!form.active}
                                    onChange={(e) => setField("active", e.target.checked)}
                                    className="h-4 w-4 rounded border-white/20 bg-slate-900"
                                />
                                Active Branch
                            </label>

                            <div className="flex flex-wrap items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={useMyLocation}
                                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]"
                                >
                                    📍 Use My Location
                                </button>

                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={saveBranch}
                                    className="rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
                                >
                                    {saving ? (mode === "edit" ? "Updating..." : "Saving...") : mode === "edit" ? "Update Branch" : "Save Branch"}
                                </button>

                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]"
                                >
                                    Reset
                                </button>
                            </div>

                            {(errors.latitude || errors.longitude) && (
                                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm text-rose-400">
                                    ❌ {errors.latitude || errors.longitude}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-2xl shadow-xl">
                        <div className="mb-3 flex items-center justify-between px-1">
                            <div>
                                <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                                    Map Location
                                </div>
                                <div className="mt-1 text-sm font-semibold text-white">
                                    Pick Branch Coordinates
                                </div>
                            </div>
                            <div className="text-xs text-slate-500">Click map to adjust marker</div>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-white/10">
                            <MapContainer center={mapCenter} zoom={13} style={{ height: 420, width: "100%" }}>
                                <TileLayer attribution="© OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <PanTo lat={form.latitude} lng={form.longitude} />
                                <ClickToPick onPick={onPick} />

                                {form.latitude != null && form.longitude != null && (
                                    <>
                                        <Marker position={[form.latitude, form.longitude]} icon={markerIcon} />
                                        <Circle center={[form.latitude, form.longitude]} radius={Number(form.radiusMeters) || 0} />
                                    </>
                                )}
                            </MapContainer>
                        </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-2xl shadow-xl">
                        <div className="mb-4">
                            <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                                Geo Summary
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <MiniField label="Latitude" value={form.latitude ?? ""} />
                            <MiniField label="Longitude" value={form.longitude ?? ""} />
                        </div>

                        <div className="mt-3">
                            <MiniField label="Radius (m)" value={form.radiusMeters ?? ""} />
                        </div>
                    </div>
                </div>

                {/* Right: branch list */}
                <div className="space-y-6">
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-2xl shadow-xl">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                                    Branch List
                                </div>
                                <div className="mt-1 text-sm font-semibold text-white">
                                    Manage existing branches
                                </div>
                            </div>
                            <div className="text-xs text-slate-500">{filteredBranches.length} total</div>
                        </div>

                        <div className="mb-4">
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Search by code, name, city, district..."
                                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500/30 focus:bg-white/[0.06]"
                            />
                        </div>

                        <div className="max-h-[820px] space-y-3 overflow-y-auto pr-1">
                            {filteredBranches.map((branch) => (
                                <div
                                    key={branch.branchId}
                                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="text-sm font-semibold text-white">
                                                {branch.branchName || "Unnamed Branch"}
                                            </div>
                                            <div className="mt-1 font-mono text-xs text-slate-500">
                                                {branch.branchCode || "—"}
                                            </div>
                                        </div>

                                        <span
                                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                                                branch.active
                                                    ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20"
                                                    : "bg-slate-500/10 text-slate-300 ring-slate-500/20"
                                            }`}
                                        >
                                            {branch.active ? "Active" : "Inactive"}
                                        </span>
                                    </div>

                                    <div className="mt-3 grid gap-1 text-sm text-slate-300">
                                        <div>
                                            <span className="text-slate-500">City:</span> {branch.city || "—"}
                                        </div>
                                        <div>
                                            <span className="text-slate-500">District:</span> {branch.district || "—"}
                                        </div>
                                        <div>
                                            <span className="text-slate-500">Province:</span> {branch.province || "—"}
                                        </div>
                                        <div>
                                            <span className="text-slate-500">Radius:</span> {branch.radiusMeters ?? "—"}m
                                        </div>
                                    </div>

                                    <div className="mt-4 flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => openEdit(branch)}
                                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                                        >
                                            <Pencil className="h-4 w-4" />
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => deleteBranch(branch)}
                                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {!loadingList && filteredBranches.length === 0 && (
                                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-slate-500">
                                    No branches found.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Field({ label, value, onChange, placeholder, error }) {
    return (
        <div>
            <div className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                {label}
            </div>
            <input
                value={value ?? ""}
                onChange={(e) => onChange?.(e.target.value)}
                placeholder={placeholder}
                className={
                    "w-full rounded-2xl border bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 " +
                    (error
                        ? "border-rose-500/30 ring-2 ring-rose-500/10"
                        : "border-white/10 focus:border-indigo-500/30 focus:bg-white/[0.06]")
                }
            />
            {error && <div className="mt-2 text-xs text-rose-400">{error}</div>}
        </div>
    );
}

function MiniField({ label, value }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</div>
            <div className="mt-1 truncate font-mono text-sm text-slate-200">{String(value)}</div>
        </div>
    );
}