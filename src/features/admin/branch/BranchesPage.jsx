import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";




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

// click on map -> auto fill adress line
async function reverseGeocode(lat, lng, signal) {
    const url =
        `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&zoom=18&lat=${lat}&lon=${lng}`;

    const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("Reverse geocode failed");
    return await res.json();
}


function useDebounced(value, ms = 450) {
    const [d, setD] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setD(value), ms);
        return () => clearTimeout(t);
    }, [value, ms]);
    return d;
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
    if (form.email?.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = "Invalid email";

    return errors;
}

export default function BranchesPage() {
    const [form, setForm] = useState({
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
        contactNumber: "",
        email: "",
        active: true,
    });

    // Address search (dropdown suggestions)
    const [addressQuery, setAddressQuery] = useState("");
    const debouncedQuery = useDebounced(addressQuery, 650);
    const [suggestions, setSuggestions] = useState([]);
    const [status, setStatus] = useState("");
    const abortRef = useRef(null);

    // Save state
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});


    const mapCenter = useMemo(
        () => [form.latitude ?? 6.9271, form.longitude ?? 79.8612],
        [form.latitude, form.longitude]
    );

    // ✅ Step: Type address → fetch suggestions
    useEffect(() => {
        const q = debouncedQuery.trim();
        if (q.length < 4) {
            setSuggestions([]);
            return;
        }

        if (abortRef.current) abortRef.current.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        (async () => {
            try {
                setStatus("Searching address...");
                const url =
                    `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&countrycodes=lk&q=${encodeURIComponent(q)}`;
                const res = await fetch(url, { signal: controller.signal, headers: { "Accept": "application/json" } });
                const data = await res.json();
                setSuggestions(Array.isArray(data) ? data : []);
                setStatus(Array.isArray(data) && data.length ? "" : "No matches. Try more details.");
            } catch (e) {
                if (e.name === "AbortError") return;
                setStatus("Search failed. Check internet.");
            }
        })();
    }, [debouncedQuery]);

    // ✅ Step: Click suggestion → fill address fields + set lat/lng
    function selectSuggestion(s) {
        const lat = Number(s.lat);
        const lng = Number(s.lon);

        const addr = s.address || {};
        setForm((prev) => ({
            ...prev,
            addressLine1: addr.road || addr.neighbourhood || prev.addressLine1,
            city: addr.city || addr.town || addr.village || prev.city,
            district: addr.county || prev.district,
            province: addr.state || prev.province,
            latitude: lat,
            longitude: lng,
        }));

        setAddressQuery(s.display_name || "");
        setSuggestions([]);
        setStatus("✅ Location selected. You can adjust by clicking the map.");
        setErrors((e) => ({ ...e, latitude: undefined, longitude: undefined }));
    }

    // ✅ Step: Click map → override coordinates
    const reverseAbortRef = useRef(null);

    async function onPick(lat, lng) {
        setStatus("📍 Location set. Finding address...");

        if (reverseAbortRef.current) reverseAbortRef.current.abort();
        const controller = new AbortController();
        reverseAbortRef.current = controller;

        try {
            const data = await reverseGeocode(lat, lng, controller.signal);
            const addr = data.address || {};
             console.log(data)
            setForm((prev) => ({
                ...prev,
                latitude: lat,
                longitude: lng,
                addressLine1:
                    addr.road ||
                    addr.neighbourhood ||
                    addr.suburb ||
                    prev.addressLine1,
                city: addr.city || addr.town || addr.village || prev.city,
                district: addr.county || prev.district,
                province: addr.state || prev.province,
            }));

            setStatus("✅ Address filled from selected point.");
        } catch (e) {
            if (e.name === "AbortError") return;

            // even if reverse fails, still set lat/lng
            setForm((prev) => ({
                ...prev,
                latitude: lat,
                longitude: lng,
            }));

            setStatus("⚠️ Couldn't fetch address. You can type it manually.");
        }
    }



    // ✅ Step: Use current location
    function useMyLocation() {
        if (!navigator.geolocation) {
            setStatus("Geolocation not supported.");
            return;
        }
        setStatus("Getting your location...");
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude, accuracy } = pos.coords;

                setForm((p) => ({ ...p, latitude, longitude }));
                setStatus(`✅ Location set (accuracy ~${Math.round(accuracy)}m). Click map to adjust if needed.`);
            },
            (err) => {
                setStatus(err.code === 1 ? "Location permission denied." : "Failed to get location.");
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
        );

    }

    // ✅ Save (POST)
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
            contactNumber: form.contactNumber.trim() || null,
            email: form.email.trim() || null,
            active: !!form.active,
        };

        try {
            setSaving(true);
            setStatus("Saving...");

            // ✅ If backend ready: set VITE_API_BASE_URL and use fetch:
            // Example endpoint (change to your real one):
            // POST {API_BASE}/api/v1/branches
            if (API_BASE) {
                const res = await fetch(`${API_BASE}/api/v1/branches`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
                if (!res.ok) throw new Error(`Save failed (${res.status})`);
            } else {
                // ✅ demo mode
                console.log("DEMO SAVE payload:", payload);
                await new Promise((r) => setTimeout(r, 400));
            }

            setStatus("✅ Branch saved!");
            // reset (optional)
            // setForm((p) => ({ ...p, branchCode:"", branchName:"", ... }));
        } catch (e) {
            setStatus(e.message || "Save failed");
        } finally {
            setSaving(false);
        }
    }

    function setField(key, val) {
        setForm((p) => ({ ...p, [key]: val }));
        // clear per-field error when typing
        setErrors((e) => ({ ...e, [key]: undefined }));
    }

    return (
        <div className="space-y-5">
            <div>
                <div className="text-lg font-bold text-slate-900">Branches</div>
                <div className="text-sm text-slate-600">Add a branch and pick its exact location on the map.</div>
            </div>

            {/* Form */}
            <div className="grid gap-4 lg:grid-cols-2">
                {/* Left: inputs */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
                    <div className="grid gap-3">
                        <div className="grid gap-3 sm:grid-cols-2">
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

                        {/* Address search */}
                        <div className="relative">
                            <Field
                                label="Search Address"
                                placeholder="Type address (IJSE Panadura, Grace Peiris Road...)"
                                value={addressQuery}
                                onChange={(v) => setAddressQuery(v)}
                            />
                            {suggestions.length > 0 && (
                                <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                                    {suggestions.map((s) => (
                                        <button
                                            key={`${s.place_id}-${s.osm_id}`}
                                            type="button"
                                            onClick={() => selectSuggestion(s)}
                                            className="w-full text-left px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                                        >
                                            {s.display_name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
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

                        <div className="grid gap-3 sm:grid-cols-3">
                            <Field label="City" value={form.city} onChange={(v) => setField("city", v)} error={errors.city} />
                            <Field
                                label="District"
                                value={form.district}
                                onChange={(v) => setField("district", v)}
                                error={errors.district}
                            />
                            <Field
                                label="Province"
                                value={form.province}
                                onChange={(v) => setField("province", v)}
                                error={errors.province}
                            />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <Field label="Contact Number" value={form.contactNumber} onChange={(v) => setField("contactNumber", v)} />
                            <Field label="Email" value={form.email} onChange={(v) => setField("email", v)} error={errors.email} />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="flex items-end gap-3">
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={!!form.active}
                                        onChange={(e) => setField("active", e.target.checked)}
                                        className="h-4 w-4"
                                    />
                                    Active
                                </label>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-2">
                            <button
                                type="button"
                                onClick={useMyLocation}
                                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                📍 Use My Location
                            </button>

                            <button
                                type="button"
                                disabled={saving}
                                onClick={saveBranch}
                                className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                            >
                                {saving ? "Saving..." : "Save Branch"}
                            </button>

                            {status && <div className="text-sm text-slate-600">{status}</div>}
                        </div>

                        {(errors.latitude || errors.longitude) && (
                            <div className="text-sm text-rose-600">❌ {errors.latitude || errors.longitude}</div>
                        )}
                    </div>
                </div>

                {/* Right: map */}
                <div className="rounded-3xl border border-slate-200 bg-white p-3">
                    <div className="mb-2 flex items-center justify-between px-1">
                        <div className="text-sm font-semibold text-slate-800">Pick Branch Location</div>
                        <div className="text-xs text-slate-500">Click map to adjust marker</div>
                    </div>

                    <div className="overflow-hidden rounded-2xl">
                        <MapContainer center={mapCenter} zoom={13} style={{ height: 420, width: "100%" }}>
                            <TileLayer
                                attribution="© OpenStreetMap contributors"
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <PanTo lat={form.latitude} lng={form.longitude} />
                            <ClickToPick onPick={onPick} />
                            {form.latitude != null && form.longitude != null && (
                                <Marker position={[form.latitude, form.longitude]} icon={markerIcon} />
                            )}
                        </MapContainer>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <MiniField label="Latitude" value={form.latitude ?? ""} />
                        <MiniField label="Longitude" value={form.longitude ?? ""} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function Field({ label, value, onChange, placeholder, error }) {
    return (
        <div>
            <div className="mb-1 text-xs font-semibold text-slate-600">{label}</div>
            <input
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                placeholder={placeholder}
                className={
                    "w-full rounded-2xl border bg-white px-3 py-2.5 text-sm outline-none " +
                    (error ? "border-rose-300 ring-2 ring-rose-100" : "border-slate-200 focus:ring-2 focus:ring-slate-200")
                }
            />
            {error && <div className="mt-1 text-xs text-rose-600">{error}</div>}
        </div>
    );
}

function MiniField({ label, value }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="text-[11px] font-semibold text-slate-600">{label}</div>
            <div className="text-sm font-mono text-slate-800 truncate">{String(value)}</div>
        </div>
    );
}
