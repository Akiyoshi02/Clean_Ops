import { requireRole } from "@/lib/auth";
import { listJobs } from "@/lib/repositories/jobs";
import { listNotifications } from "@/lib/repositories/notifications";
import { getSitesByIds } from "@/lib/repositories/sites";
import { CleanerToday } from "./today";

export default async function CleanerTodayPage() {
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
  const siteIds = Array.from(new Set(jobs.map((job) => job.site_id)));
  const sites = await getSitesByIds(siteIds);
  const siteMap = new Map(sites.map((site) => [site.id, site]));

  const notifications = await listNotifications(profile.id);
  const unreadNotifications = notifications.filter((note) => !note.read_at).slice(0, 5);

  const jobsWithSites = jobs.map((job) => ({
    ...job,
    sites: siteMap.get(job.site_id) ?? null,
  }));

  return <CleanerToday initialJobs={jobsWithSites} notifications={unreadNotifications} />;
}
