"use client";

import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { isSupabaseConfigured } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import {
  registerSchema,
  type RegisterFormValues,
} from "@/lib/validations/auth";

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterFormValues) => {
    if (!isSupabaseConfigured) {
      toast.error("Supabase is not configured", {
        description: "Copy .env.example to .env.local and add your keys.",
      });
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { name: values.name },
        },
      });

      if (error) {
        toast.error("Registration failed", { description: error.message });
        return;
      }

      if (data.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("profiles") as any).upsert({
          id: data.user.id,
          name: values.name,
          email: values.email,
          onboarding_completed: false,
        });
      }

      toast.success("Account created", {
        description: "Check your email to confirm your account if required.",
      });
      router.push("/onboarding");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!isSupabaseConfigured) {
      toast.message("Google sign-in ready", {
        description: "Configure Supabase OAuth to enable Google authentication.",
      });
      return;
    }

    try {
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
        <CardTitle>Create your account</CardTitle>
        <CardDescription>
          Start building a calm, prayer-centered daily routine.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" autoComplete="name" {...register("name")} />
            {errors.name ? (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
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
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password ? (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword ? (
              <p className="text-xs text-destructive">
                {errors.confirmPassword.message}
              </p>
            ) : null}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignUp}
        >
          <svg className="mr-2 size-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Google
        </Button>

        <div className="space-y-2 text-center text-xs text-muted-foreground">
          <p>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
          <p className="text-[11px] text-muted-foreground/80">
            By signing up, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-foreground">
              Terms of Use
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
