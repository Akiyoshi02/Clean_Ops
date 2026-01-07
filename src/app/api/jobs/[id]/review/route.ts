import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { nowIso, withId } from "@/lib/firebase/db";
import { requireApiRole } from "@/lib/api-auth";
import { isValidStatusTransition } from "@/lib/status";
import {
  computeTimesheetFromEvents,
  getOrCreateTimesheetPeriod,
  upsertTimesheetEntry,
} from "@/lib/timesheets";
import type { BreakEvent, Job, JobClockEvent, JobStatusEvent } from "@/lib/types";

const payloadSchema = z.object({
  action: z.enum(["APPROVE", "REWORK"]),
  rework_note: z.string().optional().nullable(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response, profile } = await requireApiRole(["HR", "SUPERVISOR"]);
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

  const nextStatus =
    parsed.data.action === "APPROVE" ? "APPROVED" : "REWORK_REQUIRED";

  if (!isValidStatusTransition(job.status, nextStatus)) {
    return NextResponse.json({ error: "Invalid status transition" }, { status: 400 });
  }

  if (parsed.data.action === "REWORK" && !parsed.data.rework_note?.trim()) {
    return NextResponse.json({ error: "Rework note required" }, { status: 400 });
  }

  const now = nowIso();
  const updates: Partial<Job> = {
    status: nextStatus,
    updated_at: now,
  };

  if (parsed.data.action === "REWORK") {
    updates.rework_note = parsed.data.rework_note ?? null;
    updates.rework_note_by = profile.id;
    updates.rework_note_at = now;
  } else {
    updates.rework_note = null;
    updates.rework_note_by = null;
    updates.rework_note_at = null;
  }

  await adminDb.collection("jobs").doc(id).set(updates, { merge: true });

  const eventId = adminDb.collection("job_status_events").doc().id;
  const event: JobStatusEvent = {
    id: eventId,
    job_id: job.id,
    old_status: job.status,
    new_status: nextStatus,
    changed_by: profile.id,
    note: parsed.data.action === "REWORK" ? parsed.data.rework_note ?? null : null,
    created_at: nowIso(),
  };
  await adminDb.collection("job_status_events").doc(eventId).set(event);

  if (parsed.data.action === "APPROVE" && job.assigned_cleaner_id) {
    const [clockSnap, breakSnap] = await Promise.all([
      adminDb.collection("job_clock_events").where("job_id", "==", job.id).get(),
      adminDb.collection("break_events").where("job_id", "==", job.id).get(),
    ]);
    const clockEvents = clockSnap.docs.map((doc) => withId<JobClockEvent>(doc));
    const breakEvents = breakSnap.docs.map((doc) => withId<BreakEvent>(doc));
    const summary = computeTimesheetFromEvents(clockEvents, breakEvents);
    const period = await getOrCreateTimesheetPeriod(job.scheduled_start);
    await upsertTimesheetEntry({
      cleaner_id: job.assigned_cleaner_id,
      job_id: job.id,
      period_id: period?.id ?? null,
      clock_in_at: summary.clock_in_at,
      clock_out_at: summary.clock_out_at,
      break_minutes: summary.break_minutes,
      minutes_worked: summary.minutes_worked,
      exceptions_json: summary.exceptions_json,
    });
  }

  if (parsed.data.action === "REWORK" && job.assigned_cleaner_id) {
    const noteRef = adminDb.collection("notifications").doc();
    await noteRef.set({
      id: noteRef.id,
      user_id: job.assigned_cleaner_id,
      type: "JOB_STATUS",
      title: "Job requires rework",
      body: parsed.data.rework_note ?? "Supervisor requested rework.",
      link_url: `/app/cleaner/jobs/${job.id}`,
      created_at: nowIso(),
      read_at: null,
    });
  }

  const updatedDoc = await adminDb.collection("jobs").doc(id).get();
  return NextResponse.json(
    { ...(updatedDoc.data() as Job), id: updatedDoc.id },
    { status: 200 },
  );
}
