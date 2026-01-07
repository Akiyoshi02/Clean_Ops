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
  Users,
  TrendingUp,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { listIssues } from "@/lib/repositories/issues";
import { listJobs, listOverdueJobs } from "@/lib/repositories/jobs";
import { getSitesByIds } from "@/lib/repositories/sites";
import { getSettings } from "@/lib/repositories/settings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
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
  const reworkJobs = jobsList.filter((j) => j.status === "REWORK_REQUIRED");
  const openIssues = issuesList.filter((issue) => issue.status !== "RESOLVED");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <TrendingUp className="h-6 w-6" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Jobs</p>
                <p className="text-3xl font-bold">{jobsList.length}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {inProgressJobs.length} in progress
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                <p className="text-3xl font-bold">{pendingReviewJobs.length}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-info/10">
                <Clock className="h-6 w-6 text-info" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Awaiting your approval
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Open Issues</p>
                <p className="text-3xl font-bold">{openIssues.length}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-warning/10">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rework Needed</p>
                <p className="text-3xl font-bold">{reworkJobs.length}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10">
                <RotateCcw className="h-6 w-6 text-destructive" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Jobs requiring rework
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Alerts */}
      {overdueList.length > 0 && (
        <Card className="border-warning/20 bg-warning/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-warning">
              <Bell className="h-4 w-4" />
              Attendance Alerts
              <Badge variant="warning" className="ml-auto">
                {overdueList.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overdueList.map((job) => (
              <Link
                key={job.id}
                href={`/app/supervisor/jobs/${job.id}`}
                className="group flex items-center justify-between rounded-xl border border-warning/20 bg-card p-4 transition-all hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/10">
                    <Clock className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="font-semibold">{siteMap.get(job.site_id)?.name ?? "Site"}</p>
                    <p className="text-sm text-muted-foreground">
                      Past scheduled end by {graceMinutes}+ mins
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Today's Schedule */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Today's Schedule
          </CardTitle>
          <Link
            href="/app/supervisor/schedule"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {jobsList.length > 0 ? (
            jobsList.slice(0, 5).map((job) => (
              <Link
                key={job.id}
                href={`/app/supervisor/jobs/${job.id}`}
                className="group flex items-center justify-between rounded-xl border border-border/50 bg-card p-4 transition-all hover:border-border hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">{siteMap.get(job.site_id)?.name ?? "Site"}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(job.scheduled_start), "h:mm a")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <JobStatusBadge status={job.status} />
                  <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))
          ) : (
            <EmptyState
              icon="calendar"
              title="No jobs today"
              description="No jobs scheduled for today."
            />
          )}
        </CardContent>
      </Card>

      {/* Latest Issues */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4" />
            Latest Issues
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {issuesList.length > 0 ? (
            issuesList.map((issue) => (
              <div
                key={issue.id}
                className="rounded-xl border border-border/50 bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <IssueSeverityBadge severity={issue.severity} />
                      <span className="text-xs text-muted-foreground">
                        {issue.category?.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {issue.message}
                    </p>
                  </div>
                  <IssueStatusBadge status={issue.status} />
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon="alert-triangle"
              title="No issues"
              description="No recent issues reported."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
