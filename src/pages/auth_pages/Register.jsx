import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "./AuthShell";
import { Input } from "../../components/ui/Input.jsx";
import { Button } from "../../components/ui/Button";
import { authStore } from "../../features/auth/store";
import { demoUser } from "../../features/auth/demo";
import { useToast } from "../../components/ui/Toast";

export default function Register() {
    const nav = useNavigate();
    const setSession = authStore((s) => s.setSession);
    const toast = useToast((s) => s.push);
    const [name, setName] = useState("Employee User");
    const [email, setEmail] = useState("employee@inshift.local");
    const [password, setPassword] = useState("password");
    const [role, setRole] = useState("EMPLOYEE");
    const [loading, setLoading] = useState(false);

    async function onSubmit(e) {
        e.preventDefault();
        setLoading(true);
        try {
            //add backend register endpoint later
            const user = { ...demoUser(role), name, email };
            setSession("demo-token", user);
            toast({ title: "Account created", message: "You can now use the dashboard." });
            nav("/app");
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthShell title="Create your account" subtitle="Start with employee self‑service and secure verification.">
            <form className="space-y-4" onSubmit={onSubmit}>
                <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
                <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} hint="Use a strong password in production." />

                <label className="block">
                    <div className="text-xs font-medium text-slate-600">Role (demo)</div>
                    <select
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                    >
                        <option value="EMPLOYEE">Employee</option>
                        <option value="ADMIN">Admin</option>
                    </select>
                </label>

                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading ? "Creating..." : "Create account"}
                </Button>

                <div className="text-sm text-slate-600">
                    Already have an account?{" "}
                    <Link className="font-semibold text-slate-900 hover:underline" to="/login">
                        Sign in
                    </Link>
                </div>
            </form>
        </AuthShell>
    );
}