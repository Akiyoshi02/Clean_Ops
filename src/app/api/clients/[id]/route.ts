import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { nowIso } from "@/lib/firebase/db";
import { requireApiRole } from "@/lib/api-auth";
import type { Client } from "@/lib/types";

const payloadSchema = z.object({
  name: z.string().min(2),
  billing_email: z.string().email().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireApiRole(["HR", "SUPERVISOR"]);
  if (response) return response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const now = nowIso();
  await adminDb.collection("clients").doc(id).set(
    {
      name: parsed.data.name,
      billing_email: parsed.data.billing_email ?? null,
      notes: parsed.data.notes ?? null,
      updated_at: now,
    },
    { merge: true },
  );

  const doc = await adminDb.collection("clients").doc(id).get();
  if (!doc.exists) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }
  return NextResponse.json(
    { id: doc.id, ...(doc.data() as Client) },
    { status: 200 },
  );
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireApiRole(["HR", "SUPERVISOR"]);
  if (response) return response;

  const { id } = await params;
  await adminDb.collection("clients").doc(id).delete();
  return NextResponse.json({ id }, { status: 200 });
}
