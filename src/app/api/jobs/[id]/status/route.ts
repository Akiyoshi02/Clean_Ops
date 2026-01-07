import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { nowIso } from "@/lib/firebase/db";
import { requireApiRole } from "@/lib/api-auth";
import { isValidStatusTransition } from "@/lib/status";
import type { Job, JobStatusEvent } from "@/lib/types";

// Force dynamic rendering - Firebase Admin requires runtime credentials
export const dynamic = "force-dynamic";

const payloadSchema = z.object({
  status: z.enum([
    "DRAFT",
    "PUBLISHED",
    "IN_PROGRESS",
    "COMPLETED_PENDING_REVIEW",
    "APPROVED",
    "REWORK_REQUIRED",
    "CANCELLED",
  ]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response, profile } = await requireApiRole([
    "HR",
    "SUPERVISOR",
    "CLEANER",
  ]);
  if (response || !profile) return response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const jobDoc = await adminDb.collection("jobs").doc(id).get();
  if (!jobDoc.exists) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  const job = { ...(jobDoc.data() as Job), id: jobDoc.id } as Job;

  if (profile.role === "CLEANER" && job.assigned_cleaner_id !== profile.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isValidStatusTransition(job.status, parsed.data.status)) {
    return NextResponse.json({ error: "Invalid status transition" }, { status: 400 });
  }

  if (profile.role === "CLEANER") {
    const allowed = [
      [job.status, parsed.data.status],
    ].some(([from, to]) => {
      if (from === to) return true;
      if (from === "PUBLISHED" && to === "IN_PROGRESS") return true;
      if (from === "IN_PROGRESS" && to === "COMPLETED_PENDING_REVIEW") return true;
      if (from === "REWORK_REQUIRED" && to === "IN_PROGRESS") return true;
      return false;
    });
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const now = nowIso();
  await adminDb.collection("jobs").doc(id).set(
    {
      status: parsed.data.status,
      updated_at: now,
    },
    { merge: true },
  );

  if (job.status !== parsed.data.status) {
    const eventId = adminDb.collection("job_status_events").doc().id;
    const event: JobStatusEvent = {
      id: eventId,
      job_id: job.id,
      old_status: job.status,
      new_status: parsed.data.status,
      changed_by: profile.id,
      note: null,
      created_at: nowIso(),
    };
    await adminDb.collection("job_status_events").doc(eventId).set(event);
  }

  const updatedDoc = await adminDb.collection("jobs").doc(id).get();
  return NextResponse.json(
    { ...(updatedDoc.data() as Job), id: updatedDoc.id },
    { status: 200 },
  );
}
