import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthShell from "./AuthShell.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { authStore } from "../../features/auth/store.js";
import { useToast } from "../../components/ui/Toast.jsx";
import { api } from "../../lib/api.js";
import { motion } from "framer-motion";
import { ArrowRight, Info } from "lucide-react";
// import { registerNotificationsForCurrentDevice } from "../../lib/registerNotifications"; // add later after FCM backend is ready

export default function Login() {
  const nav = useNavigate();
  const setSession = authStore((s) => s.setSession);
  const toast = useToast((s) => s.push);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const res = await api.post("/v1/auth/login", { email, password });

      const data = res?.data?.data;
      const accessToken = data?.accessToken ?? data?.access_token;
      const role = data?.role;
      const passwordMustChange = !!data?.passwordMustChange;

      if (!accessToken) throw new Error("Access token missing in response");

      setSession(accessToken, {
        email,
        role,
        passwordMustChange,
      });

      if (passwordMustChange) {
        toast({
          title: "Password change required",
          message: "Please change your temporary password before continuing.",
        });
        nav("/force-change-password");
        return;
      }

      // ✅ Enable later after FCM backend/token registration is ready
      // await registerNotificationsForCurrentDevice();

      toast({
        title: "Welcome",
        message: role ? `Signed in as ${role}.` : "Signed in successfully.",
      });

      nav(role === "ADMIN" ? "/admin" : "/emp");
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
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500 to-cyan-500 opacity-10 blur transition duration-1000 group-hover:opacity-20" />

          <div className="relative rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
            <form className="space-y-6" onSubmit={onSubmit}>
              <div className="space-y-4">
                <Input
                    label="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-white/10 bg-white/5 text-white focus:ring-indigo-500"
                />

                <Input
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-white/10 bg-white/5 text-white focus:ring-indigo-500"
                />
              </div>

              {err && (
                  <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200"
                  >
                    <Info className="h-4 w-4 shrink-0" />
                    {err}
                  </motion.div>
              )}

              <Button
                  type="submit"
                  size="lg"
                  className="w-full rounded-2xl bg-indigo-600 py-6 text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500 active:scale-[0.98]"
                  disabled={loading}
              >
                {loading ? (
                    <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24">
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
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
                  Don&apos;t have an account?{" "}
                  <span className="font-semibold text-white">Contact your Admin/HR</span>.
                </div>
              </div>
            </form>
          </div>
        </motion.div>
      </AuthShell>
  );
}