import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";

// Force dynamic rendering - Firebase Admin requires runtime credentials
export const dynamic = "force-dynamic";
import { nowIso } from "@/lib/firebase/db";
import { requireApiRole } from "@/lib/api-auth";
import type { Client } from "@/lib/types";

const payloadSchema = z.object({
  name: z.string().min(2),
  billing_email: z.string().email().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  const { response, profile } = await requireApiRole(["HR", "SUPERVISOR"]);
  if (response || !profile) return response;

  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const id = adminDb.collection("clients").doc().id;
  const now = nowIso();
  const record: Client = {
    id,
    name: parsed.data.name,
    billing_email: parsed.data.billing_email ?? null,
    notes: parsed.data.notes ?? null,
    created_by: profile.id,
    created_at: now,
    updated_at: now,
  };

  await adminDb.collection("clients").doc(id).set(record);
  return NextResponse.json(record, { status: 200 });
}
