import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { requireApiRole } from "@/lib/api-auth";
import type { ChecklistTemplateItem } from "@/lib/types";

const payloadSchema = z.object({
  template_id: z.string().min(1),
  title: z.string().min(2),
  required_photo: z.boolean().optional(),
  sort_order: z.number().optional(),
});

export async function POST(request: Request) {
  const { response } = await requireApiRole(["HR", "SUPERVISOR"]);
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const id = adminDb.collection("checklist_template_items").doc().id;
  const record: ChecklistTemplateItem = {
    id,
    template_id: parsed.data.template_id,
    title: parsed.data.title,
    required_photo: parsed.data.required_photo ?? false,
    sort_order: parsed.data.sort_order ?? 0,
  };

  await adminDb.collection("checklist_template_items").doc(id).set(record);
  return NextResponse.json(record, { status: 200 });
}
