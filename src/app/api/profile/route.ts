import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { nowIso } from "@/lib/firebase/db";
import { requireApiRole } from "@/lib/api-auth";
import type { Profile } from "@/lib/types";

const payloadSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional().nullable(),
});

export async function PATCH(request: Request) {
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

  const now = nowIso();
  await adminDb.collection("profiles").doc(profile.id).set(
    {
      name: parsed.data.name,
      phone: parsed.data.phone ?? null,
      updated_at: now,
    },
    { merge: true },
  );

  const doc = await adminDb.collection("profiles").doc(profile.id).get();
  return NextResponse.json(
    { ...(doc.data() as Profile), id: doc.id },
    { status: 200 },
  );
}
