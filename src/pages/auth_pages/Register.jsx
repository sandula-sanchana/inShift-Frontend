import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "./AuthShell";
import { Input } from "../../components/ui/Input.jsx";
import { Button } from "../../components/ui/Button";
import { authStore } from "../../features/auth/store";
import { demoUser } from "../../features/auth/demo";
import { useToast } from "../../components/ui/Toast";
import { motion, useAnimation } from "framer-motion";
import { UserPlus, ArrowRight, ShieldCheck, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";

export default function Register() {
    const nav = useNavigate();
    const controls = useAnimation(); // Control the shake animation
    const setSession = authStore((s) => s.setSession);
    const toast = useToast((s) => s.push);

    const [name, setName] = useState("Employee User");
    const [email, setEmail] = useState("employee@inshift.local");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState("EMPLOYEE");
    const [loading, setLoading] = useState(false);
    const [strength, setStrength] = useState(0);

    const handlePasswordChange = (val) => {
        setPassword(val);
        let score = 0;
        if (val.length > 6) score++;
        if (val.length > 10) score++;
        if (/[A-Z]/.test(val)) score++;
        if (/[0-9]/.test(val)) score++;
        if (/[^A-Za-z0-9]/.test(val)) score++;
        setStrength(score);
    };

    const getStrengthColor = () => {
        if (strength <= 2) return "bg-rose-500";
        if (strength <= 3) return "bg-amber-500";
        return "bg-emerald-500";
    };

    async function onSubmit(e) {
        e.preventDefault();

        // Validation Logic
        const isMatch = password === confirmPassword && password !== "";
        const isStrongEnough = strength >= 3;

        if (!isMatch || !isStrongEnough) {
            // Trigger the Shake Animation
            controls.start({
                x: [-10, 10, -10, 10, 0],
                transition: { duration: 0.4 }
            });
            toast({
                title: "Validation Error",
                message: !isStrongEnough ? "Password is too weak." : "Passwords do not match.",
                variant: "error"
            });
            return;
        }

        setLoading(true);
        try {
            const user = { ...demoUser(role), name, email };
            setSession("demo-token", user);
            toast({ title: "Account created", message: "Welcome to InShift!" });
            nav("/app");
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthShell title="Get Started" subtitle="Create your secure employee profile.">
            <motion.form
                animate={controls}
                className="space-y-5"
                onSubmit={onSubmit}
            >
                <div className="space-y-4">
                    <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} className="bg-black/20 border-white/10 text-white rounded-2xl" />
                    <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-black/20 border-white/10 text-white rounded-2xl" />

                    {/* Password + Strength Meter */}
                    <div className="space-y-3">
                        <Input
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => handlePasswordChange(e.target.value)}
                            className="bg-black/20 border-white/10 text-white rounded-2xl"
                        />
                        <div className="px-1 space-y-2">
                            <div className="flex gap-1 h-1">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <div key={s} className={`h-full flex-1 rounded-full transition-all duration-500 ${s <= strength ? getStrengthColor() : "bg-white/10"}`} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Re-enter Password Field */}
                    <div className="space-y-2">
                        <div className="relative">
                            <Input
                                label="Confirm Password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="bg-black/20 border-white/10 text-white rounded-2xl"
                            />
                            {confirmPassword && (
                                <div className="absolute right-4 top-[38px]">
                                    {password === confirmPassword ? (
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500 animate-in zoom-in" />
                                    ) : (
                                        <AlertCircle className="h-5 w-5 text-rose-500 animate-in zoom-in" />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Role Selector */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Account Type</label>
                        <select
                            className="w-full h-12 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white appearance-none cursor-pointer"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option value="EMPLOYEE" className="bg-slate-950">Employee</option>
                            <option value="ADMIN" className="bg-slate-950">Administrator</option>
                        </select>
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl h-14 font-semibold shadow-lg shadow-indigo-900/20 active:scale-[0.98] transition-all"
                    disabled={loading}
                >
                    {loading ? "Processing..." : "Create account"}
                </Button>

                <div className="text-center pt-2">
                    <p className="text-sm text-slate-500">
                        Already have an account? <Link className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors" to="/login">Sign in</Link>
                    </p>
                </div>
            </motion.form>
        </AuthShell>
    );
}