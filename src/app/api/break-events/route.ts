import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { nowIso } from "@/lib/firebase/db";
import { requireApiRole } from "@/lib/api-auth";
import type { BreakEvent, Job } from "@/lib/types";

// Force dynamic rendering - Firebase Admin requires runtime credentials
export const dynamic = "force-dynamic";

const payloadSchema = z.object({
  job_id: z.string().min(1),
  type: z.enum(["BREAK_START", "BREAK_END"]),
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
  const job = { ...(jobDoc.data() as Job), id: jobDoc.id } as Job;
  if (profile.role === "CLEANER" && job.assigned_cleaner_id !== profile.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = adminDb.collection("break_events").doc().id;
  const record: BreakEvent = {
    id,
    cleaner_id: job.assigned_cleaner_id ?? profile.id,
    job_id: parsed.data.job_id,
    type: parsed.data.type,
    at: parsed.data.at ?? new Date().toISOString(),
    lat: parsed.data.lat,
    lng: parsed.data.lng,
    accuracy_meters: parsed.data.accuracy_meters ?? null,
    source: parsed.data.source ?? "ONLINE",
    created_at: nowIso(),
  };

  await adminDb.collection("break_events").doc(id).set(record);
  return NextResponse.json(record, { status: 200 });
}
