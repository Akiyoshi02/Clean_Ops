import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { nowIso } from "@/lib/firebase/db";
import { requireApiRole } from "@/lib/api-auth";
import type { ChecklistTemplate } from "@/lib/types";

const payloadSchema = z.object({
  name: z.string().min(2),
});

export async function POST(request: Request) {
  const { response, profile } = await requireApiRole(["HR", "SUPERVISOR"]);
  if (response || !profile) return response;

  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const id = adminDb.collection("checklist_templates").doc().id;
  const now = nowIso();
  const record: ChecklistTemplate = {
    id,
    name: parsed.data.name,
    created_by: profile.id,
    created_at: now,
    updated_at: now,
  };

  await adminDb.collection("checklist_templates").doc(id).set(record);
  return NextResponse.json(record, { status: 200 });
}
