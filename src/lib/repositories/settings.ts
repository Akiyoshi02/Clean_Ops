import { adminDb } from "@/lib/firebase/admin";

export async function getSettings(keys: string[]) {
  if (keys.length === 0) {
    return new Map<string, unknown>();
  }
  const refs = keys.map((key) => adminDb.collection("settings").doc(key));
  const docs = await adminDb.getAll(...refs);
  const map = new Map<string, unknown>();
  for (const doc of docs) {
    if (doc.exists) {
      map.set(doc.id, (doc.data() as { value?: unknown }).value);
    }
  }
  return map;
}
