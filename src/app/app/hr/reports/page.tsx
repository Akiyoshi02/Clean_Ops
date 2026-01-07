import { subDays } from "date-fns";
import { requireRole } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { mapDocs } from "@/lib/firebase/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Profile, TimesheetEntry } from "@/lib/types";

export default async function ReportsPage() {
  await requireRole(["HR"]);
  const since = subDays(new Date(), 30).toISOString();
  const entriesSnap = await adminDb
    .collection("timesheet_entries")
    .where("clock_in_at", ">=", since)
    .get();
  const entriesList = mapDocs<TimesheetEntry>(entriesSnap);
  const cleanerIds = Array.from(new Set(entriesList.map((entry) => entry.cleaner_id)));
  const profileDocs = cleanerIds.length
    ? await adminDb.getAll(
        ...cleanerIds.map((id) => adminDb.collection("profiles").doc(id)),
      )
    : [];
  const profiles = new Map(
    profileDocs
      .filter((doc) => doc.exists)
      .map((doc) => [doc.id, doc.data() as Profile]),
  );

  const totals = entriesList.reduce<Record<string, number>>((acc, entry) => {
    const name = profiles.get(entry.cleaner_id)?.name ?? "Unknown";
    const minutes = entry.minutes_worked ?? 0;
    acc[name] = (acc[name] ?? 0) + minutes;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Last 30 days labor totals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(totals).map(([name, minutes]) => (
            <div
              key={name}
              className="flex items-center justify-between rounded-xl border border-border bg-background/80 p-4"
            >
              <div className="font-semibold">{name}</div>
              <Badge variant="secondary">{Math.round(minutes / 60)} hrs</Badge>
            </div>
          ))}
          {Object.keys(totals).length === 0 && (
            <p className="text-sm text-muted-foreground">No entries yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
