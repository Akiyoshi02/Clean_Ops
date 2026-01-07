import { Suspense } from "react";
import { Sparkles, Shield } from "lucide-react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-page">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-gradient-radial from-primary/5 to-transparent" />
      </div>

      <div className="relative w-full max-w-md space-y-8">
        {/* Logo and branding */}
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground shadow-xl shadow-primary/30">
            <Sparkles className="h-8 w-8" />
          </div>
          <h1 className="mt-8 text-3xl font-bold tracking-tight sm:text-4xl bg-clip-text">
            Welcome back
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Sign in to your CleanOPS account
          </p>
        </div>

        {/* Login card */}
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/80 backdrop-blur-xl p-8 shadow-xl sm:p-10">
          {/* Card accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary" />
          
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <div className="relative">
                  <div className="h-10 w-10 animate-spin rounded-full border-3 border-primary border-t-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-4 w-4 rounded-full bg-primary/20" />
                  </div>
                </div>
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>

        {/* Footer */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            <span>Secured with enterprise-grade encryption</span>
          </div>
          <p className="text-xs text-muted-foreground/70">
            By signing in, you agree to CleanOPS policies
          </p>
        </div>
      </div>
    </div>
  );
}
