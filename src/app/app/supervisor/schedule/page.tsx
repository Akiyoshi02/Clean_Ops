import { requireRole } from "@/lib/auth";
import { listJobs } from "@/lib/repositories/jobs";
import { listSites } from "@/lib/repositories/sites";
import { listProfilesByRole } from "@/lib/repositories/users";
import { ScheduleManager } from "./schedule-manager";

export default async function SchedulePage() {
  await requireRole(["SUPERVISOR", "HR"]);
  const start = new Date();
  start.setDate(start.getDate() - 2);
  const end = new Date();
  end.setDate(end.getDate() + 21);

  const [jobs, sites, cleaners] = await Promise.all([
    listJobs({ start: start.toISOString(), end: end.toISOString() }),
    listSites(),
    listProfilesByRole("CLEANER"),
  ]);

  const siteMap = new Map(sites.map((site) => [site.id, site]));
  const jobsWithSites = jobs.map((job) => ({
    ...job,
    sites: { name: siteMap.get(job.site_id)?.name ?? "Site" },
  }));

  const cleanerOptions = cleaners.map((cleaner) => ({
    id: cleaner.id,
    name: cleaner.name,
  }));

  return (
    <ScheduleManager
      initialJobs={jobsWithSites ?? []}
      sites={sites ?? []}
      cleaners={cleanerOptions}
    />
  );
}
