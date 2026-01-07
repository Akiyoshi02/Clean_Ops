import { Clock, MapPin, AlertCircle, Timer, Coffee, FileText } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { listTimesheetEntriesForCleaner } from "@/lib/repositories/timesheets";
import { getJobsByIds } from "@/lib/repositories/jobs";
import { getSitesByIds } from "@/lib/repositories/sites";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

function formatTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export default async function CleanerTimesheetsPage() {
  const profile = await requireRole(["CLEANER"]);
  const entriesList = await listTimesheetEntriesForCleaner(profile.id);
  const jobIds = Array.from(new Set(entriesList.map((entry) => entry.job_id)));
  const jobs = await getJobsByIds(jobIds);
  const jobMap = new Map(jobs.map((job) => [job.id, job]));
  const siteIds = Array.from(new Set(jobs.map((job) => job.site_id)));
  const sites = await getSitesByIds(siteIds);
  const siteMap = new Map(sites.map((site) => [site.id, site]));

  const totalMinutes = entriesList.reduce((sum, e) => sum + (e.minutes_worked ?? 0), 0);
  const totalBreakMinutes = entriesList.reduce((sum, e) => sum + (e.break_minutes ?? 0), 0);
  const entriesWithExceptions = entriesList.filter(
    (e) => e.exceptions_json && Object.keys(e.exceptions_json).length > 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Timesheets</h1>
          <p className="text-muted-foreground">
            Your work hours and time entries
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <FileText className="h-6 w-6" />
        </div>
      </div>

      {/* Stats */}
      {entriesList.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Timer className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold">{formatTime(totalMinutes)}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                <Coffee className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-bold">{formatTime(totalBreakMinutes)}</p>
                <p className="text-xs text-muted-foreground">Breaks</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/10">
                <AlertCircle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-lg font-bold">{entriesWithExceptions.length}</p>
                <p className="text-xs text-muted-foreground">Exceptions</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Entries list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            Recent Entries
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {entriesList.length > 0 ? (
            entriesList.map((entry) => {
              const site = siteMap.get(jobMap.get(entry.job_id)?.site_id ?? "");
              const hasExceptions =
                entry.exceptions_json && Object.keys(entry.exceptions_json).length > 0;

              return (
                <div
                  key={entry.id}
                  className={`rounded-2xl border p-4 transition-colors ${
                    hasExceptions
                      ? "border-warning/20 bg-warning/5"
                      : "border-border/50 bg-card"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold">{site?.name ?? "Site"}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Timer className="h-3.5 w-3.5" />
                          {formatTime(entry.minutes_worked ?? 0)}
                          {(entry.break_minutes ?? 0) > 0 && (
                            <>
                              <span className="text-muted-foreground/50">•</span>
                              <Coffee className="h-3.5 w-3.5" />
                              {formatTime(entry.break_minutes ?? 0)} break
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={hasExceptions ? "warning" : "secondary"}
                      className="shrink-0"
                    >
                      {formatTime(entry.minutes_worked ?? 0)}
                    </Badge>
                  </div>
                  {hasExceptions && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-warning">
                      <AlertCircle className="h-4 w-4" />
                      Exceptions: {Object.keys(entry.exceptions_json!).join(", ")}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <EmptyState
              icon="file-text"
              title="No timesheet entries"
              description="Your work hours will appear here after you complete shifts."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
