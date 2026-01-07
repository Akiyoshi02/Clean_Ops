import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              CleanOPS
            </p>
            <p className="text-xl font-semibold">Operations Suite</p>
          </div>
        </div>
        <Button asChild className="rounded-full">
          <Link href="/login">
            Sign in
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-16 pt-8">
        <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Cleaning Operations System
            </p>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
              Run every shift with confidence, clarity, and real-time field
              visibility.
            </h1>
            <p className="text-lg text-muted-foreground">
              CleanOPS centralizes scheduling, checklists, geofenced clocking,
              proof photos, and payroll exports in a single workflow. Designed
              for HR, supervisors, and mobile cleaners.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/login">
                  Launch app
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">View demo roles</Link>
              </Button>
            </div>
          </div>
          <Card>
            <CardContent className="grid gap-6 p-6">
              <div className="rounded-2xl border border-dashed border-border bg-background/80 p-6">
                <div className="flex items-center gap-3">
                  <Workflow className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">Live shift tracker</p>
                    <p className="text-sm text-muted-foreground">
                      Clock events, GPS distance checks, and issue logging in
                      one view.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-dashed border-border bg-background/80 p-6">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">Built-in approvals</p>
                    <p className="text-sm text-muted-foreground">
                      Supervisor review gates every job before it hits
                      payroll.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-dashed border-border bg-background/80 p-6">
                <p className="text-sm font-semibold">Offline-first</p>
                <p className="text-sm text-muted-foreground">
                  Cleaners keep working even without service. Sync resumes
                  automatically when back online.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
