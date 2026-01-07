import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { nowIso } from "@/lib/firebase/db";
import { requireApiRole } from "@/lib/api-auth";
import type { TimesheetPeriod } from "@/lib/types";

const payloadSchema = z.object({
  status: z.enum(["OPEN", "SUBMITTED", "APPROVED"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireApiRole(["HR"]);
  if (response) return response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const now = nowIso();
  await adminDb.collection("timesheet_periods").doc(id).set(
    {
      status: parsed.data.status,
      updated_at: now,
    },
    { merge: true },
  );

  const doc = await adminDb.collection("timesheet_periods").doc(id).get();
  if (!doc.exists) {
    return NextResponse.json({ error: "Period not found" }, { status: 404 });
  }

  return NextResponse.json(
    { id: doc.id, ...(doc.data() as TimesheetPeriod) },
    { status: 200 },
  );
}
