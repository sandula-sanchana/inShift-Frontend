import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "./AuthShell.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { authStore } from "../../features/auth/store.js";
import { demoUser } from "../../features/auth/demo.js";
import { useToast } from "../../components/ui/Toast.jsx";
import { api } from "../../lib/api.js";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight, Info } from "lucide-react";

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
          title="Welcome back"
          subtitle="Sign in to your account to manage your shifts and attendance."
      >
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative group"
        >
          {/* Decorative background glow behind the form */}
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>

          <div className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
            <form className="space-y-6" onSubmit={onSubmit}>

              <div className="space-y-4">
                <Input
                    label="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/5 border-white/10 text-white focus:ring-indigo-500"
                />

                <Input
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/5 border-white/10 text-white focus:ring-indigo-500"
                />

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="h-3 w-3 text-indigo-400" />
                    Select Demo Role
                  </label>
                  <div className="relative">
                    <select
                        className="w-full appearance-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="EMPLOYEE" className="bg-slate-900 text-white">Employee Dashboard</option>
                      <option value="ADMIN" className="bg-slate-900 text-white">Administrator Portal</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {err && (
                  <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200 flex items-center gap-3"
                  >
                    <Info className="h-4 w-4 shrink-0" />
                    {err}
                  </motion.div>
              )}

              <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl py-6 shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
                  disabled={loading}
              >
                {loading ? (
                    <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
                ) : (
                    <span className="flex items-center gap-2">
                  Sign in <ArrowRight className="h-4 w-4" />
                </span>
                )}
              </Button>

              <div className="pt-4 text-center">
                <div className="text-sm text-slate-400">
                  Don't have an account yet?{" "}
                  <Link className="font-semibold text-white hover:text-indigo-300 hover:underline transition-colors" to="/register">
                    Create one now
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </motion.div>
      </AuthShell>
  );
}