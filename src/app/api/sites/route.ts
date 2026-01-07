import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";

// Force dynamic rendering - Firebase Admin requires runtime credentials
export const dynamic = "force-dynamic";
import { nowIso } from "@/lib/firebase/db";
import { requireApiRole } from "@/lib/api-auth";
import type { Site } from "@/lib/types";

const payloadSchema = z.object({
  client_id: z.string().min(1),
  name: z.string().min(2),
  address_line1: z.string().optional().nullable(),
  address_line2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  postal_code: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  lat: z.number(),
  lng: z.number(),
  access_notes: z.string().optional().nullable(),
  geofence_radius_meters: z.number().optional(),
  default_checklist_template_id: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  const { response, profile } = await requireApiRole(["HR", "SUPERVISOR"]);
  if (response || !profile) return response;

  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const id = adminDb.collection("sites").doc().id;
  const now = nowIso();
  const record: Site = {
    id,
    client_id: parsed.data.client_id,
    name: parsed.data.name,
    address_line1: parsed.data.address_line1 ?? null,
    address_line2: parsed.data.address_line2 ?? null,
    city: parsed.data.city ?? null,
    state: parsed.data.state ?? null,
    postal_code: parsed.data.postal_code ?? null,
    country: parsed.data.country ?? "US",
    lat: parsed.data.lat,
    lng: parsed.data.lng,
    access_notes: parsed.data.access_notes ?? null,
    geofence_radius_meters: parsed.data.geofence_radius_meters ?? 150,
    default_checklist_template_id:
      parsed.data.default_checklist_template_id ?? null,
    created_by: profile.id,
    created_at: now,
    updated_at: now,
  };

  await adminDb.collection("sites").doc(id).set(record);
  return NextResponse.json(record, { status: 200 });
}
