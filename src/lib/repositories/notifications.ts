import { adminDb } from "@/lib/firebase/admin";
import { mapDocs, nowIso } from "@/lib/firebase/db";
import type { Notification } from "@/lib/types";

export async function listNotifications(userId: string) {
  const snapshot = await adminDb
    .collection("notifications")
    .where("user_id", "==", userId)
    .get();
  const notes = mapDocs<Notification>(snapshot);
  return notes
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 20);
}

export async function markNotificationRead(id: string) {
  const now = nowIso();
  await adminDb.collection("notifications").doc(id).set({ read_at: now }, { merge: true });
  const doc = await adminDb.collection("notifications").doc(id).get();
  return doc.exists ? ({ id: doc.id, ...(doc.data() as Notification) } as Notification) : null;
}
