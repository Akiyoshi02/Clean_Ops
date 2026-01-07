import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { nowIso } from "@/lib/firebase/db";
import { requireApiRole } from "@/lib/api-auth";
import type { Site } from "@/lib/types";

// Force dynamic rendering - Firebase Admin requires runtime credentials
export const dynamic = "force-dynamic";

const payloadSchema = z.object({
  client_id: z.string().optional(),
  name: z.string().optional(),
  address_line1: z.string().optional().nullable(),
  address_line2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  postal_code: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  access_notes: z.string().optional().nullable(),
  geofence_radius_meters: z.number().optional(),
  default_checklist_template_id: z.string().optional().nullable(),
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
  await adminDb
    .collection("sites")
    .doc(id)
    .set({ ...parsed.data, updated_at: now }, { merge: true });

  const doc = await adminDb.collection("sites").doc(id).get();
  if (!doc.exists) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }
  return NextResponse.json(
    { ...(doc.data() as Site), id: doc.id },
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
  await adminDb.collection("sites").doc(id).delete();
  return NextResponse.json({ id }, { status: 200 });
}
