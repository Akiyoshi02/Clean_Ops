import { NextResponse } from "next/server";
import Papa from "papaparse";
import { adminDb } from "@/lib/firebase/admin";
import { mapDocs } from "@/lib/firebase/db";
import { requireApiRole } from "@/lib/api-auth";
import type { Job, Site, TimesheetEntry, Profile } from "@/lib/types";

// Force dynamic rendering - Firebase Admin requires runtime credentials
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const periodId = searchParams.get("periodId");
  if (!periodId) {
    return NextResponse.json({ error: "periodId required" }, { status: 400 });
  }

  const { response } = await requireApiRole(["HR"]);
  if (response) return response;

  const settingsDoc = await adminDb
    .collection("settings")
    .doc("overtime_threshold_minutes")
    .get();
  const overtimeThresholdMinutes = Number(
    (settingsDoc?.data() as { value?: number } | undefined)?.value ?? 2280,
  );

  const entriesSnap = await adminDb
    .collection("timesheet_entries")
    .where("period_id", "==", periodId)
    .get();
  const entriesList = mapDocs<TimesheetEntry>(entriesSnap);

  const cleanerIds = Array.from(new Set(entriesList.map((entry) => entry.cleaner_id)));
  const jobIds = Array.from(new Set(entriesList.map((entry) => entry.job_id)));

  const profileDocs = await adminDb.getAll(
    ...cleanerIds.map((id) => adminDb.collection("profiles").doc(id)),
  );
  const profiles = new Map(
    profileDocs
      .filter((doc) => doc.exists)
      .map((doc) => [doc.id, doc.data() as Profile]),
  );

  const jobDocs = await adminDb.getAll(
    ...jobIds.map((id) => adminDb.collection("jobs").doc(id)),
  );
  const jobs = new Map(
    jobDocs
      .filter((doc) => doc.exists)
      .map((doc) => [doc.id, doc.data() as Job]),
  );

  const siteIds = Array.from(
    new Set(
      jobDocs
        .filter((doc) => doc.exists)
        .map((doc) => (doc.data() as Job).site_id),
    ),
  );
  const siteDocs = siteIds.length
    ? await adminDb.getAll(
        ...siteIds.map((id) => adminDb.collection("sites").doc(id)),
      )
    : [];
  const sites = new Map(
    siteDocs
      .filter((doc) => doc.exists)
      .map((doc) => [doc.id, doc.data() as Site]),
  );
  const allocation = new Map<string, { regular: number; overtime: number }>();
  const entriesByCleaner = new Map<string, typeof entriesList>();
  for (const entry of entriesList) {
    const list = entriesByCleaner.get(entry.cleaner_id) ?? [];
    list.push(entry);
    entriesByCleaner.set(entry.cleaner_id, list);
  }

  for (const cleanerEntries of entriesByCleaner.values()) {
    const sorted = [...cleanerEntries].sort((a, b) => {
      const aTime = new Date(
        a.clock_in_at ?? jobs.get(a.job_id)?.scheduled_start ?? 0,
      ).getTime();
      const bTime = new Date(
        b.clock_in_at ?? jobs.get(b.job_id)?.scheduled_start ?? 0,
      ).getTime();
      return aTime - bTime;
    });
    let remainingRegular = overtimeThresholdMinutes;
    for (const entry of sorted) {
      const minutes = entry.minutes_worked ?? 0;
      const regular = Math.max(0, Math.min(remainingRegular, minutes));
      const overtime = Math.max(0, minutes - regular);
      remainingRegular = Math.max(0, remainingRegular - regular);
      allocation.set(entry.id, { regular, overtime });
    }
  }

  const rows = entriesList.map((entry) => {
    const profile = profiles.get(entry.cleaner_id);
    const job = jobs.get(entry.job_id);
    const site = job ? sites.get(job.site_id) : null;
    return {
      cleaner: profile?.name ?? "",
      employee_id: profile?.employee_id ?? "",
      site: site?.name ?? "",
      scheduled_start: job?.scheduled_start ?? "",
      scheduled_end: job?.scheduled_end ?? "",
      clock_in_at: entry.clock_in_at ?? "",
      clock_out_at: entry.clock_out_at ?? "",
      minutes_worked: entry.minutes_worked ?? 0,
      break_minutes: entry.break_minutes ?? 0,
      regular_minutes: allocation.get(entry.id)?.regular ?? 0,
      overtime_minutes: allocation.get(entry.id)?.overtime ?? 0,
      exceptions: entry.exceptions_json
        ? Object.keys(entry.exceptions_json).join(", ")
        : "",
    };
  });

  const csv = Papa.unparse(rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename=timesheet-${periodId}.csv`,
    },
  });
}
