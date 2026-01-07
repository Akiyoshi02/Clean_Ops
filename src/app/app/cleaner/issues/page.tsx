import { AlertTriangle, CheckCircle, Clock, MapPin } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { listIssues } from "@/lib/repositories/issues";
import { listJobs } from "@/lib/repositories/jobs";
import { getSitesByIds } from "@/lib/repositories/sites";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { IssueStatusBadge, IssueSeverityBadge } from "@/components/ui/status-badge";

export default async function CleanerIssuesPage() {
  const profile = await requireRole(["CLEANER"]);
  const [issues, jobs] = await Promise.all([
    listIssues(),
    listJobs({ cleanerId: profile.id }),
  ]);
  const jobMap = new Map(jobs.map((job) => [job.id, job]));
  const relatedIssues = issues.filter(
    (issue) =>
      issue.created_by === profile.id || jobMap.has(issue.job_id),
  );

  const siteIds = Array.from(
    new Set(
      relatedIssues
        .map((issue) => jobMap.get(issue.job_id)?.site_id)
        .filter(Boolean) as string[],
    ),
  );
  const sites = await getSitesByIds(siteIds);
  const siteMap = new Map(sites.map((site) => [site.id, site]));

  const openIssues = relatedIssues.filter((issue) => issue.status !== "RESOLVED");
  const resolvedIssues = relatedIssues.filter((issue) => issue.status === "RESOLVED");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Issues</h1>
          <p className="text-muted-foreground">
            Track and manage reported issues
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-warning/10 text-warning">
          <AlertTriangle className="h-6 w-6" />
        </div>
      </div>

      {/* Open Issues */}
      {openIssues.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-warning" />
              Open Issues
              <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-warning/10 px-1.5 text-xs font-medium text-warning">
                {openIssues.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {openIssues.map((issue) => (
              <div
                key={issue.id}
                className="rounded-2xl border border-border/50 bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {siteMap.get(jobMap.get(issue.job_id)?.site_id ?? "")?.name ?? "Site"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {issue.category?.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <IssueStatusBadge status={issue.status} />
                    <IssueSeverityBadge severity={issue.severity} />
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{issue.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Resolved Issues */}
      {resolvedIssues.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="h-4 w-4 text-primary" />
              Resolved
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {resolvedIssues.map((issue) => (
              <div
                key={issue.id}
                className="rounded-2xl border border-border/50 bg-muted/30 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-muted-foreground">
                      {siteMap.get(jobMap.get(issue.job_id)?.site_id ?? "")?.name ?? "Site"}
                    </p>
                    <p className="text-sm text-muted-foreground">{issue.message}</p>
                  </div>
                  <IssueStatusBadge status={issue.status} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {relatedIssues.length === 0 && (
        <EmptyState
          icon="alert-triangle"
          title="No issues reported"
          description="When you report issues during your shifts, they'll appear here."
        />
      )}
    </div>
  );
}
