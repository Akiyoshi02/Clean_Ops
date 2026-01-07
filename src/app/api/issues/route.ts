import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { nowIso } from "@/lib/firebase/db";
import { requireApiRole } from "@/lib/api-auth";
import type { Issue, Job } from "@/lib/types";

// Force dynamic rendering - Firebase Admin requires runtime credentials
export const dynamic = "force-dynamic";

const payloadSchema = z.object({
  job_id: z.string().min(1),
  category: z.enum(["ACCESS", "SAFETY", "SUPPLIES", "CLIENT_REQUEST", "OTHER"]),
  severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  message: z.string().min(1),
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

  const id = adminDb.collection("issues").doc().id;
  const now = nowIso();
  const record: Issue = {
    id,
    job_id: parsed.data.job_id,
    created_by: profile.id,
    category: parsed.data.category,
    severity: parsed.data.severity,
    message: parsed.data.message,
    status: "OPEN",
    created_at: now,
    updated_at: now,
  };

  await adminDb.collection("issues").doc(id).set(record);
  return NextResponse.json(record, { status: 200 });
}
