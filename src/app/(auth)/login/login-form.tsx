"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { signInWithEmailAndPassword } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { postJson } from "@/lib/api-client";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

type LoginFormValues = z.infer<typeof loginSchema>;

function getAttemptTimestamps() {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = window.localStorage.getItem("cleanops.login.attempts");
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as number[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
}

function saveAttemptTimestamps(attempts: number[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(
    "cleanops.login.attempts",
    JSON.stringify(attempts),
  );
}

function getNow() {
  return Date.now();
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = React.useState<number>(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      const now = getNow();
      const attempts = getAttemptTimestamps().filter(
        (ts) => now - ts < ATTEMPT_WINDOW_MS,
      );
      saveAttemptTimestamps(attempts);
      if (attempts.length >= MAX_ATTEMPTS) {
        const oldest = attempts[0];
        setCooldownSeconds(
          Math.max(0, Math.ceil((ATTEMPT_WINDOW_MS - (now - oldest)) / 1000)),
        );
      } else {
        setCooldownSeconds(0);
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const onSubmit = async (values: LoginFormValues) => {
    setErrorMessage(null);
    const now = getNow();
    const attempts = getAttemptTimestamps().filter(
      (ts) => now - ts < ATTEMPT_WINDOW_MS,
    );
    if (attempts.length >= MAX_ATTEMPTS) {
      setErrorMessage("Too many attempts. Please wait before trying again.");
      return;
    }

    try {
      const credentials = await signInWithEmailAndPassword(
        firebaseAuth,
        values.email,
        values.password,
      );
      const idToken = await credentials.user.getIdToken();
      const { error } = await postJson("/api/auth/session", { idToken });
      if (error) {
        await firebaseAuth.signOut();
        setErrorMessage(error.message);
        return;
      }
    } catch (error) {
      attempts.push(now);
      saveAttemptTimestamps(attempts);
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to sign in.",
      );
      return;
    }

    saveAttemptTimestamps([]);
    const redirect = (params.get("redirect") ?? "/app") as Route;
    router.push(redirect);
    router.refresh();
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          Email address
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          className="h-11"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          className="h-11"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      {cooldownSeconds > 0 && (
        <div className="rounded-xl border border-warning/20 bg-warning/5 p-3 text-sm text-warning">
          Too many attempts. Try again in {cooldownSeconds}s.
        </div>
      )}

      <Button
        className="w-full"
        type="submit"
        size="lg"
        disabled={isSubmitting || cooldownSeconds > 0}
        loading={isSubmitting}
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
