"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, AlertCircle, Clock, ArrowRight, LogIn } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { signInWithEmailAndPassword } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { postJson } from "@/lib/api-client";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
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
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-semibold">
          Email address
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          className="h-12"
          leftIcon={<Mail className="h-4 w-4" />}
          error={!!errors.email}
          {...register("email")}
        />
        <AnimatePresence>
          {errors.email && (
            <motion.p 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="text-sm text-destructive flex items-center gap-1"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              {errors.email.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-semibold">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          className="h-12"
          leftIcon={<Lock className="h-4 w-4" />}
          error={!!errors.password}
          {...register("password")}
        />
        <AnimatePresence>
          {errors.password && (
            <motion.p 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="text-sm text-destructive flex items-center gap-1"
            >
              <AlertCircle className="h-3.5 w-3.5" />
              {errors.password.message}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
          >
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Sign in failed</p>
              <p className="mt-0.5 text-destructive/80">{errorMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cooldownSeconds > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning"
          >
            <Clock className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Too many attempts</p>
              <p className="mt-0.5 text-warning/80">Try again in {cooldownSeconds} seconds</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        className="w-full h-12 text-base font-semibold group"
        type="submit"
        size="lg"
        disabled={isSubmitting || cooldownSeconds > 0}
        loading={isSubmitting}
        leftIcon={!isSubmitting ? <LogIn className="h-5 w-5" /> : undefined}
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
        {!isSubmitting && (
          <ArrowRight className="ml-auto h-5 w-5 transition-transform group-hover:translate-x-1" />
        )}
      </Button>
    </form>
  );
}
