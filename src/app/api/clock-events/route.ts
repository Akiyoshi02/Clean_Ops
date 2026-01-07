import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { nowIso } from "@/lib/firebase/db";
import { requireApiRole } from "@/lib/api-auth";
import { haversineDistanceMeters } from "@/lib/geo";
import type { Job, JobClockEvent, Site } from "@/lib/types";

const payloadSchema = z.object({
  job_id: z.string().min(1),
  type: z.enum(["CLOCK_IN", "CLOCK_OUT"]),
  at: z.string().optional(),
  lat: z.number(),
  lng: z.number(),
  accuracy_meters: z.number().optional().nullable(),
  source: z.enum(["ONLINE", "OFFLINE_SYNCED"]).optional(),
});

export async function POST(request: Request) {
  const { response, profile } = await requireApiRole([
    "HR",
    "SUPERVISOR",
    "CLEANER",
  ]);
  if (response || !profile) return response;

  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const jobDoc = await adminDb.collection("jobs").doc(parsed.data.job_id).get();
  if (!jobDoc.exists) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  const job = { id: jobDoc.id, ...(jobDoc.data() as Job) } as Job;

  if (profile.role === "CLEANER" && job.assigned_cleaner_id !== profile.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const siteDoc = await adminDb.collection("sites").doc(job.site_id).get();
  const site = siteDoc.exists
    ? ({ id: siteDoc.id, ...(siteDoc.data() as Site) } as Site)
    : null;

  let distance: number | null = null;
  let isWithin: boolean | null = null;
  if (site) {
    distance = haversineDistanceMeters(
      parsed.data.lat,
      parsed.data.lng,
      Number(site.lat),
      Number(site.lng),
    );
    isWithin = distance <= Number(site.geofence_radius_meters ?? 150);
  }

  const id = adminDb.collection("job_clock_events").doc().id;
  const record: JobClockEvent = {
    id,
    job_id: parsed.data.job_id,
    cleaner_id: job.assigned_cleaner_id ?? profile.id,
    type: parsed.data.type,
    at: parsed.data.at ?? new Date().toISOString(),
    lat: parsed.data.lat,
    lng: parsed.data.lng,
    accuracy_meters: parsed.data.accuracy_meters ?? null,
    is_within_geofence: isWithin,
    distance_meters: distance,
    source: parsed.data.source ?? "ONLINE",
    created_at: nowIso(),
  };

  await adminDb.collection("job_clock_events").doc(id).set(record);
  return NextResponse.json(record, { status: 200 });
}
