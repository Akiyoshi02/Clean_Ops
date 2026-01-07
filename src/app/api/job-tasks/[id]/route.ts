import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { requireApiRole } from "@/lib/api-auth";
import type { Job, JobTask } from "@/lib/types";

const payloadSchema = z.object({
  completed_at: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
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

  const taskDoc = await adminDb.collection("job_tasks").doc(id).get();
  if (!taskDoc.exists) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  const task = { id: taskDoc.id, ...(taskDoc.data() as JobTask) } as JobTask;

  if (profile.role === "CLEANER") {
    const jobDoc = await adminDb.collection("jobs").doc(task.job_id).get();
    const job = jobDoc.exists
      ? ({ id: jobDoc.id, ...(jobDoc.data() as Job) } as Job)
      : null;
    if (!job || job.assigned_cleaner_id !== profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.completed_at !== undefined) {
    updates.completed_at = parsed.data.completed_at;
    updates.completed_by = parsed.data.completed_at ? profile.id : null;
  }
  if (parsed.data.notes !== undefined) {
    updates.notes = parsed.data.notes ?? null;
  }

  await adminDb.collection("job_tasks").doc(id).set(updates, { merge: true });
  const doc = await adminDb.collection("job_tasks").doc(id).get();
  return NextResponse.json(
    { id: doc.id, ...(doc.data() as JobTask) },
    { status: 200 },
  );
}
