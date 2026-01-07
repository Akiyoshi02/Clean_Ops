import Link from "next/link";
import { format } from "date-fns";
import { 
  MapPin, 
  Clock, 
  ChevronRight, 
  Play, 
  CheckCircle2,
  Building2,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { listJobs } from "@/lib/repositories/jobs";
import { getSitesByIds } from "@/lib/repositories/sites";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export default async function CleanerActivePage() {
  const profile = await requireRole(["CLEANER"]);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const jobs = await listJobs({
    start: start.toISOString(),
    end: end.toISOString(),
    cleanerId: profile.id,
  });
  const activeJob = jobs.find((job) => job.status === "IN_PROGRESS");
  const upcomingJob = jobs.find((job) => job.status === "PUBLISHED");
  const job = activeJob ?? upcomingJob ?? null;
  const sites = await getSitesByIds(job ? [job.site_id] : []);
  const site = sites[0] ?? null;

  return (
    <div className="space-y-6">
      {/* Hero section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-primary/80 p-6 text-primary-foreground shadow-xl shadow-primary/20">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
        
        <div className="relative">
          <div className="flex items-center gap-2 text-sm font-medium text-primary-foreground/80">
            <Play className="h-4 w-4" />
            Current Session
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            {activeJob ? "Active Job" : "Ready to Start"}
          </h1>
          <p className="mt-1 text-primary-foreground/80">
            {activeJob 
              ? "You have a job in progress" 
              : upcomingJob 
                ? "Your next job is ready" 
                : "No jobs scheduled right now"}
          </p>
        </div>
      </div>

      {/* Active/Next Job Card */}
      {job ? (
        <Card variant="elevated" className="overflow-hidden">
          <div className="relative">
            {/* Status indicator bar */}
            <div className={`absolute left-0 top-0 h-full w-1.5 ${
              activeJob ? "bg-primary" : "bg-muted-foreground"
            }`} />
            
            <CardHeader className="pb-4 pl-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    activeJob 
                      ? "bg-primary/10 text-primary" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {site?.name ?? "Site"}
                    </CardTitle>
                    {site?.city && (
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {site.city}, {site.state}
                      </p>
                    )}
                  </div>
                </div>
                <Badge 
                  variant={activeJob ? "default" : "secondary"} 
                  className="text-xs"
                  dot={!!activeJob}
                  pulse={!!activeJob}
                >
                  {activeJob ? "In Progress" : "Up Next"}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4 pl-6">
              {/* Time info */}
              <div className="flex flex-wrap items-center gap-4 rounded-xl bg-muted/50 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {format(new Date(job.scheduled_start), "h:mm a")}
                  </span>
                  <span className="text-muted-foreground">-</span>
                  <span className="font-medium">
                    {format(new Date(job.scheduled_end), "h:mm a")}
                  </span>
                </div>
                {site?.address_line1 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{site.address_line1}</span>
                  </div>
                )}
              </div>

              {/* Action button */}
              <Button asChild size="lg" className="w-full group">
                <Link href={`/app/cleaner/jobs/${job.id}`}>
                  {activeJob ? (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Continue Working
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-5 w-5" />
                      Start Job
                    </>
                  )}
                  <ArrowRight className="ml-auto h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </CardContent>
          </div>
        </Card>
      ) : (
        <Card variant="default">
          <CardContent className="py-8">
            <EmptyState
              icon="briefcase"
              title="No Active Jobs"
              description="You don&apos;t have any jobs in progress or scheduled right now. Check your Today tab for upcoming assignments."
              action={
                <Button asChild variant="outline">
                  <Link href="/app/cleaner/today">
                    View Today&apos;s Schedule
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Quick stats if active */}
      {activeJob && (
        <div className="grid grid-cols-2 gap-3">
          <Card variant="default" className="p-4 text-center">
            <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Play className="h-5 w-5" />
            </div>
            <p className="mt-2 text-2xl font-bold">1</p>
            <p className="text-xs text-muted-foreground">Active Job</p>
          </Card>
          <Card variant="default" className="p-4 text-center">
            <div className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-success/10 text-success">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <p className="mt-2 text-2xl font-bold">
              {jobs.filter(j => j.status === "APPROVED" || j.status === "COMPLETED_PENDING_REVIEW").length}
            </p>
            <p className="text-xs text-muted-foreground">Done Today</p>
          </Card>
        </div>
      )}
    </div>
  );
}
