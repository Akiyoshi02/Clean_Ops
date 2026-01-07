import { adminDb } from "@/lib/firebase/admin";
import { nowIso } from "@/lib/firebase/db";
import { calculateBreakSummary } from "@/lib/attendance";
import type {
  BreakEvent,
  JobClockEvent,
  TimesheetEntry,
  TimesheetPeriod,
} from "@/lib/types";

export function computeTimesheetFromEvents(
  clockEvents: JobClockEvent[],
  breakEvents: BreakEvent[],
) {
  const clockIns = clockEvents
    .filter((event) => event.type === "CLOCK_IN")
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  const clockOuts = clockEvents
    .filter((event) => event.type === "CLOCK_OUT")
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  const firstIn = clockIns[0]?.at ?? null;
  const lastOut = clockOuts[clockOuts.length - 1]?.at ?? null;
  const breakSummary = calculateBreakSummary(
    breakEvents.map((event) => ({ type: event.type, at: event.at })),
  );

  let minutesWorked: number | null = null;
  if (firstIn && lastOut) {
    const diff =
      (new Date(lastOut).getTime() - new Date(firstIn).getTime()) / 60000;
    minutesWorked = Math.max(0, Math.floor(diff - breakSummary.breakMinutes));
  }

  const exceptions: Record<string, unknown> = {};
  if (!firstIn) {
    exceptions.missing_clock_in = true;
  }
  if (!lastOut) {
    exceptions.missing_clock_out = true;
  }
  if (clockEvents.some((event) => event.is_within_geofence === false)) {
    exceptions.outside_geofence = true;
  }
  if (breakSummary.missingStart) {
    exceptions.break_missing_start = true;
  }
  if (breakSummary.missingEnd) {
    exceptions.break_missing_end = true;
  }

  return {
    clock_in_at: firstIn,
    clock_out_at: lastOut,
    break_minutes: breakSummary.breakMinutes,
    minutes_worked: minutesWorked,
    exceptions_json: exceptions,
  };
}

export async function getOrCreateTimesheetPeriod(targetDateIso: string) {
  const targetDate = new Date(targetDateIso);
  if (Number.isNaN(targetDate.getTime())) {
    return null;
  }
  const weekStart = new Date(targetDate);
  const day = weekStart.getDay();
  const diff = (day + 6) % 7;
  weekStart.setDate(weekStart.getDate() - diff);
  weekStart.setHours(0, 0, 0, 0);
  const startDate = weekStart.toISOString().slice(0, 10);
  const endDate = new Date(weekStart);
  endDate.setDate(endDate.getDate() + 6);
  const endDateStr = endDate.toISOString().slice(0, 10);

  const snapshot = await adminDb
    .collection("timesheet_periods")
    .where("start_date", "==", startDate)
    .limit(1)
    .get();
  const existing = snapshot.docs[0];
  if (existing?.exists) {
    return { id: existing.id, ...(existing.data() as TimesheetPeriod) };
  }

  const id = adminDb.collection("timesheet_periods").doc().id;
  const now = nowIso();
  const period: TimesheetPeriod = {
    id,
    start_date: startDate,
    end_date: endDateStr,
    status: "OPEN",
    created_by: null,
    created_at: now,
    updated_at: now,
  };
  await adminDb.collection("timesheet_periods").doc(id).set(period);
  return period;
}

export async function upsertTimesheetEntry(payload: {
  cleaner_id: string;
  job_id: string;
  period_id: string | null;
  clock_in_at: string | null;
  clock_out_at: string | null;
  break_minutes: number;
  minutes_worked: number | null;
  exceptions_json: Record<string, unknown>;
}) {
  const now = nowIso();
  const existingSnap = await adminDb
    .collection("timesheet_entries")
    .where("job_id", "==", payload.job_id)
    .where("cleaner_id", "==", payload.cleaner_id)
    .limit(1)
    .get();
  const existing = existingSnap.docs[0];

  if (existing?.exists) {
    await adminDb.collection("timesheet_entries").doc(existing.id).set(
      {
        ...payload,
        updated_at: now,
      },
      { merge: true },
    );
    const doc = await adminDb.collection("timesheet_entries").doc(existing.id).get();
    return doc.exists
      ? ({ id: doc.id, ...(doc.data() as TimesheetEntry) } as TimesheetEntry)
      : null;
  }

  const id = adminDb.collection("timesheet_entries").doc().id;
  const entry: TimesheetEntry = {
    id,
    cleaner_id: payload.cleaner_id,
    job_id: payload.job_id,
    period_id: payload.period_id,
    clock_in_at: payload.clock_in_at,
    clock_out_at: payload.clock_out_at,
    break_minutes: payload.break_minutes,
    minutes_worked: payload.minutes_worked,
    exceptions_json: payload.exceptions_json,
    created_at: now,
    updated_at: now,
  };
  await adminDb.collection("timesheet_entries").doc(id).set(entry);
  return entry;
}
