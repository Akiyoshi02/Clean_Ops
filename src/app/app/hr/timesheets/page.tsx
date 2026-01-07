import { requireRole } from "@/lib/auth";
import { listTimesheetPeriods } from "@/lib/repositories/timesheets";
import { getSettings } from "@/lib/repositories/settings";
import { TimesheetManager } from "./timesheet-manager";

export default async function TimesheetsPage() {
  const profile = (await requireRole(["HR", "SUPERVISOR"])) as { role: string };
  const [periods, settingsMap] = await Promise.all([
    listTimesheetPeriods(),
    getSettings(["overtime_threshold_minutes"]),
  ]);
  const overtimeThresholdMinutes = Number(
    settingsMap.get("overtime_threshold_minutes") ?? 2280,
  );

  return (
    <TimesheetManager
      initialPeriods={periods ?? []}
      canApprove={profile.role === "HR"}
      overtimeThresholdMinutes={overtimeThresholdMinutes}
    />
  );
}
