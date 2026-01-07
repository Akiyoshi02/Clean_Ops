import { NextResponse } from "next/server";
import { z } from "zod";
import { adminDb } from "@/lib/firebase/admin";
import { nowIso } from "@/lib/firebase/db";
import { requireApiRole } from "@/lib/api-auth";
import type { TimesheetPeriod } from "@/lib/types";

const payloadSchema = z.object({
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  status: z.enum(["OPEN", "SUBMITTED", "APPROVED"]).optional(),
});

export async function POST(request: Request) {
  const { response, profile } = await requireApiRole(["HR"]);
  if (response || !profile) return response;

  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const id = adminDb.collection("timesheet_periods").doc().id;
  const now = nowIso();
  const record: TimesheetPeriod = {
    id,
    start_date: parsed.data.start_date,
    end_date: parsed.data.end_date,
    status: parsed.data.status ?? "OPEN",
    created_by: profile.id,
    created_at: now,
    updated_at: now,
  };

  await adminDb.collection("timesheet_periods").doc(id).set(record);
  return NextResponse.json(record, { status: 200 });
}
