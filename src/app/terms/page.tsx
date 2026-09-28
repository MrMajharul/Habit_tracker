import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, CheckCircle2, Scale } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppLogo } from "@/components/ui/app-logo";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Terms of Use · Istiqamaah",
  description:
    "Terms of Use for Istiqamaah — Balance your Deen. Organize your life. Governing principles, usage policies, and Islamic content disclaimers.",
};

export default function TermsPage() {
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
            <Scale className="size-3.5" />
            <span>Terms of Service</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
            Terms of Use
          </h1>
          <p className="text-sm text-muted-foreground">
            Last updated: September 2026 · Effective for all users of the Istiqamaah platform.
          </p>
        </div>

        {/* Highlight Card */}
        <Card className="my-8 border-emerald-600/30 bg-emerald-500/5">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2.5 text-base font-semibold text-emerald-800 dark:text-emerald-300">
              <BookOpen className="size-5 shrink-0" />
              <span>Built on Mutual Trust and Integrity</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Istiqamaah is designed to help Muslims balance their spiritual obligations (Deen) and daily
              work/study responsibilities (Dunya) with discipline and calm. By using Istiqamaah, you agree
              to these Terms in full.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-10 text-sm leading-relaxed text-foreground/90">
          {/* 1. Agreement to Terms */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">1. Acceptance of Terms</h2>
            <p>
              By accessing, browsing, registering for, or using Istiqamaah (the &ldquo;Service&rdquo;), you
              confirm that you are legally competent to enter into these Terms of Use. If you do not agree
              with any part of these Terms, you must immediately discontinue use of the application.
            </p>
          </section>

          {/* 2. Permitted Use */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">2. Permitted Personal Use</h2>
            <p>
              Istiqamaah is provided strictly for your personal, non-commercial use. You agree to use the
              Service only for lawful purposes and in accordance with these Terms:
            </p>
            <ul className="list-inside list-disc space-y-1.5 pl-2 text-muted-foreground">
              <li>Tracking personal Salah, habits, study plans, tasks, focus sessions, and Qur&apos;an reading.</li>
              <li>Recording personal reflections and goal milestones for self-improvement.</li>
              <li>Exporting your personal data via the built-in JSON, CSV, and PDF export tools.</li>
            </ul>
            <p className="text-muted-foreground">
              You agree not to reverse-engineer, exploit, scrape, disrupt, or introduce malicious payloads into
              the platform infrastructure.
            </p>
          </section>

          {/* 3. Account Responsibilities */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">3. User Accounts &amp; Security</h2>
            <p>
              When you create an account, you are responsible for maintaining the confidentiality of your login
              credentials and for all activities that occur under your account. You agree to notify us
              immediately of any unauthorized use or security breach.
            </p>
          </section>

          {/* 4. Islamic Content & Religious Disclaimer */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">4. Islamic Content Disclaimer</h2>
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                Religious Authority &amp; Medical Disclaimer
              </h3>
              <p className="text-xs text-muted-foreground leading-normal">
                Istiqamaah is a technological utility to aid time management and personal habit consistency.
                <strong> Istiqamaah is NOT a religious authority, fatwa council, mufti, or medical/psychological clinic.</strong>
              </p>
              <p className="text-xs text-muted-foreground leading-normal">
                Prayer times and astronomical calculations are computed based on standard geometric algorithms
                and recognized calculation authorities (e.g. University of Islamic Sciences Karachi, Umm al-Qura,
                ISNA, MWL). Minor astronomical variances occur based on geographical terrain and daylight conditions.
                Users are advised to cross-reference with local masjid announcements where precision is required.
              </p>
            </div>
          </section>

          {/* 5. Intellectual Property */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">5. Intellectual Property &amp; Attributions</h2>
            <p>
              The code, interface designs, logos, and custom UI components of Istiqamaah are owned by the
              project maintainers. All Qur&apos;an texts, Hadiths, and supplications are part of the public Islamic
              heritage and are referenced from classical source collections (Sahih al-Bukhari, Sahih Muslim,
              Sunan collections, Tanzil, and Al-Quran Cloud) under scholarly integrity guidelines.
            </p>
          </section>

          {/* 6. Limitation of Liability */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">6. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              To the fullest extent permitted by law, Istiqamaah and its maintainers shall not be liable for
              any indirect, incidental, special, or consequential damages resulting from the use of, or
              inability to use, the Service, including prayer time variances, device notification failures,
              or internet connectivity interruptions.
            </p>
          </section>

          {/* 7. Termination */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">7. Termination &amp; Account Deletion</h2>
            <p>
              You may terminate your account at any time through the Settings page. We reserve the right to
              suspend or terminate access for accounts that violate these Terms or engage in abusive activity.
            </p>
          </section>

          {/* 8. Modifications */}
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">8. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We may update these Terms from time to time. Continued use of the Service following any
              modifications constitutes acceptance of the revised Terms.
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
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link href="/login" className="hover:underline">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
