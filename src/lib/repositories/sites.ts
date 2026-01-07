import { adminDb } from "@/lib/firebase/admin";
import { mapDocs, nowIso } from "@/lib/firebase/db";
import type { Site } from "@/lib/types";

export async function listSites() {
  const snapshot = await adminDb.collection("sites").orderBy("name").get();
  return mapDocs<Site>(snapshot);
}

export async function getSitesByIds(ids: string[]) {
  if (ids.length === 0) {
    return [];
  }
  const refs = ids.map((id) => adminDb.collection("sites").doc(id));
  const docs = await adminDb.getAll(...refs);
  return docs
    .filter((doc) => doc.exists)
    .map((doc) => ({ id: doc.id, ...(doc.data() as Site) } as Site));
}

export async function createSite(payload: {
  client_id: string;
  name: string;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string;
  lat: number;
  lng: number;
  access_notes?: string | null;
  geofence_radius_meters?: number;
  default_checklist_template_id?: string | null;
  created_by?: string | null;
}) {
  const id = adminDb.collection("sites").doc().id;
  const now = nowIso();
  const record: Site = {
    id,
    client_id: payload.client_id,
    name: payload.name,
    address_line1: payload.address_line1 ?? null,
    address_line2: payload.address_line2 ?? null,
    city: payload.city ?? null,
    state: payload.state ?? null,
    postal_code: payload.postal_code ?? null,
    country: payload.country ?? "US",
    lat: payload.lat,
    lng: payload.lng,
    access_notes: payload.access_notes ?? null,
    geofence_radius_meters: payload.geofence_radius_meters ?? 150,
    default_checklist_template_id: payload.default_checklist_template_id ?? null,
    created_by: payload.created_by ?? null,
    created_at: now,
    updated_at: now,
  };
  await adminDb.collection("sites").doc(id).set(record);
  return record;
}

export async function updateSite(
  id: string,
  payload: Partial<{
    client_id: string;
    name: string;
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string;
    lat: number;
    lng: number;
    access_notes: string | null;
    geofence_radius_meters: number;
    default_checklist_template_id: string | null;
  }>,
) {
  const now = nowIso();
  await adminDb.collection("sites").doc(id).set({ ...payload, updated_at: now }, { merge: true });
  const doc = await adminDb.collection("sites").doc(id).get();
  return doc.exists ? ({ id: doc.id, ...(doc.data() as Site) } as Site) : null;
}

export async function deleteSite(id: string) {
  await adminDb.collection("sites").doc(id).delete();
  return { id };
}
