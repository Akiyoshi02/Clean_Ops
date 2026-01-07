import type { QuerySnapshot, QueryDocumentSnapshot } from "firebase-admin/firestore";

export function nowIso() {
  return new Date().toISOString();
}

export function withId<T>(doc: QueryDocumentSnapshot): T & { id: string } {
  return { id: doc.id, ...(doc.data() as T) };
}

export function mapDocs<T>(snapshot: QuerySnapshot) {
  return snapshot.docs.map((doc) => withId<T>(doc));
}
