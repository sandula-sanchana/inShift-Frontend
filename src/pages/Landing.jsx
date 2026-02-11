import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Fingerprint,
  Bell,
  MapPin,
  CalendarDays,
  Clock3,
  Sparkles,
  ChevronRight,
  Smartphone,
  BarChart3,
  BadgeCheck,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { LogoMark } from "../components/common/Logo";

// --- Components ---

const fadeInUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0 },
};

function Reveal({ children, delay = 0 }) {
  return (
      <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: "easeOut", delay }}
      >
        {children}
      </motion.div>
  );
}

function Shell({ children }) {
  return <div className="mx-auto max-w-7xl px-6">{children}</div>;
}

function Section({ id, className = "", children }) {
  return (
      <section id={id} className={`relative py-20 sm:py-24 ${className}`}>
        <Shell>{children}</Shell>
      </section>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
      <div className="group rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-7
                    transition duration-300 hover:-translate-y-1 hover:bg-white/10
                    hover:shadow-[0_20px_80px_rgba(99,102,241,0.18)]">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/10
                        transition group-hover:scale-105 group-hover:bg-white/15">
            {icon}
          </div>
          <div>
            <div className="text-lg font-semibold text-white">{title}</div>
            <div className="mt-1 text-sm text-slate-300 leading-relaxed">{desc}</div>
          </div>
        </div>
      </div>
  );
}

function Pill({ children }) {
  return (
      <span className="rounded-full bg-white/8 ring-1 ring-white/10 px-3 py-1 text-xs text-slate-200">
      {children}
    </span>
  );
}

function FAQItem({ q, a }) {
  return (
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
        <div className="text-base font-semibold">{q}</div>
        <div className="mt-2 text-sm text-slate-300 leading-relaxed">{a}</div>
      </div>
  );
}

function DashboardMock() {
  return (
      <div className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 overflow-hidden">
        <div className="absolute inset-0 opacity-70 bg-[radial-gradient(600px_300px_at_10%_10%,rgba(99,102,241,0.22),transparent_60%),radial-gradient(420px_260px_at_90%_25%,rgba(34,211,238,0.18),transparent_60%)]" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <BarChart3 className="h-4 w-4 text-indigo-200" />
              Admin Dashboard
            </div>
            <div className="text-xs text-slate-300">Today</div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { k: "On-time", v: "86", c: "text-emerald-200" },
              { k: "Late", v: "7", c: "text-amber-200" },
              { k: "Missing", v: "3", c: "text-rose-200" },
            ].map((x) => (
                <div key={x.k} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs text-slate-300">{x.k}</div>
                  <div className={`mt-2 text-2xl font-bold ${x.c}`}>{x.v}</div>
                  <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                        className="h-2 rounded-full bg-gradient-to-r from-indigo-400/70 via-cyan-300/60 to-purple-400/60"
                        style={{ width: x.k === "On-time" ? "78%" : x.k === "Late" ? "26%" : "18%" }}
                    />
                  </div>
                </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-300">Verification timeline</div>
              <div className="text-[11px] text-slate-400">last 60 min</div>
            </div>
            <div className="mt-3 h-24 rounded-xl bg-[linear-gradient(90deg,rgba(99,102,241,.35),rgba(34,211,238,.22),rgba(168,85,247,.22))] opacity-80" />
            <div className="mt-3 text-xs text-slate-300">
              Push → Verify → Location → Saved (audit trail enabled)
            </div>
          </div>
        </div>
      </div>
  );
}

function PhoneMock() {
  return (
      <div className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 overflow-hidden">
        <div className="absolute inset-0 opacity-70 bg-[radial-gradient(600px_320px_at_70%_20%,rgba(168,85,247,0.22),transparent_62%),radial-gradient(440px_260px_at_20%_70%,rgba(34,211,238,0.16),transparent_65%)]" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Smartphone className="h-4 w-4 text-indigo-200" />
              Worker Mobile Verify
            </div>
            <div className="text-xs text-slate-300">FCM → Web</div>
          </div>

          <div className="mt-5 flex items-center justify-center">
            <div className="w-[290px] rounded-[40px] border border-white/15 bg-black/30 p-4 shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
              <div className="h-6 w-28 mx-auto rounded-full bg-white/10" />
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs text-slate-300">Attendance Check</div>
                    <div className="mt-1 text-base font-semibold">Verify now</div>
                  </div>
                  <BadgeCheck className="h-5 w-5 text-emerald-200" />
                </div>

                <div className="mt-2 text-xs text-slate-300">
                  Tap Verify → OS fingerprint prompt → signed token.
                </div>

                <div className="mt-4">
                  <div className="w-full rounded-2xl bg-indigo-600/90 hover:bg-indigo-500 text-white py-3 text-sm font-semibold text-center">
                    Verify (Fingerprint)
                  </div>
                </div>
              </div>
              <div className="mt-4 h-10 w-44 mx-auto rounded-2xl bg-white/10" />
            </div>
          </div>
        </div>
      </div>
  );
}

// --- Main Page ---

export default function Landing() {
  const [cursor, setCursor] = React.useState({ x: -9999, y: -9999 });

  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    setCursor({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
      // FIX 1: Removed 'bg-slate-950' from here. It is handled in the fixed background layer now.
      <div
          className="relative min-h-screen overflow-hidden text-white selection:bg-indigo-500/30"
          onMouseMove={onMove}
          onMouseLeave={() => setCursor({ x: -9999, y: -9999 })}
      >
        {/* FIX 2: Background System
        Using 'fixed' to ensure it stays in place and explicit z-index layering.
      */}
        <div className="fixed inset-0 -z-50 pointer-events-none">

          {/* Layer 1: Solid Background Color */}
          <div className="absolute inset-0 bg-slate-950" />

          {/* Layer 2: Animated Blobs (Using Motion for reliability) */}
          <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
                opacity: [0.4, 0.6, 0.4] // Increased opacity
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full mix-blend-screen filter blur-[80px] opacity-40"
              style={{
                background: "radial-gradient(circle, rgba(99,102,241,0.5) 0%, rgba(99,102,241,0) 70%)"
              }}
          />

          <motion.div
              animate={{
                scale: [1, 1.2, 1],
                x: [0, 50, 0],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
              className="absolute top-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full mix-blend-screen filter blur-[80px] opacity-30"
              style={{
                background: "radial-gradient(circle, rgba(34,211,238,0.4) 0%, rgba(34,211,238,0) 70%)"
              }}
          />

          <motion.div
              animate={{
                scale: [1, 1.3, 1],
                y: [0, -30, 0],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2
              }}
              className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] rounded-full mix-blend-screen filter blur-[80px] opacity-30"
              style={{
                background: "radial-gradient(circle, rgba(168,85,247,0.4) 0%, rgba(168,85,247,0) 70%)"
              }}
          />

          {/* Layer 3: Grid Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        </div>

        {/* Mouse Follower (Spotlight) */}
        <motion.div
            className="pointer-events-none fixed -z-40 h-[600px] w-[600px] rounded-full"
            animate={{
              x: cursor.x - 300,
              y: cursor.y - 300
            }}
            transition={{ type: "spring", damping: 30, stiffness: 200, mass: 0.5 }}
            style={{
              background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 60%)",
            }}
        />

        {/* --- CONTENT START --- */}

        <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/55 backdrop-blur-xl">
          <Shell>
            <div className="flex items-center justify-between py-4">
              <Link to="/" className="flex items-center gap-3">
                <LogoMark />
                <div className="leading-tight">
                  {/* <div className="text-sm font-semibold text-white">InShift</div> */}
                </div>
              </Link>

              <nav className="hidden md:flex items-center gap-6 text-sm text-slate-200">
                <a className="hover:text-white transition-colors" href="#features">Features</a>
                <a className="hover:text-white transition-colors" href="#workflow">Workflow</a>
                <a className="hover:text-white transition-colors" href="#faq">FAQ</a>
              </nav>

              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-indigo-600 hover:bg-indigo-500 text-white">
                    Get started
                  </Button>
                </Link>
              </div>
            </div>
          </Shell>
        </header>

        <Section className="pt-16 sm:pt-20">
          <div className="text-center">
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/8 ring-1 ring-white/10 px-4 py-2 text-sm text-slate-100">
                <Sparkles className="h-4 w-4 text-indigo-200" />
                Modern verification • Shifts • OT • Notifications
              </div>
            </Reveal>

            <Reveal delay={0.06}>
              <h1 className="mt-6 text-5xl md:text-7xl font-bold tracking-tight leading-[1.02]">
                Attendance that feels{" "}
                <span className="bg-gradient-to-r from-indigo-300 via-cyan-300 to-purple-300 bg-clip-text text-transparent">
                effortless
              </span>{" "}
                — and is{" "}
                <span className="bg-gradient-to-r from-indigo-300 via-cyan-300 to-purple-300 bg-clip-text text-transparent">
                hard to fake
              </span>
                .
              </h1>
            </Reveal>

            <Reveal delay={0.12}>
              <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto">
                InShift unifies three attendance sources: entrance device logs,
                mobile biometric verification with location proof, and secure web
                check-ins — plus shifts & overtime self-service.
              </p>
            </Reveal>

            <Reveal delay={0.18}>
              <div className="mt-10 flex justify-center gap-4 flex-wrap">
                <Link to="/register">
                  <Button className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-6 text-lg rounded-2xl shadow-[0_20px_80px_rgba(99,102,241,0.25)]">
                    Start now <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#workflow">
                  <Button className="bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15 px-8 py-6 text-lg rounded-2xl">
                    See how it works <ChevronRight className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            </Reveal>

            <Reveal delay={0.24}>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                <Pill>FCM notifications</Pill>
                <Pill>Passkeys/WebAuthn</Pill>
                <Pill>Geo rules</Pill>
                <Pill>Audit trails</Pill>
                <Pill>Approvals</Pill>
              </div>
            </Reveal>

            <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
              <motion.div
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <DashboardMock />
              </motion.div>
              <motion.div
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.08 }}
              >
                <PhoneMock />
              </motion.div>
            </div>

            <motion.div
                className="mt-14 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_30px_120px_rgba(0,0,0,0.35)] overflow-hidden"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold">Live workflow</div>
                  <span className="text-xs text-slate-300">
                  Notification → Verify → Location → Saved
                </span>
                </div>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Bell className="h-4 w-4 text-indigo-200" />
                      Scheduled checks
                    </div>
                    <div className="mt-2 text-sm text-slate-300">
                      Admin defines time windows and sends FCM notifications.
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Fingerprint className="h-4 w-4 text-indigo-200" />
                      Biometric verify
                    </div>
                    <div className="mt-2 text-sm text-slate-300">
                      Passkeys/WebAuthn triggers OS prompt. No biometric storage.
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <MapPin className="h-4 w-4 text-indigo-200" />
                      Location proof
                    </div>
                    <div className="mt-2 text-sm text-slate-300">
                      Accuracy checks + geo rules + device trust reduce fraud.
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-purple-500" />
            </motion.div>
          </div>
        </Section>

        <Section id="features">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <Reveal>
              <div>
                <div className="text-sm font-semibold text-indigo-200">
                  Built for real companies
                </div>
                <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
                  Everything employees need — and admins can trust.
                </h2>
                <p className="mt-4 text-slate-300 max-w-xl">
                  Verification, schedules, overtime, approvals, audit trails and
                  notifications — designed as one platform.
                </p>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Reveal delay={0.04}>
                <FeatureCard
                    icon={<ShieldCheck className="h-5 w-5 text-indigo-200" />}
                    title="Secure verification"
                    desc="Passkeys/WebAuthn for biometric prompts. Private key stays on device."
                />
              </Reveal>
              <Reveal delay={0.08}>
                <FeatureCard
                    icon={<Bell className="h-5 w-5 text-indigo-200" />}
                    title="Smart notifications"
                    desc="Admin-configured time windows. Push-first UX for attendance checks."
                />
              </Reveal>
              <Reveal delay={0.12}>
                <FeatureCard
                    icon={<MapPin className="h-5 w-5 text-indigo-200" />}
                    title="Geo rules"
                    desc="Radius + accuracy thresholds. Policy controlled manual check-ins."
                />
              </Reveal>
              <Reveal delay={0.16}>
                <FeatureCard
                    icon={<CalendarDays className="h-5 w-5 text-indigo-200" />}
                    title="Shifts self-service"
                    desc="Calendar/list, reschedule, swap (audit trail), open shifts, availability."
                />
              </Reveal>
              <Reveal delay={0.20}>
                <FeatureCard
                    icon={<Clock3 className="h-5 w-5 text-indigo-200" />}
                    title="Overtime tracking"
                    desc="Timer + manual entry, evidence, approvals, status & history filters."
                />
              </Reveal>
              <Reveal delay={0.24}>
                <FeatureCard
                    icon={<Fingerprint className="h-5 w-5 text-indigo-200" />}
                    title="Unified attendance"
                    desc="Entrance device, mobile biometric, and web check-in — one timeline."
                />
              </Reveal>
            </div>
          </div>
        </Section>

        <Section id="workflow" className="border-t border-white/10">
          <Reveal>
            <div className="text-center">
              <div className="text-sm font-semibold text-indigo-200">
                How it works
              </div>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
                A verification flow users actually like.
              </h2>
              <p className="mt-4 text-slate-300 max-w-2xl mx-auto">
                Notification → open page → tap Verify → fingerprint prompt → send
                device + location → attendance saved.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Reveal delay={0.06}>
              <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8">
                <div className="text-xs text-slate-300">Step 01</div>
                <div className="mt-2 text-lg font-semibold">
                  Admin schedules checks
                </div>
                <div className="mt-2 text-sm text-slate-300">
                  Define time windows (morning/period) and rules.
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.12}>
              <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8">
                <div className="text-xs text-slate-300">Step 02</div>
                <div className="mt-2 text-lg font-semibold">
                  Worker verifies instantly
                </div>
                <div className="mt-2 text-sm text-slate-300">
                  Tap Verify → OS biometric prompt → verified token created.
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.18}>
              <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8">
                <div className="text-xs text-slate-300">Step 03</div>
                <div className="mt-2 text-lg font-semibold">
                  Backend validates & logs
                </div>
                <div className="mt-2 text-sm text-slate-300">
                  Validate token + device + location → save timeline + audit trail.
                </div>
              </div>
            </Reveal>
          </div>
        </Section>

        <Section id="faq" className="border-t border-white/10">
          <Reveal>
            <div className="text-center">
              <div className="text-sm font-semibold text-indigo-200">FAQ</div>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
                Common questions
              </h2>
            </div>
          </Reveal>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Reveal delay={0.06}>
              <FAQItem
                  q="Do you store fingerprints?"
                  a="No. WebAuthn/Passkeys uses device secure hardware. Only signed challenges and public keys are used."
              />
            </Reveal>
            <Reveal delay={0.10}>
              <FAQItem
                  q="Can it work on mobile web?"
                  a="Yes. Recommended: notification → open page → tap Verify → OS biometric prompt."
              />
            </Reveal>
            <Reveal delay={0.14}>
              <FAQItem
                  q="What if biometric isn’t available?"
                  a="Use manual web check-in with location + policy rules + audit trails."
              />
            </Reveal>
            <Reveal delay={0.18}>
              <FAQItem
                  q="How do shifts and OT fit in?"
                  a="Employees manage shifts (swap/reschedule/open shifts) and OT (timer/requests/approvals/history/analytics)."
              />
            </Reveal>
          </div>
        </Section>

        <Section className="border-t border-white/10">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-indigo-600/20 via-cyan-500/10 to-purple-600/20 backdrop-blur-xl p-10 sm:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <Reveal>
                <div>
                  <div className="text-sm font-semibold text-indigo-200">
                    Ready to build your demo?
                  </div>
                  <h3 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">
                    Launch InShift with a premium UI today.
                  </h3>
                  <p className="mt-4 text-slate-300 max-w-xl">
                    Your frontend is marketing-grade. Connect backend later and it
                    plugs in cleanly.
                  </p>
                </div>
              </Reveal>

              <Reveal delay={0.08}>
                <div className="flex flex-wrap gap-3 lg:justify-end">
                  <Link to="/register">
                    <Button className="bg-indigo-600 hover:bg-indigo-500 text-white px-7 py-5 text-lg rounded-2xl">
                      Create account <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button
                        variant="secondary"
                        className="px-7 py-5 text-lg rounded-2xl"
                    >
                      Go to dashboard
                    </Button>
                  </Link>
                </div>
              </Reveal>
            </div>
          </div>
        </Section>

        <footer className="border-t border-white/10 py-10">
          <Shell>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-sm text-slate-300">
              <div className="flex items-center gap-3">
                <LogoMark />
                <div>
                  <div className="font-semibold text-white">InShift</div>
                  <div className="text-xs text-slate-400">
                    Smart attendance • Shifts • OT
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <Link className="hover:text-white" to="/privacy">
                  Privacy
                </Link>
                <Link className="hover:text-white" to="/terms">
                  Terms
                </Link>
              </div>
              <div className="text-xs text-slate-400">
                © {new Date().getFullYear()} InShift
              </div>
            </div>
          </Shell>
        </footer>
      </div>
  );
}