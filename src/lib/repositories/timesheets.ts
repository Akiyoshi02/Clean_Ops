import { adminDb } from "@/lib/firebase/admin";
import { mapDocs, nowIso } from "@/lib/firebase/db";
import type { TimesheetEntry, TimesheetPeriod } from "@/lib/types";

export async function listTimesheetPeriods() {
  const snapshot = await adminDb
    .collection("timesheet_periods")
    .orderBy("start_date", "desc")
    .get();
  return mapDocs<TimesheetPeriod>(snapshot);
}

export async function createTimesheetPeriod(payload: {
  start_date: string;
  end_date: string;
  status?: string;
  created_by?: string | null;
}) {
  const id = adminDb.collection("timesheet_periods").doc().id;
  const now = nowIso();
  const record: TimesheetPeriod = {
    id,
    start_date: payload.start_date,
    end_date: payload.end_date,
    status: (payload.status as TimesheetPeriod["status"]) ?? "OPEN",
    created_by: payload.created_by ?? null,
    created_at: now,
    updated_at: now,
  };
  await adminDb.collection("timesheet_periods").doc(id).set(record);
  return record;
}

export async function updateTimesheetPeriod(id: string, payload: { status?: string }) {
  const now = nowIso();
  await adminDb
    .collection("timesheet_periods")
    .doc(id)
    .set({ status: payload.status, updated_at: now }, { merge: true });
  const doc = await adminDb.collection("timesheet_periods").doc(id).get();
  return doc.exists
    ? ({ ...(doc.data() as TimesheetPeriod), id: doc.id } as TimesheetPeriod)
    : null;
}

export async function listTimesheetEntries(periodId: string) {
  const snapshot = await adminDb
    .collection("timesheet_entries")
    .where("period_id", "==", periodId)
    .get();
  const entries = mapDocs<TimesheetEntry>(snapshot);
  return entries.sort((a, b) => {
    const aTime = new Date(a.clock_in_at ?? 0).getTime();
    const bTime = new Date(b.clock_in_at ?? 0).getTime();
    return aTime - bTime;
  });
}

export async function listTimesheetEntriesForCleaner(cleanerId: string) {
  const snapshot = await adminDb
    .collection("timesheet_entries")
    .where("cleaner_id", "==", cleanerId)
    .get();
  const entries = mapDocs<TimesheetEntry>(snapshot);
  return entries.sort((a, b) => {
    const aTime = new Date(a.clock_in_at ?? 0).getTime();
    const bTime = new Date(b.clock_in_at ?? 0).getTime();
    return bTime - aTime;
  });
}
