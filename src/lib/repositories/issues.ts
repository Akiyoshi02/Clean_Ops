import { adminDb } from "@/lib/firebase/admin";
import { mapDocs, nowIso } from "@/lib/firebase/db";
import type { Issue } from "@/lib/types";

export async function listIssuesForCleaner(cleanerId: string) {
  const snapshot = await adminDb
    .collection("issues")
    .where("created_by", "==", cleanerId)
    .get();
  const issues = mapDocs<Issue>(snapshot);
  return issues.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export async function listIssues() {
  const snapshot = await adminDb.collection("issues").orderBy("created_at", "desc").get();
  return mapDocs<Issue>(snapshot);
}

export async function createIssue(payload: {
  job_id: string;
  created_by: string;
  category: string;
  severity: string;
  message: string;
}) {
  const id = adminDb.collection("issues").doc().id;
  const now = nowIso();
  const record: Issue = {
    id,
    job_id: payload.job_id,
    created_by: payload.created_by,
    category: payload.category as Issue["category"],
    severity: payload.severity as Issue["severity"],
    message: payload.message,
    status: "OPEN",
    created_at: now,
    updated_at: now,
  };
  await adminDb.collection("issues").doc(id).set(record);
  return record;
}

export async function updateIssueStatus(id: string, status: Issue["status"]) {
  const now = nowIso();
  await adminDb.collection("issues").doc(id).set({ status, updated_at: now }, { merge: true });
  const doc = await adminDb.collection("issues").doc(id).get();
  return doc.exists ? ({ id: doc.id, ...(doc.data() as Issue) } as Issue) : null;
}
