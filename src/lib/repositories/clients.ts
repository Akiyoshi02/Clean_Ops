import { adminDb } from "@/lib/firebase/admin";
import { mapDocs, nowIso } from "@/lib/firebase/db";
import type { Client } from "@/lib/types";

export async function listClients() {
  const snapshot = await adminDb.collection("clients").orderBy("name").get();
  return mapDocs<Client>(snapshot);
}

export async function getClientsByIds(ids: string[]) {
  if (ids.length === 0) {
    return [];
  }
  const refs = ids.map((id) => adminDb.collection("clients").doc(id));
  const docs = await adminDb.getAll(...refs);
  return docs
    .filter((doc) => doc.exists)
    .map((doc) => ({ id: doc.id, ...(doc.data() as Client) } as Client));
}

export async function createClient(payload: {
  name: string;
  billing_email?: string | null;
  notes?: string | null;
  created_by?: string | null;
}) {
  const id = adminDb.collection("clients").doc().id;
  const now = nowIso();
  const record: Client = {
    id,
    name: payload.name,
    billing_email: payload.billing_email ?? null,
    notes: payload.notes ?? null,
    created_by: payload.created_by ?? null,
    created_at: now,
    updated_at: now,
  };
  await adminDb.collection("clients").doc(id).set(record);
  return record;
}

export async function updateClient(
  id: string,
  payload: { name?: string; billing_email?: string | null; notes?: string | null },
) {
  const now = nowIso();
  await adminDb
    .collection("clients")
    .doc(id)
    .set({ ...payload, updated_at: now }, { merge: true });
  const doc = await adminDb.collection("clients").doc(id).get();
  return doc.exists ? ({ id: doc.id, ...(doc.data() as Client) } as Client) : null;
}

export async function deleteClient(id: string) {
  await adminDb.collection("clients").doc(id).delete();
  return { id };
}
