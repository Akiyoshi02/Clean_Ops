import { format } from "date-fns";
import Link from "next/link";
import {
  Briefcase,
  AlertTriangle,
  RotateCcw,
  Clock,
  MapPin,
  ChevronRight,
  Bell,
  Calendar,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  Activity,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { listIssues } from "@/lib/repositories/issues";
import { listJobs, listOverdueJobs } from "@/lib/repositories/jobs";
import { getSitesByIds } from "@/lib/repositories/sites";
import { getSettings } from "@/lib/repositories/settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard, StatsGrid } from "@/components/ui/stat-card";
import { PageHeader } from "@/components/ui/page-header";
import { JobStatusBadge, IssueStatusBadge, IssueSeverityBadge } from "@/components/ui/status-badge";

function getNow() {
  return Date.now();
}

export default async function SupervisorDashboard() {
  await requireRole(["SUPERVISOR", "HR"]);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const [jobsList, issuesAll, settingsMap] = await Promise.all([
    listJobs({ start: start.toISOString(), end: end.toISOString() }),
    listIssues(),
    getSettings(["clock_grace_minutes"]),
  ]);
  const issuesList = issuesAll.slice(0, 5);

  const graceMinutes = Number(settingsMap.get("clock_grace_minutes") ?? 30);
  const overdueCutoff = new Date(getNow() - graceMinutes * 60000);

  const overdueList = await listOverdueJobs(overdueCutoff.toISOString());

  const siteIds = Array.from(
    new Set([...jobsList, ...overdueList].map((job) => job.site_id)),
  );
  const sites = await getSitesByIds(siteIds);
  const siteMap = new Map(sites.map((site) => [site.id, site]));

  const inProgressJobs = jobsList.filter((j) => j.status === "IN_PROGRESS");
  const pendingReviewJobs = jobsList.filter((j) => j.status === "COMPLETED_PENDING_REVIEW");
  const completedJobs = jobsList.filter((j) => j.status === "APPROVED");
  const reworkJobs = jobsList.filter((j) => j.status === "REWORK_REQUIRED");
  const openIssues = issuesList.filter((issue) => issue.status !== "RESOLVED");

  // Calculate completion rate
  const completionRate = jobsList.length > 0 
    ? Math.round((completedJobs.length / jobsList.length) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        description={format(new Date(), "EEEE, MMMM d, yyyy")}
        icon={Activity}
        iconColor="primary"
        badge={
          <Badge variant="solid-success" className="gap-1">
            <Sparkles className="h-3 w-3" />
            Live
          </Badge>
        }
      />

      {/* Stats Grid */}
      <StatsGrid columns={4}>
        <StatCard
          title="Today's Jobs"
          value={jobsList.length}
          icon={Briefcase}
          description={`${inProgressJobs.length} in progress`}
          variant="default"
        />
        <StatCard
          title="Pending Review"
          value={pendingReviewJobs.length}
          icon={Clock}
          description="Awaiting approval"
          variant="primary"
        />
        <StatCard
          title="Open Issues"
          value={openIssues.length}
          icon={AlertTriangle}
          description="Requires attention"
          variant="warning"
        />
        <StatCard
          title="Completion Rate"
          value={`${completionRate}%`}
          icon={CheckCircle2}
          description={`${completedJobs.length} of ${jobsList.length} completed`}
          variant="success"
          trend={completionRate >= 80 ? { value: completionRate, isPositive: true } : undefined}
        />
      </StatsGrid>

      {/* Attendance Alerts */}
      {overdueList.length > 0 && (
        <Card variant="elevated" className="border-warning/30 bg-gradient-to-br from-warning/10 via-warning/5 to-transparent overflow-hidden">
          <div className="absolute left-0 top-0 h-full w-1.5 bg-warning" />
          <CardHeader className="pb-4 pl-6">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/20">
                <Bell className="h-5 w-5 text-warning" />
              </div>
              <div>
                <span className="text-warning">Attendance Alerts</span>
                <p className="text-sm font-normal text-warning/70">
                  Cleaners past scheduled time
                </p>
              </div>
              <Badge variant="warning" className="ml-auto" pulse>
                {overdueList.length} alerts
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pl-6">
            {overdueList.map((job) => (
              <Link
                key={job.id}
                href={`/app/supervisor/jobs/${job.id}`}
                className="group flex items-center justify-between rounded-xl border border-warning/20 bg-card p-4 transition-all duration-200 hover:border-warning/40 hover:shadow-md hover:shadow-warning/5"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-warning/10 transition-transform group-hover:scale-105">
                    <Clock className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <p className="font-semibold">{siteMap.get(job.site_id)?.name ?? "Site"}</p>
                    <p className="text-sm text-muted-foreground">
                      Past scheduled end by {graceMinutes}+ mins
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Schedule */}
        <Card variant="default" className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Today&apos;s Schedule
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="gap-1 text-primary">
              <Link href="/app/supervisor/schedule">
                View all
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {jobsList.length > 0 ? (
              jobsList.slice(0, 5).map((job) => (
                <Link
                  key={job.id}
                  href={`/app/supervisor/jobs/${job.id}`}
                  className="group flex items-center justify-between rounded-xl border border-border/60 bg-card p-4 transition-all duration-200 hover:border-border hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted transition-transform group-hover:scale-105">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold">{siteMap.get(job.site_id)?.name ?? "Site"}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(job.scheduled_start), "h:mm a")} - {format(new Date(job.scheduled_end), "h:mm a")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <JobStatusBadge status={job.status} />
                    <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))
            ) : (
              <EmptyState
                icon="calendar"
                title="No jobs today"
                description="No jobs scheduled for today."
                size="sm"
              />
            )}
          </CardContent>
        </Card>

        {/* Latest Issues */}
        <Card variant="default" className="lg:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Latest Issues
              {openIssues.length > 0 && (
                <Badge variant="warning" className="ml-auto">
                  {openIssues.length} open
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {issuesList.length > 0 ? (
              issuesList.map((issue) => (
                <div
                  key={issue.id}
                  className="group rounded-xl border border-border/60 bg-card p-4 transition-all duration-200 hover:border-border hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <IssueSeverityBadge severity={issue.severity} />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {issue.category?.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {issue.message}
                      </p>
                    </div>
                    <IssueStatusBadge status={issue.status} />
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon="check-circle"
                title="All clear!"
                description="No recent issues reported."
                size="sm"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rework required section */}
      {reworkJobs.length > 0 && (
        <Card variant="elevated" className="border-destructive/30 bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent overflow-hidden">
          <div className="absolute left-0 top-0 h-full w-1.5 bg-destructive" />
          <CardHeader className="pb-4 pl-6">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/20">
                <RotateCcw className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <span className="text-destructive">Rework Required</span>
                <p className="text-sm font-normal text-destructive/70">
                  Jobs needing attention
                </p>
              </div>
              <Badge variant="destructive" className="ml-auto">
                {reworkJobs.length} jobs
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pl-6">
            {reworkJobs.map((job) => (
              <Link
                key={job.id}
                href={`/app/supervisor/jobs/${job.id}`}
                className="group flex items-center justify-between rounded-xl border border-destructive/20 bg-card p-4 transition-all duration-200 hover:border-destructive/40 hover:shadow-md hover:shadow-destructive/5"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-destructive/10 transition-transform group-hover:scale-105">
                    <RotateCcw className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <p className="font-semibold">{siteMap.get(job.site_id)?.name ?? "Site"}</p>
                    <p className="text-sm text-muted-foreground">
                      {job.rework_note ?? "Rework required"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
