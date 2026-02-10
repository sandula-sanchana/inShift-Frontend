import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LogoMark } from "../components/common/Logo";

export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Link to="/" className="inline-flex items-center gap-3">
          <LogoMark />
          <div>
            <div className="text-sm font-semibold text-slate-900">InShift</div>
            <div className="text-xs text-slate-600">Smart Attendance</div>
          </div>
        </Link>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl bg-white shadow-soft ring-1 ring-slate-200 p-6"
          >
            <div className="text-2xl font-semibold text-slate-900">{title}</div>
            {subtitle ? <div className="mt-2 text-sm text-slate-600">{subtitle}</div> : null}
            <div className="mt-6">{children}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.06 }}
            className="rounded-2xl bg-slate-900 text-white shadow-soft p-6 overflow-hidden relative"
          >
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              <div className="text-sm font-semibold text-white/90">Why InShift</div>
              <div className="mt-3 text-2xl font-semibold leading-snug">
                Secure attendance checks with notifications, passkeys, and location proof.
              </div>
              <ul className="mt-5 space-y-2 text-sm text-white/80 list-disc ml-5">
                <li>3 verification sources in one unified timeline</li>
                <li>Employee self-service for shifts & overtime</li>
                <li>Audit trails, fraud controls, and approvals</li>
              </ul>
              <div className="mt-6 text-xs text-white/70">
                Tip: You can login as Admin or Employee to see different dashboards.
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}