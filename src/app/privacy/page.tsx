import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Lock, Shield } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppLogo } from "@/components/ui/app-logo";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Privacy Policy · Istiqamaah",
  description:
    "Privacy Policy for Istiqamaah — Balance your Deen. Organize your life. Transparent disclosure of how personal worship and productivity data is stored, protected, and isolated.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href="/">
            <AppLogo size="sm" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2")}
            >
              <ArrowLeft className="size-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-600/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-400">
            <Shield className="size-3.5" />
            <span>Privacy-First Architecture</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated: September 2026 · Effective immediately for all users of Istiqamaah.
          </p>
        </div>

        {/* Executive Guarantee Card */}
        <Card className="my-8 border-emerald-600/30 bg-emerald-500/5">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2.5 text-base font-semibold text-emerald-800 dark:text-emerald-300">
              <Lock className="size-5 shrink-0" />
              <span>Our Sacred Trust: Your Worship Is Private</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Istiqamaah is built on the principle of <em>Ihsan</em> (excellence and sincerity). We do
              not sell user data, run third-party advertising trackers, create public worship rankings,
              or feed your reflections and prayer logs into external artificial intelligence models.
              Your relationship with Allah is between you and your Creator.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-10 text-sm leading-relaxed text-foreground/90">
          {/* Section 1: Overview */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">1. Introduction &amp; Purpose</h2>
            <p>
              Istiqamaah (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;the app&rdquo;) is a Muslim habit and
              productivity Progressive Web Application (PWA). Our tagline is <em>&ldquo;Balance your Deen.
              Organize your life.&rdquo;</em> This Privacy Policy outlines what information we collect, where
              it is stored, how it is protected, and your rights regarding your personal data.
            </p>
          </section>

          {/* Section 2: Data Classification */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">2. Information We Store</h2>
            <p>We classify all user data into four distinct storage tiers:</p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                  A. Local Browser Storage
                </h3>
                <p className="text-xs text-muted-foreground leading-normal">
                  Stored strictly inside your device&apos;s browser (localStorage). Includes active theme
                  (light/dark), UI language, local notification toggles, and pending offline sync actions.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                  B. Supabase Database Records
                </h3>
                <p className="text-xs text-muted-foreground leading-normal">
                  When authenticated, your records sync to a dedicated PostgreSQL database hosted via
                  Supabase. This includes: prayer logs, habits &amp; logs, tasks, focus sessions, Qur&apos;an
                  reading sessions, dhikr logs, ramadan logs, and personal reflections.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                  C. Cached Data &amp; Offline Queue
                </h3>
                <p className="text-xs text-muted-foreground leading-normal">
                  To ensure full offline usability as a PWA, relevant dashboard metrics and static assets
                  are cached. Actions created offline are held in an isolated queue and replayed only for
                  your authenticated account upon reconnection.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                  D. Exported Files
                </h3>
                <p className="text-xs text-muted-foreground leading-normal">
                  You can download your entire history on demand as structured JSON, sanitized CSV files, or
                  a formatted weekly PDF report. Exports run client-side and are never uploaded to any
                  external server.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Cross-User Isolation & RLS */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">3. Database Security &amp; Isolation</h2>
            <p>
              We implement PostgreSQL <strong>Row Level Security (RLS)</strong> on every single user-owned table:
            </p>
            <ul className="list-inside list-disc space-y-1.5 pl-2 text-muted-foreground">
              <li>Every query is verified against the authenticated user token (<code>auth.uid() = user_id</code>).</li>
              <li>User A can <strong>never</strong> view, modify, delete, or export User B&apos;s records.</li>
              <li>RLS is enforced independently at the database level, preventing any application code bypass.</li>
              <li>No service-role administrative keys are ever bundled or exposed in client-side code.</li>
            </ul>
          </section>

          {/* Section 4: Location & Calculation Privacy */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">4. Location &amp; Prayer Times</h2>
            <p>
              Prayer time calculations require geographic coordinates (latitude and longitude). You may
              allow your browser to provide your coordinates via standard HTML5 Geolocation, or you can
              manually select a city and calculation method in Prayer Settings. We do not track your real-time
              GPS movements. Prayer calculations are computed locally using canonical astronomical formulas.
            </p>
          </section>

          {/* Section 5: What We Never Do */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">5. What We Do NOT Do</h2>
            <p>To uphold complete transparency, we explicitly declare what Istiqamaah will never do:</p>
            <ul className="list-inside list-disc space-y-1.5 pl-2 text-muted-foreground">
              <li>We do <strong>not</strong> display third-party advertisements.</li>
              <li>We do <strong>not</strong> sell or rent your personal, worship, or reflection data.</li>
              <li>We do <strong>not</strong> send your private reflections or journal entries to external AI services.</li>
              <li>We do <strong>not</strong> maintain public streaks, leaderboards, or &ldquo;worship scoreboards&rdquo;.</li>
              <li>We do <strong>not</strong> claim end-to-end encryption for cloud backups (data is encrypted in transit via TLS and stored in an RLS-protected database).</li>
            </ul>
          </section>

          {/* Section 6: Data Deletion & Rights */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">6. Data Retention &amp; Deletion Rights</h2>
            <p>
              You maintain total sovereignty over your data. In the app&apos;s <strong>Settings</strong> page, you
              can:
            </p>
            <ul className="list-inside list-disc space-y-1.5 pl-2 text-muted-foreground">
              <li>Export your complete personal data at any time (JSON, CSV, PDF).</li>
              <li>Clear local browser storage and cached preferences.</li>
              <li>Sign out, which cleanly purges the local offline synchronization queue.</li>
              <li>Request full account and cloud record deletion in accordance with GDPR and CCPA guidelines.</li>
            </ul>
          </section>

          {/* Section 7: Islamic Source Material & Non-Authority Disclaimer */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">7. Islamic Content &amp; Disclaimer</h2>
            <p>
              All Qur&apos;anic text, Hadiths, and Adhkar in Istiqamaah are curated from documented, verified
              classical sources (Sahih al-Bukhari, Sahih Muslim, Jami` at-Tirmidhi, Sunan Abu Dawud, Sunan Ibn Majah,
              and Hisnul Muslim). We never generate or rewrite religious source text with AI models.
            </p>
            <p className="text-muted-foreground">
              <strong>Disclaimer:</strong> Istiqamaah is a personal productivity, time-management, and habit-tracking
              tool. It does not constitute a religious authority, fatwa body, or psychiatric/medical service.
              Users should consult qualified Islamic scholars for personal rulings and healthcare professionals
              for health decisions.
            </p>
          </section>

          {/* Section 8: Contact */}
          <section className="space-y-3 border-t border-border pt-6">
            <h2 className="text-xl font-bold text-foreground">8. Contact Us</h2>
            <p className="text-muted-foreground">
              For any questions regarding this Privacy Policy or your data, please contact the maintainers
              at <code className="text-xs bg-muted px-1.5 py-0.5 rounded">support.istiqamaah@gmail.com</code>.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-4xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Istiqamaah. Balance your Deen. Organize your life.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:underline">Home</Link>
            <Link href="/terms" className="hover:underline">Terms of Use</Link>
            <Link href="/login" className="hover:underline">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
