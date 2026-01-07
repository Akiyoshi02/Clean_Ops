import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { listJobs } from "@/lib/repositories/jobs";
import { getSitesByIds } from "@/lib/repositories/sites";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  const siteName = sites[0]?.name ?? "Site";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active job</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {job ? (
          <div className="space-y-2">
            <p className="font-semibold">{siteName}</p>
            <p className="text-sm text-muted-foreground">
              Status: {job.status}
            </p>
            <Button asChild>
              <Link href={`/app/cleaner/jobs/${job.id}`}>Open job</Link>
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No active jobs right now.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
