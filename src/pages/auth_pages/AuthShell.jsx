import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LogoMark } from "../../components/common/Logo.jsx";

export default function AuthShell({ title, subtitle, children }) {
  return (
      <div className="min-h-screen relative z-10 overflow-hidden bg-[#020617]">
        {/* 1. COOL BACKGROUND: Mesh Gradient Blobs */}
        <div className="absolute inset-0 -z-10">
          {/* Deep Indigo Glow */}
          <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px]" />
          {/* Subtle Cyan Glow */}
          <div className="absolute bottom-[10%] right-[-5%] h-[400px] w-[400px] rounded-full bg-cyan-500/5 blur-[100px]" />
          {/* Grid Texture Overlay */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none" />
        </div>

        <div className="mx-auto max-w-6xl px-4 py-10">
          {/* Header */}
          <Link to="/" className="inline-flex items-center gap-3 group">
            <LogoMark />
            <div>
              <div className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors tracking-tight">
                InShift
              </div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">Smart Attendance</div>
            </div>
          </Link>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

            {/* Left Side: The Glass Form Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="rounded-[40px] bg-slate-900/40 backdrop-blur-xl border border-white/[0.08] p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] relative overflow-hidden"
            >
              {/* Top edge highlight for glass effect */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              <div className="relative">
                <h1 className="text-3xl font-extrabold tracking-tight text-white">
                  {title}
                </h1>
                {subtitle && (
                    <p className="mt-3 text-slate-400 leading-relaxed text-sm">
                      {subtitle}
                    </p>
                )}
                <div className="mt-8">{children}</div>
              </div>
            </motion.div>

            {/* Right Side: Feature Card */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="hidden lg:block relative group"
            >
              <div className="rounded-[40px] bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.05] p-12 overflow-hidden relative">

                {/* Floating Animated Sphere */}
                <motion.div
                    animate={{
                      y: [0, -20, 0],
                      opacity: [0.1, 0.3, 0.1]
                    }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-indigo-600 blur-[80px]"
                />

                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-1.5 text-[10px] font-bold text-indigo-300 uppercase tracking-[0.2em] border border-indigo-500/20">
                    Platform Core
                  </div>

                  <h2 className="mt-8 text-3xl font-bold leading-[1.2] text-white">
                    Secure checks with <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">notifications</span> & passkeys.
                  </h2>

                  <ul className="mt-10 space-y-5">
                    {[
                      "Unified attendance timeline",
                      "Shifts & Overtime self-service",
                      "Geo-fenced fraud controls"
                    ].map((item, i) => (
                        <li key={i} className="flex items-center gap-4 text-slate-300 group">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/5 border border-white/10 group-hover:border-indigo-500/50 transition-colors">
                            <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                          </div>
                          <span className="text-sm font-medium">{item}</span>
                        </li>
                    ))}
                  </ul>

                  <div className="mt-12 flex items-start gap-4 rounded-3xl bg-black/40 p-5 border border-white/[0.03] backdrop-blur-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 shrink-0">
                      <span className="text-xs font-black">!</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Try logging in with <span className="text-white font-bold">Admin</span> for the manager view or <span className="text-white font-bold">Employee</span> for the user dashboard.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
  );
}