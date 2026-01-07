import { adminDb } from "@/lib/firebase/admin";
import { mapDocs, nowIso } from "@/lib/firebase/db";
import type {
  ChecklistTemplate,
  ChecklistTemplateItem,
  Site,
} from "@/lib/types";

export async function listChecklistTemplates() {
  const snapshot = await adminDb
    .collection("checklist_templates")
    .orderBy("name")
    .get();
  return mapDocs<ChecklistTemplate>(snapshot);
}

export async function createChecklistTemplate(payload: {
  name: string;
  created_by?: string | null;
}) {
  const id = adminDb.collection("checklist_templates").doc().id;
  const now = nowIso();
  const record: ChecklistTemplate = {
    id,
    name: payload.name,
    created_by: payload.created_by ?? null,
    created_at: now,
    updated_at: now,
  };
  await adminDb.collection("checklist_templates").doc(id).set(record);
  return record;
}

export async function updateChecklistTemplate(id: string, payload: { name: string }) {
  const now = nowIso();
  await adminDb
    .collection("checklist_templates")
    .doc(id)
    .set({ name: payload.name, updated_at: now }, { merge: true });
  const doc = await adminDb.collection("checklist_templates").doc(id).get();
  return doc.exists
    ? ({ id: doc.id, ...(doc.data() as ChecklistTemplate) } as ChecklistTemplate)
    : null;
}

export async function listTemplateItems(templateId?: string) {
  let query: FirebaseFirestore.Query = adminDb.collection(
    "checklist_template_items",
  );
  if (templateId) {
    query = query.where("template_id", "==", templateId);
  }
  const snapshot = await query.get();
  const items = mapDocs<ChecklistTemplateItem>(snapshot);
  return items.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

export async function createTemplateItem(payload: {
  template_id: string;
  title: string;
  required_photo?: boolean;
  sort_order?: number;
}) {
  const id = adminDb.collection("checklist_template_items").doc().id;
  const record: ChecklistTemplateItem = {
    id,
    template_id: payload.template_id,
    title: payload.title,
    required_photo: payload.required_photo ?? false,
    sort_order: payload.sort_order ?? 0,
  };
  await adminDb.collection("checklist_template_items").doc(id).set(record);
  return record;
}

export async function updateTemplateItem(
  id: string,
  payload: Partial<{ title: string; required_photo: boolean; sort_order: number }>,
) {
  await adminDb
    .collection("checklist_template_items")
    .doc(id)
    .set(payload, { merge: true });
  const doc = await adminDb.collection("checklist_template_items").doc(id).get();
  return doc.exists
    ? ({ id: doc.id, ...(doc.data() as ChecklistTemplateItem) } as ChecklistTemplateItem)
    : null;
}

export async function deleteTemplateItem(id: string) {
  await adminDb.collection("checklist_template_items").doc(id).delete();
  return { id };
}

export async function listSitesForOverrides() {
  const snapshot = await adminDb.collection("sites").orderBy("name").get();
  return mapDocs<Site>(snapshot);
}

export async function getSiteOverride(siteId: string) {
  const snapshot = await adminDb
    .collection("site_checklist_overrides")
    .where("site_id", "==", siteId)
    .limit(1)
    .get();
  const doc = snapshot.docs[0];
  if (!doc) return null;
  return { id: doc.id, ...(doc.data() as Record<string, unknown>) };
}

export async function upsertSiteOverride(payload: {
  site_id: string;
  template_id: string;
  overrides_json: Record<string, unknown>;
}) {
  const id = `${payload.site_id}_${payload.template_id}`;
  const record = {
    ...payload,
    updated_at: nowIso(),
  };
  await adminDb.collection("site_checklist_overrides").doc(id).set(record, { merge: true });
  return { id, ...record };
}
