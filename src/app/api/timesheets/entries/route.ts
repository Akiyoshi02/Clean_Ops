import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { mapDocs } from "@/lib/firebase/db";
import { requireApiRole } from "@/lib/api-auth";
import type { Job, Site, TimesheetEntry, Profile } from "@/lib/types";

export async function GET(request: Request) {
  const { response } = await requireApiRole(["HR", "SUPERVISOR"]);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const periodId = searchParams.get("periodId");
  if (!periodId) {
    return NextResponse.json({ error: "periodId required" }, { status: 400 });
  }

  const snapshot = await adminDb
    .collection("timesheet_entries")
    .where("period_id", "==", periodId)
    .get();
  const entries = mapDocs<TimesheetEntry>(snapshot).sort((a, b) => {
    const aTime = new Date(a.clock_in_at ?? 0).getTime();
    const bTime = new Date(b.clock_in_at ?? 0).getTime();
    return aTime - bTime;
  });

  const cleanerIds = Array.from(new Set(entries.map((entry) => entry.cleaner_id)));
  const jobIds = Array.from(new Set(entries.map((entry) => entry.job_id)));

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

  const jobDocs = jobIds.length
    ? await adminDb.getAll(
        ...jobIds.map((id) => adminDb.collection("jobs").doc(id)),
      )
    : [];
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

  const enriched = entries.map((entry) => {
    const profile = profiles.get(entry.cleaner_id);
    const job = jobs.get(entry.job_id);
    const site = job ? sites.get(job.site_id) : null;
    return {
      ...entry,
      profile: profile
        ? { name: profile.name, employee_id: profile.employee_id }
        : null,
      job: job
        ? {
            site_id: job.site_id,
            scheduled_start: job.scheduled_start,
            scheduled_end: job.scheduled_end,
            site_name: site?.name ?? null,
          }
        : null,
    };
  });

  return NextResponse.json(enriched, { status: 200 });
}
