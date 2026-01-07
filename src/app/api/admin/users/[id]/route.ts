import { NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { nowIso } from "@/lib/firebase/db";
import { requireApiRole } from "@/lib/api-auth";
import type { Profile } from "@/lib/types";

const payloadSchema = z.object({
  is_active: z.boolean(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireApiRole(["HR"]);
  if (response) return response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const now = nowIso();
  await adminDb
    .collection("profiles")
    .doc(id)
    .set({ is_active: parsed.data.is_active, updated_at: now }, { merge: true });

  try {
    await adminAuth.updateUser(id, { disabled: !parsed.data.is_active });
  } catch {
    // Ignore auth update failures to keep profile state consistent.
  }

  const doc = await adminDb.collection("profiles").doc(id).get();
  if (!doc.exists) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json(
    { id: doc.id, ...(doc.data() as Profile) },
    { status: 200 },
  );
}
