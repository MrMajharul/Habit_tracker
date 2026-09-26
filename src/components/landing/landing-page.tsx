"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  Moon,
  Star,
  BookOpen,
  Heart,
  Target,
  Timer,
  BarChart3,
  Bell,
  CheckCircle2,
  ArrowRight,
  Menu,
  X,
  Sparkles,
  Sun,
  Compass,
} from "lucide-react";

/* ─── tiny helpers ──────────────────────────────────────── */

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ─── data ──────────────────────────────────────────────── */

const features = [
  {
    icon: Moon,
    title: "Salah-Centered Day",
    desc: "Your schedule is built around the five prayers. Every block of time has its place — before Fajr, after Isha, and every moment in between.",
    color: "from-emerald-900/60 to-emerald-800/40",
    accent: "#2d9b6f",
  },
  {
    icon: BookOpen,
    title: "Qur'an & Hadith",
    desc: "Browse authenticated Hadiths, bookmark your favourites, and track your daily Qur'an reading with a simple, distraction-free reader.",
    color: "from-amber-900/60 to-amber-800/40",
    accent: "#c9943a",
  },
  {
    icon: Heart,
    title: "Dhikr Counter",
    desc: "Silently count your tasbeeh with a smooth tap counter. Preset remembrance sets for morning, evening, and after Salah.",
    color: "from-emerald-900/60 to-emerald-800/40",
    accent: "#2d9b6f",
  },
  {
    icon: Target,
    title: "Habit & Goal Tracking",
    desc: "Anchor your habits to prayer times. Build streaks that motivate without turning your deen into a competition.",
    color: "from-amber-900/60 to-amber-800/40",
    accent: "#c9943a",
  },
  {
    icon: Timer,
    title: "Deep Focus Sessions",
    desc: "Structured Pomodoro-style focus blocks that respect Salah times. The app will gently pause when a prayer is due.",
    color: "from-emerald-900/60 to-emerald-800/40",
    accent: "#2d9b6f",
  },
  {
    icon: BarChart3,
    title: "Productivity Analytics",
    desc: "Gentle weekly insights on your worship consistency, habit streaks, and focus time — without the anxiety of gamification.",
    color: "from-amber-900/60 to-amber-800/40",
    accent: "#c9943a",
  },
  {
    icon: Bell,
    title: "Smart Reminders",
    desc: "Location-aware prayer notifications, habit nudges anchored to your actual prayer times, and gentle Adhkar reminders.",
    color: "from-emerald-900/60 to-emerald-800/40",
    accent: "#2d9b6f",
  },
  {
    icon: Sparkles,
    title: "Daily Reflection",
    desc: "End each day with a short guided journal. What did you accomplish? What are you grateful for? What will tomorrow hold?",
    color: "from-amber-900/60 to-amber-800/40",
    accent: "#c9943a",
  },
];

const prayerTimes = [
  { name: "Fajr", arabic: "الفجر", time: "5:02", icon: Star, tagline: "Begin with remembrance" },
  { name: "Dhuhr", arabic: "الظهر", time: "12:30", icon: Sun, tagline: "Midday pause" },
  { name: "Asr", arabic: "العصر", time: "15:48", icon: Compass, tagline: "Afternoon anchor" },
  { name: "Maghrib", arabic: "المغرب", time: "18:21", icon: Moon, tagline: "Sunset gratitude" },
  { name: "Isha", arabic: "العشاء", time: "19:45", icon: Star, tagline: "Evening reflection" },
];

const testimonials = [
  {
    quote: "Finally an app that doesn't make me feel guilty. It celebrates consistency, not perfection.",
    name: "Sister Amira",
    role: "University student, Malaysia",
  },
  {
    quote: "The Salah anchor for habits changed everything for me. I stopped forgetting my Qur'an target.",
    name: "Brother Yusuf",
    role: "Software engineer, UK",
  },
  {
    quote: "Calm, beautiful, and it genuinely helps me build my day around salah rather than fitting salah into my day.",
    name: "Sister Fatima",
    role: "Mother & teacher, UAE",
  },
];

const principles = [
  { icon: "🕌", title: "Prayer First", desc: "Salah is the anchor of your day, not an item on a to-do list." },
  { icon: "🤲", title: "No Leaderboards", desc: "Your worship is between you and Allah. We never rank or compare." },
  { icon: "📵", title: "No Ads. Ever.", desc: "Istiqamaah is a paid utility. Your data is not our product." },
  { icon: "🌙", title: "Calm by Design", desc: "Every colour, animation, and sound is chosen to bring stillness." },
];

/* ─── sub-components ────────────────────────────────────── */

function NavBar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header
      className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
      style={{
        background: scrolled
          ? "rgba(13, 38, 24, 0.92)"
          : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(45,155,111,0.15)" : "none",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/icons/icon-512.png"
            alt="Istiqamaah"
            width={34}
            height={34}
            className="rounded-xl"
            unoptimized
          />
          <span className="font-bold text-white text-lg tracking-tight">Istiqamaah</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {["Features", "Philosophy", "Pricing"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm font-medium text-white/70 hover:text-white transition-colors"
            >
              {item}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-white/70 hover:text-white transition-colors px-3 py-1.5"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all"
            style={{ background: "linear-gradient(135deg,#2d9b6f,#1d7a4a)" }}
          >
            Get started free
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-white p-2 rounded-lg"
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="md:hidden border-t px-6 py-4 space-y-3"
          style={{
            background: "rgba(13,38,24,0.97)",
            backdropFilter: "blur(16px)",
            borderColor: "rgba(45,155,111,0.2)",
          }}
        >
          {["Features", "Philosophy", "Pricing"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              onClick={() => setOpen(false)}
              className="block text-white/80 font-medium py-2 hover:text-white transition-colors"
            >
              {item}
            </a>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <Link href="/login" className="block text-center py-2.5 text-white/70 font-medium border border-white/10 rounded-xl hover:border-white/20 transition-colors">
              Sign in
            </Link>
            <Link href="/register" className="block text-center py-2.5 text-white font-semibold rounded-xl" style={{ background: "linear-gradient(135deg,#2d9b6f,#1d7a4a)" }}>
              Get started free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function HeroSection() {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-16 overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #0a1f14 0%, #0d2618 35%, #122b1c 60%, #0a1a0f 100%)",
      }}
    >
      {/* Decorative radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 70% 55% at 50% 40%, rgba(45,155,111,0.18) 0%, transparent 70%)",
        }}
      />
      {/* Subtle star dots */}
      {[...Array(24)].map((_, i) => (
        <div
          key={i}
          className="pointer-events-none absolute rounded-full"
          style={{
            width: i % 3 === 0 ? 2 : 1.5,
            height: i % 3 === 0 ? 2 : 1.5,
            background: i % 5 === 0 ? "#c9943a" : "rgba(255,255,255,0.4)",
            top: `${8 + (i * 3.7) % 80}%`,
            left: `${5 + (i * 7.3) % 90}%`,
            opacity: 0.5 + (i % 5) * 0.1,
          }}
        />
      ))}

      {/* Icon */}
      <div className="relative mb-6 animate-pulse" style={{ animationDuration: "4s" }}>
        <div
          className="w-24 h-24 rounded-3xl overflow-hidden mx-auto"
          style={{ boxShadow: "0 0 60px rgba(45,155,111,0.35), 0 0 120px rgba(45,155,111,0.12)" }}
        >
          <Image
            src="/icons/icon-512.png"
            alt="Istiqamaah"
            width={96}
            height={96}
            unoptimized
            priority
          />
        </div>
      </div>

      {/* Arabic headline */}
      <p
        className="text-2xl mb-3 font-light tracking-widest"
        style={{ color: "#c9943a", fontFamily: "Georgia, serif", direction: "rtl" }}
      >
        إِسْتِقَامَة
      </p>

      <h1
        className="text-5xl sm:text-6xl md:text-7xl font-bold mb-5 leading-tight"
        style={{ color: "#f5f0e8" }}
      >
        Balance your Deen.
        <br />
        <span style={{ color: "#2d9b6f" }}>Organize your life.</span>
      </h1>

      <p
        className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
        style={{ color: "rgba(245,240,232,0.65)" }}
      >
        Plan your day around Salah, build meaningful habits, and make time
        for what truly matters — without turning your worship into a game.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/register"
          className="group flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-white text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #2d9b6f 0%, #1d7a4a 100%)",
            boxShadow: "0 4px 30px rgba(45,155,111,0.35)",
          }}
        >
          Start your journey
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link
          href="/login"
          className="flex items-center justify-center px-8 py-4 rounded-2xl font-medium text-base transition-all hover:scale-[1.02]"
          style={{
            color: "#f5f0e8",
            border: "1px solid rgba(245,240,232,0.18)",
            background: "rgba(255,255,255,0.04)",
          }}
        >
          I already have an account
        </Link>
      </div>

      {/* Prayer time strip */}
      <div
        className="mt-16 w-full max-w-3xl mx-auto rounded-2xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(45,155,111,0.2)",
        }}
      >
        <div className="grid grid-cols-5 divide-x divide-emerald-900/20">
          {prayerTimes.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.name} className="flex flex-col items-center py-4 gap-1">
                <Icon size={14} style={{ color: "#c9943a" }} />
                <span className="text-xs font-semibold" style={{ color: "#f5f0e8" }}>{p.name}</span>
                <span className="text-xs font-bold" style={{ color: "#2d9b6f" }}>{p.time}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
        <span className="text-xs text-white/50 tracking-widest uppercase">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-white/40 to-transparent" />
      </div>
    </section>
  );
}

function FeaturesSection() {
  const { ref, inView } = useInView();
  return (
    <section
      id="features"
      ref={ref}
      className="py-24 px-6"
      style={{ background: "#0d2618" }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: "#c9943a" }}>
            Everything you need
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4" style={{ color: "#f5f0e8" }}>
            One app for your whole day
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "rgba(245,240,232,0.55)" }}>
            From before Fajr to after Isha — Istiqamaah is your calm companion for worship, work, and reflection.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="rounded-2xl p-6 flex flex-col gap-3 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1"
                style={{
                  background: `linear-gradient(135deg, rgba(13,38,24,0.8), rgba(18,43,28,0.9))`,
                  border: "1px solid rgba(45,155,111,0.14)",
                  opacity: inView ? 1 : 0,
                  transform: inView ? "translateY(0)" : "translateY(24px)",
                  transition: `opacity 0.5s ${i * 0.06}s, transform 0.5s ${i * 0.06}s`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${f.accent}22` }}
                >
                  <Icon size={20} style={{ color: f.accent }} />
                </div>
                <h3 className="font-semibold text-base" style={{ color: "#f5f0e8" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(245,240,232,0.5)" }}>
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PrayerSection() {
  const { ref, inView } = useInView();
  const [active, setActive] = useState(0);
  return (
    <section
      ref={ref}
      className="py-24 px-6 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #0d2618 0%, #0a1f14 100%)" }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: "#c9943a" }}>
            Prayer-first design
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4" style={{ color: "#f5f0e8" }}>
            Your day, anchored in Salah
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "rgba(245,240,232,0.55)" }}>
            Most productivity apps fit prayer into your schedule. Istiqamaah does the opposite.
          </p>
        </div>

        {/* Interactive prayer timeline */}
        <div
          className="rounded-3xl p-8 md:p-12"
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(45,155,111,0.18)",
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(28px)",
            transition: "opacity 0.6s, transform 0.6s",
          }}
        >
          {/* Prayer selector */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-8 justify-center">
            {prayerTimes.map((p, i) => (
              <button
                key={p.name}
                onClick={() => setActive(i)}
                className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl shrink-0 transition-all"
                style={{
                  background: active === i ? "rgba(45,155,111,0.25)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${active === i ? "rgba(45,155,111,0.45)" : "rgba(255,255,255,0.06)"}`,
                }}
              >
                <span className="text-xs font-bold" style={{ color: active === i ? "#2d9b6f" : "rgba(245,240,232,0.5)" }}>
                  {p.name}
                </span>
                <span className="text-xs" style={{ color: active === i ? "#c9943a" : "rgba(245,240,232,0.3)" }}>
                  {p.time}
                </span>
              </button>
            ))}
          </div>

          {/* Active prayer detail */}
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(45,155,111,0.15)", border: "1px solid rgba(45,155,111,0.3)" }}
            >
              <span className="text-4xl font-light" style={{ color: "#c9943a", fontFamily: "Georgia, serif" }}>
                {prayerTimes[active].arabic.charAt(0)}
              </span>
            </div>
            <div>
              <p style={{ color: "#c9943a", fontFamily: "Georgia, serif", fontSize: 22, direction: "rtl" }}>
                {prayerTimes[active].arabic}
              </p>
              <h3 className="text-2xl font-bold mt-1" style={{ color: "#f5f0e8" }}>
                {prayerTimes[active].name} · {prayerTimes[active].time}
              </h3>
              <p className="mt-2 text-base" style={{ color: "rgba(245,240,232,0.55)" }}>
                {prayerTimes[active].tagline} — your tasks and habits are automatically
                grouped into this prayer window, giving every action its proper context.
              </p>
            </div>
          </div>

          {/* Features of the prayer system */}
          <div className="mt-8 grid sm:grid-cols-3 gap-4">
            {[
              { icon: "📍", t: "Location-aware", d: "Auto-calculates times for your GPS position" },
              { icon: "🔔", t: "Adhan reminder", d: "Gentle notification 5 minutes before each prayer" },
              { icon: "📋", t: "Salah log", d: "Track which prayers you completed on time" },
            ].map((item) => (
              <div
                key={item.t}
                className="rounded-xl p-4 flex gap-3 items-start"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(45,155,111,0.1)" }}
              >
                <span className="text-xl shrink-0">{item.icon}</span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#f5f0e8" }}>{item.t}</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.45)" }}>{item.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PhilosophySection() {
  const { ref, inView } = useInView();
  return (
    <section
      id="philosophy"
      ref={ref}
      className="py-24 px-6"
      style={{ background: "#0a1f14" }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: "#c9943a" }}>
            Our principles
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4" style={{ color: "#f5f0e8" }}>
            Built differently, on purpose
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "rgba(245,240,232,0.55)" }}>
            Istiqamaah isn&apos;t a habit tracker with Islamic features bolted on. It&apos;s designed from the ground up around the Muslim experience of time.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {principles.map((p, i) => (
            <div
              key={p.title}
              className="flex gap-5 rounded-2xl p-7"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(45,155,111,0.14)",
                opacity: inView ? 1 : 0,
                transform: inView ? "translateX(0)" : i % 2 === 0 ? "translateX(-20px)" : "translateX(20px)",
                transition: `opacity 0.5s ${i * 0.08}s, transform 0.5s ${i * 0.08}s`,
              }}
            >
              <span className="text-3xl shrink-0">{p.icon}</span>
              <div>
                <h3 className="font-bold text-lg mb-1.5" style={{ color: "#f5f0e8" }}>{p.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(245,240,232,0.55)" }}>{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const { ref, inView } = useInView();
  return (
    <section
      className="py-24 px-6"
      ref={ref}
      style={{ background: "#0d2618" }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: "#c9943a" }}>
            From the community
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold" style={{ color: "#f5f0e8" }}>
            Real people. Real steadfastness.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className="rounded-2xl p-7 flex flex-col gap-4"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(45,155,111,0.14)",
                opacity: inView ? 1 : 0,
                transform: inView ? "translateY(0)" : "translateY(24px)",
                transition: `opacity 0.5s ${i * 0.1}s, transform 0.5s ${i * 0.1}s`,
              }}
            >
              <div className="flex gap-1">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} size={14} fill="#c9943a" stroke="none" />
                ))}
              </div>
              <p className="text-sm leading-relaxed italic" style={{ color: "rgba(245,240,232,0.75)" }}>
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-auto pt-4" style={{ borderTop: "1px solid rgba(45,155,111,0.12)" }}>
                <p className="font-semibold text-sm" style={{ color: "#f5f0e8" }}>{t.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.4)" }}>{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const { ref, inView } = useInView();
  return (
    <section
      id="pricing"
      ref={ref}
      className="py-24 px-6"
      style={{ background: "#0a1f14" }}
    >
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-sm font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: "#c9943a" }}>
          Simple pricing
        </p>
        <h2 className="text-4xl sm:text-5xl font-bold mb-4" style={{ color: "#f5f0e8" }}>
          Start free. Grow with it.
        </h2>
        <p className="text-lg mb-12" style={{ color: "rgba(245,240,232,0.55)" }}>
          No ads, no subscriptions tricks — just a tool built for your benefit.
        </p>

        <div
          className="grid md:grid-cols-2 gap-6 text-left"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.6s, transform 0.6s",
          }}
        >
          {/* Free */}
          <div
            className="rounded-3xl p-8 flex flex-col gap-5"
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(45,155,111,0.14)",
            }}
          >
            <div>
              <h3 className="text-xl font-bold" style={{ color: "#f5f0e8" }}>Free</h3>
              <div className="flex items-end gap-1 mt-2">
                <span className="text-4xl font-bold" style={{ color: "#f5f0e8" }}>$0</span>
                <span className="text-sm mb-1" style={{ color: "rgba(245,240,232,0.4)" }}>/forever</span>
              </div>
            </div>
            <ul className="space-y-3">
              {["5 active habits", "Prayer time calculator", "Dhikr counter", "Daily Hadith", "Offline support"].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm" style={{ color: "rgba(245,240,232,0.7)" }}>
                  <CheckCircle2 size={16} style={{ color: "#2d9b6f", flexShrink: 0 }} />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="mt-auto block text-center py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02]"
              style={{
                color: "#2d9b6f",
                border: "1px solid rgba(45,155,111,0.4)",
                background: "rgba(45,155,111,0.08)",
              }}
            >
              Get started — it&apos;s free
            </Link>
          </div>

          {/* Pro */}
          <div
            className="rounded-3xl p-8 flex flex-col gap-5 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(45,155,111,0.15), rgba(29,122,74,0.1))",
              border: "1px solid rgba(45,155,111,0.35)",
            }}
          >
            <div
              className="absolute top-4 right-4 text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: "#c9943a", color: "#0a1f14" }}
            >
              Most popular
            </div>
            <div>
              <h3 className="text-xl font-bold" style={{ color: "#f5f0e8" }}>Pro</h3>
              <div className="flex items-end gap-1 mt-2">
                <span className="text-4xl font-bold" style={{ color: "#f5f0e8" }}>$4</span>
                <span className="text-sm mb-1" style={{ color: "rgba(245,240,232,0.5)" }}>/month</span>
              </div>
            </div>
            <ul className="space-y-3">
              {[
                "Everything in Free",
                "Unlimited habits & goals",
                "Focus sessions (Pomodoro)",
                "Analytics & streak insights",
                "Smart prayer notifications",
                "Daily reflection journal",
                "Qur'an progress tracker",
                "Cloud sync across devices",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm" style={{ color: "rgba(245,240,232,0.7)" }}>
                  <CheckCircle2 size={16} style={{ color: "#c9943a", flexShrink: 0 }} />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="mt-auto block text-center py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02]"
              style={{
                background: "linear-gradient(135deg,#2d9b6f,#1d7a4a)",
                color: "#fff",
                boxShadow: "0 4px 20px rgba(45,155,111,0.3)",
              }}
            >
              Start free 14-day trial
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section
      className="py-28 px-6 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0a1f14, #0d2618)" }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(45,155,111,0.15), transparent 70%)" }}
      />
      <div className="relative max-w-3xl mx-auto text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl overflow-hidden" style={{ boxShadow: "0 0 40px rgba(45,155,111,0.3)" }}>
          <Image src="/icons/icon-512.png" alt="Istiqamaah" width={64} height={64} unoptimized />
        </div>
        <p
          className="text-3xl mb-3 font-light"
          style={{ color: "#c9943a", fontFamily: "Georgia, serif", direction: "rtl" }}
        >
          إِسْتِقَامَة
        </p>
        <h2 className="text-4xl sm:text-5xl font-bold mb-5" style={{ color: "#f5f0e8" }}>
          Your Istiqamah starts today
        </h2>
        <p className="text-lg mb-10 mx-auto max-w-xl" style={{ color: "rgba(245,240,232,0.6)" }}>
          Join thousands of Muslims who build their days around what matters most.
          No noise. No guilt. Just steadfastness, one prayer at a time.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="group flex items-center justify-center gap-2 px-10 py-4 rounded-2xl font-semibold text-white text-base transition-all hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg,#2d9b6f,#1d7a4a)",
              boxShadow: "0 4px 30px rgba(45,155,111,0.35)",
            }}
          >
            Create free account
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/login"
            className="flex items-center justify-center px-10 py-4 rounded-2xl font-medium text-base transition-all"
            style={{
              color: "rgba(245,240,232,0.7)",
              border: "1px solid rgba(245,240,232,0.12)",
            }}
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer
      className="py-12 px-6"
      style={{ background: "#081510", borderTop: "1px solid rgba(45,155,111,0.1)" }}
    >
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
        <div className="flex items-center gap-2.5">
          <Image src="/icons/icon-512.png" alt="Istiqamaah" width={30} height={30} className="rounded-xl" unoptimized />
          <div>
            <p className="font-bold text-sm" style={{ color: "#f5f0e8" }}>Istiqamaah</p>
            <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>Balance your Deen. Organize your life.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-3 justify-center md:justify-end text-sm" style={{ color: "rgba(245,240,232,0.45)" }}>
          {["Features", "Philosophy", "Pricing", "Login", "Register"].map((item) => (
            <Link
              key={item}
              href={item === "Login" ? "/login" : item === "Register" ? "/register" : `#${item.toLowerCase()}`}
              className="hover:text-white transition-colors"
            >
              {item}
            </Link>
          ))}
        </div>
      </div>
      <div className="mt-8 text-center text-xs" style={{ color: "rgba(245,240,232,0.2)" }}>
        © {new Date().getFullYear()} Istiqamaah. Built with sincerity.
      </div>
    </footer>
  );
}

/* ─── main export ───────────────────────────────────────── */

export function LandingPage() {
  return (
    <div className="antialiased" style={{ fontFamily: "var(--font-geist-sans, sans-serif)" }}>
      <NavBar />
      <HeroSection />
      <FeaturesSection />
      <PrayerSection />
      <PhilosophySection />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
}
