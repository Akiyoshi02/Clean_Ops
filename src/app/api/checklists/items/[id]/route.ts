import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { requireApiRole } from "@/lib/api-auth";
import type { ChecklistTemplateItem } from "@/lib/types";

// Force dynamic rendering - Firebase Admin requires runtime credentials
export const dynamic = "force-dynamic";

const payloadSchema = z.object({
  title: z.string().optional(),
  required_photo: z.boolean().optional(),
  sort_order: z.number().optional(),
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

  await adminDb
    .collection("checklist_template_items")
    .doc(id)
    .set(parsed.data, { merge: true });

  const doc = await adminDb.collection("checklist_template_items").doc(id).get();
  if (!doc.exists) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json(
    { ...(doc.data() as ChecklistTemplateItem), id: doc.id },
    { status: 200 },
  );
}
