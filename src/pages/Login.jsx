import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "./AuthShell";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { authStore } from "../features/auth/store";
import { demoUser } from "../features/auth/demo";
import { useToast } from "../components/ui/Toast";
import { api } from "../lib/api";

export default function Login() {
  const nav = useNavigate();
  const setSession = authStore((s) => s.setSession);
  const toast = useToast((s) => s.push);
  const [email, setEmail] = useState("employee@inshift.local");
  const [password, setPassword] = useState("password");
  const [role, setRole] = useState("EMPLOYEE");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {

      const user = demoUser(role);
      const token = "demo-token";
      setSession(token, user);
      toast({ title: "Welcome", message: `Signed in as ${role}.` });
      nav("/app");
    } catch (e2) {
      setErr(e2?.response?.data?.message || e2.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Use your company account. For demo, choose Admin or Employee."
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

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

        {err ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{err}</div> : null}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>

        <div className="text-sm text-slate-600">
          No account?{" "}
          <Link className="font-semibold text-slate-900 hover:underline" to="/register">
            Create one
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}