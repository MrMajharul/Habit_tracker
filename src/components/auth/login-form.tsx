"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isDevAuthBypass, isSupabaseConfigured } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { clearUserLocalData } from "@/lib/cache/user-cache";
import {
  loginSchema,
  type LoginFormValues,
} from "@/lib/validations/auth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const configError = searchParams.get("error") === "supabase_not_configured";
  const callbackError = searchParams.get("error") === "auth_callback_failed";
  const errorDescription = searchParams.get("error_description");

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true);

    try {
      if (!isSupabaseConfigured) {
        if (isDevAuthBypass) {
          router.push("/dashboard");
          router.refresh();
          return;
        }

        toast.error("Supabase is not configured", {
          description: "Copy .env.example to .env.local and add your keys.",
        });
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        toast.error("Sign in failed", { description: error.message });
        return;
      }

      clearUserLocalData();
      toast.success("Welcome back");
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isSupabaseConfigured) {
      toast.message("Google sign-in ready", {
        description: "Configure Supabase OAuth to enable Google authentication.",
      });
      return;
    }

    try {
      clearUserLocalData();
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        if (
          error.message?.toLowerCase().includes("unsupported provider") ||
          error.message?.toLowerCase().includes("not enabled")
        ) {
          toast.error("Google sign-in is not enabled in Supabase", {
            description:
              "Please enable Google provider in Supabase Dashboard (Authentication > Providers > Google).",
            duration: 8000,
          });
        } else {
          toast.error("Google sign-in failed", { description: error.message });
        }
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unexpected error during Google sign-in";
      toast.error("Google sign-in error", { description: message });
    }
  };

  return (
    <Card className="w-full max-w-md border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>
          Sign in to continue planning your day around Salah.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {configError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            Supabase is not configured. Set environment variables or enable{" "}
            <code className="text-xs">NEXT_PUBLIC_DEV_AUTH_BYPASS=true</code> for
            local UI development.
          </p>
        ) : null}

        {callbackError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            Google authentication failed.{" "}
            {errorDescription
              ? decodeURIComponent(errorDescription)
              : "Please verify that the Google provider is enabled in your Supabase dashboard."}
          </p>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...register("email")}
            />
            {errors.email ? (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
            />
            {errors.password ? (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            ) : null}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
        >
          Google
        </Button>

        <div className="space-y-2 text-center text-xs text-muted-foreground">
          <p>
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Create one
            </Link>
          </p>
          <div className="flex items-center justify-center gap-3 text-[11px] text-muted-foreground/75">
            <Link href="/privacy" className="hover:underline">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:underline">
              Terms of Use
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
