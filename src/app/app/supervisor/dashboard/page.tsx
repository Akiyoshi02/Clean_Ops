import { requireRole } from "@/lib/auth";
import { listIssues } from "@/lib/repositories/issues";
import { listJobs, listOverdueJobs } from "@/lib/repositories/jobs";
import { getSitesByIds } from "@/lib/repositories/sites";
import { getSettings } from "@/lib/repositories/settings";
import { SupervisorDashboardClient } from "./dashboard-client";

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
  const siteMap = Object.fromEntries(sites.map((site) => [site.id, site]));

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
    <SupervisorDashboardClient
      data={{
        jobsList,
        issuesList,
        overdueList,
        siteMap,
        graceMinutes,
        inProgressCount: inProgressJobs.length,
        pendingReviewCount: pendingReviewJobs.length,
        completedCount: completedJobs.length,
        openIssuesCount: openIssues.length,
        completionRate,
        reworkJobs,
      }}
    />
  );
}
