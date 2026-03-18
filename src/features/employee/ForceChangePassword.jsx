import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Info, KeyRound } from "lucide-react";
import AuthShell from "./../../pages/auth_pages/AuthShell.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import { authStore } from "../auth/store.js";
import { api } from "../../lib/api.js";

export default function ForceChangePassword() {
    const nav = useNavigate();
    const toast = useToast((s) => s.push);
    const user = authStore((s) => s.user);
    const clearSession = authStore((s) => s.clearSession);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        if (!user?.passwordMustChange) {
            nav("/login", { replace: true });
        }
    }, [user, nav]);

    async function onSubmit(e) {
        e.preventDefault();
        setErr("");
        setSuccess("");

        if (!currentPassword || !newPassword || !confirmPassword) {
            setErr("All fields are required.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setErr("New password and confirm password do not match.");
            return;
        }

        if (newPassword.length < 8) {
            setErr("New password must be at least 8 characters.");
            return;
        }

        setLoading(true);

        try {
            await api.post("/v1/emp/change-password", {
                currentPassword,
                newPassword,
            });

            setSuccess("Password changed successfully. Please sign in again.");

            toast({
                title: "Password changed",
                message: "Please log in again with your new password.",
            });

            clearSession();

            setTimeout(() => {
                nav("/login", { replace: true });
            }, 1200);
        } catch (e2) {
            setErr(e2?.response?.data?.message || e2.message || "Password change failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthShell
            title="Change your temporary password"
            subtitle="For security, you must set a new password before using InShift."
        >
            <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="relative group"
            >
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500 to-cyan-500 opacity-10 blur transition duration-1000 group-hover:opacity-20" />

                <div className="relative rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
                    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4 text-sm text-indigo-200">
                        <KeyRound className="h-4 w-4 shrink-0" />
                        This account is using a temporary password. Set your new password to continue.
                    </div>

                    <form className="space-y-6" onSubmit={onSubmit}>
                        <div className="space-y-4">
                            <Input
                                label="Current / Temporary Password"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="border-white/10 bg-white/5 text-white focus:ring-indigo-500"
                            />

                            <Input
                                label="New Password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="border-white/10 bg-white/5 text-white focus:ring-indigo-500"
                            />

                            <Input
                                label="Confirm New Password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="border-white/10 bg-white/5 text-white focus:ring-indigo-500"
                            />
                        </div>

                        {err && (
                            <motion.div
                                initial={{ scale: 0.96, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200"
                            >
                                <Info className="h-4 w-4 shrink-0" />
                                {err}
                            </motion.div>
                        )}

                        {success && (
                            <motion.div
                                initial={{ scale: 0.96, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200"
                            >
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                                {success}
                            </motion.div>
                        )}

                        <Button
                            type="submit"
                            size="lg"
                            className="w-full rounded-2xl bg-indigo-600 py-6 text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500 active:scale-[0.98]"
                            disabled={loading}
                        >
                            {loading ? "Updating password..." : "Update Password"}
                        </Button>
                    </form>
                </div>
            </motion.div>
        </AuthShell>
    );
}