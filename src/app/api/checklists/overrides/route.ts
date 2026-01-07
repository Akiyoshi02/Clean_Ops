import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { nowIso } from "@/lib/firebase/db";
import { requireApiRole } from "@/lib/api-auth";

// Force dynamic rendering - Firebase Admin requires runtime credentials
export const dynamic = "force-dynamic";

const payloadSchema = z.object({
  site_id: z.string().min(1),
  template_id: z.string().min(1),
  overrides_json: z.record(z.string(), z.unknown()),
});

export async function POST(request: Request) {
  const { response } = await requireApiRole(["HR", "SUPERVISOR"]);
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const id = `${parsed.data.site_id}_${parsed.data.template_id}`;
  const record = {
    ...parsed.data,
    updated_at: nowIso(),
  };

  await adminDb.collection("site_checklist_overrides").doc(id).set(record, {
    merge: true,
  });

  return NextResponse.json({ id, ...record }, { status: 200 });
}
