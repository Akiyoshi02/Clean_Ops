import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { mapDocs, nowIso } from "@/lib/firebase/db";
import { requireApiRole } from "@/lib/api-auth";
import type { Job, ChecklistTemplateItem } from "@/lib/types";

// Force dynamic rendering - Firebase Admin requires runtime credentials
export const dynamic = "force-dynamic";

const payloadSchema = z.object({
  siteId: z.string().min(1),
  checklistTemplateId: z.string().min(1),
  date: z.string().min(1),
  startTime: z.string().min(1),
  durationMins: z.number().int().min(15),
  assignedCleanerId: z.string().optional().nullable(),
  jobType: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
});

function parseTime(value: string) {
  const [hours, minutes] = value.split(":").map((part) => Number(part));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }
  return { hours, minutes };
}

export async function POST(request: Request) {
  const { response, profile } = await requireApiRole(["HR", "SUPERVISOR"]);
  if (response || !profile) return response;

  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const timeParts = parseTime(parsed.data.startTime);
  if (!timeParts) {
    return NextResponse.json({ error: "Invalid startTime" }, { status: 400 });
  }

  const startDate = new Date(`${parsed.data.date}T00:00:00`);
  if (Number.isNaN(startDate.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  startDate.setHours(timeParts.hours, timeParts.minutes, 0, 0);
  const endDate = new Date(
    startDate.getTime() + parsed.data.durationMins * 60 * 1000,
  );

  const jobId = adminDb.collection("jobs").doc().id;
  const now = nowIso();
  const job: Job = {
    id: jobId,
    site_id: parsed.data.siteId,
    checklist_template_id: parsed.data.checklistTemplateId,
    scheduled_start: startDate.toISOString(),
    scheduled_end: endDate.toISOString(),
    expected_duration_mins: parsed.data.durationMins,
    assigned_cleaner_id: parsed.data.assignedCleanerId ?? null,
    status: "PUBLISHED",
    job_type: parsed.data.jobType ?? null,
    instructions: parsed.data.instructions ?? null,
    rework_note: null,
    rework_note_by: null,
    rework_note_at: null,
    created_by: profile.id,
    created_at: now,
    updated_at: now,
  };

  await adminDb.collection("jobs").doc(jobId).set(job);

  const itemsSnap = await adminDb
    .collection("checklist_template_items")
    .where("template_id", "==", parsed.data.checklistTemplateId)
    .get();
  const items = mapDocs<ChecklistTemplateItem>(itemsSnap).sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
  if (items.length > 0) {
    const batch = adminDb.batch();
    items.forEach((item) => {
      const taskRef = adminDb.collection("job_tasks").doc();
      batch.set(taskRef, {
        id: taskRef.id,
        job_id: jobId,
        title: item.title,
        required_photo: item.required_photo,
        sort_order: item.sort_order ?? 0,
        completed_at: null,
        completed_by: null,
        notes: null,
      });
    });
    await batch.commit();
  }

  if (job.assigned_cleaner_id) {
    const noteRef = adminDb.collection("notifications").doc();
    await noteRef.set({
      id: noteRef.id,
      user_id: job.assigned_cleaner_id,
      type: "JOB_ASSIGNED",
      title: "New job assigned",
      body: "A new job was added to your schedule.",
      link_url: "/app/cleaner/today",
      created_at: nowIso(),
      read_at: null,
    });
  }

  return NextResponse.json(job, { status: 200 });
}
