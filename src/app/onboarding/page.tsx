import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = { title: "Complete your profile" };

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Welcome to Istiqamaah</CardTitle>
          <CardDescription>
            Profile setup with location, timezone, prayer method, and language
            preferences will be completed here in Phase 1 follow-up.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/dashboard" className={buttonVariants()}>
            Continue to dashboard
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
