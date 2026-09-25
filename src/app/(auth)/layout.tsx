import Link from "next/link";

import { AppLogo } from "@/components/ui/app-logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-16 items-center px-6">
        <Link href="/" className="flex items-center">
          <AppLogo size="md" />
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-12">
        {children}
      </main>

      {/* Footer tagline — only visible on auth pages */}
      <footer className="flex items-center justify-center pb-8 px-6">
        <p className="text-xs text-muted-foreground text-center">
          Balance your Deen. Organize your life.
        </p>
      </footer>
    </div>
  );
}
