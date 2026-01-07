import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { mapDocs, nowIso } from "@/lib/firebase/db";
import { requireApiRole } from "@/lib/api-auth";
import type { Job } from "@/lib/types";

const payloadSchema = z.object({
  siteId: z.string().min(1),
  checklistTemplateId: z.string().min(1),
  startDate: z.string().min(1),
  weeks: z.number().int().min(1).max(12).default(4),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).min(1),
  startTime: z.string().min(1),
  durationMins: z.number().int().min(15),
  assignedCleanerId: z.string().nullable().optional(),
  jobType: z.string().nullable().optional(),
  instructions: z.string().nullable().optional(),
  status: z.string().optional(),
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

  const start = new Date(`${parsed.data.startDate}T00:00:00`);
  if (Number.isNaN(start.getTime())) {
    return NextResponse.json({ error: "Invalid startDate" }, { status: 400 });
  }

  const occurrences: Array<{ start: Date; end: Date }> = [];
  const totalDays = parsed.data.weeks * 7;
  for (let i = 0; i < totalDays; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    if (!parsed.data.daysOfWeek.includes(date.getDay())) {
      continue;
    }
    const scheduledStart = new Date(date);
    scheduledStart.setHours(timeParts.hours, timeParts.minutes, 0, 0);
    const scheduledEnd = new Date(
      scheduledStart.getTime() + parsed.data.durationMins * 60 * 1000,
    );
    occurrences.push({ start: scheduledStart, end: scheduledEnd });
  }

  if (occurrences.length === 0) {
    return NextResponse.json({ error: "No occurrences generated" }, { status: 400 });
  }

  const itemsSnap = await adminDb
    .collection("checklist_template_items")
    .where("template_id", "==", parsed.data.checklistTemplateId)
    .get();
  const templateItems = mapDocs(itemsSnap).sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
  if (templateItems.length === 0) {
    return NextResponse.json({ error: "Missing template items" }, { status: 400 });
  }

  const now = nowIso();
  const jobs: Job[] = occurrences.map((occurrence) => {
    const id = adminDb.collection("jobs").doc().id;
    return {
      id,
      site_id: parsed.data.siteId,
      checklist_template_id: parsed.data.checklistTemplateId,
      scheduled_start: occurrence.start.toISOString(),
      scheduled_end: occurrence.end.toISOString(),
      expected_duration_mins: parsed.data.durationMins,
      assigned_cleaner_id: parsed.data.assignedCleanerId ?? null,
      status: (parsed.data.status as Job["status"]) ?? "PUBLISHED",
      job_type: parsed.data.jobType ?? null,
      instructions: parsed.data.instructions ?? null,
      rework_note: null,
      rework_note_by: null,
      rework_note_at: null,
      created_by: profile.id,
      created_at: now,
      updated_at: now,
    };
  });

  const jobBatch = adminDb.batch();
  jobs.forEach((job) => {
    jobBatch.set(adminDb.collection("jobs").doc(job.id), job);
  });
  await jobBatch.commit();

  const taskBatch = adminDb.batch();
  jobs.forEach((job) => {
    templateItems.forEach((item) => {
      const taskRef = adminDb.collection("job_tasks").doc();
      taskBatch.set(taskRef, {
        id: taskRef.id,
        job_id: job.id,
        title: item.title,
        required_photo: item.required_photo,
        sort_order: item.sort_order ?? 0,
        completed_at: null,
        completed_by: null,
        notes: null,
      });
    });
  });
  await taskBatch.commit();

  const notifications = jobs.filter((job) => job.assigned_cleaner_id);
  if (notifications.length > 0) {
    const noteBatch = adminDb.batch();
    notifications.forEach((job) => {
      const noteRef = adminDb.collection("notifications").doc();
      noteBatch.set(noteRef, {
        id: noteRef.id,
        user_id: job.assigned_cleaner_id,
        type: "JOB_ASSIGNED",
        title: "New recurring job assigned",
        body: "A new recurring job was added to your schedule.",
        link_url: "/app/cleaner/today",
        created_at: nowIso(),
        read_at: null,
      });
    });
    await noteBatch.commit();
  }

  return NextResponse.json({ count: jobs.length }, { status: 200 });
}
