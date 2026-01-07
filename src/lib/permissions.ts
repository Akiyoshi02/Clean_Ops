export type Role = "HR" | "SUPERVISOR" | "CLEANER";

export function canManageUsers(role: Role) {
  return role === "HR";
}

export function canManageOperations(role: Role) {
  return role === "HR" || role === "SUPERVISOR";
}

export function canApproveTimesheets(role: Role) {
  return role === "HR";
}

export function canReviewJobs(role: Role) {
  return role === "HR" || role === "SUPERVISOR";
}

export function canViewTimesheetEntry(role: Role, viewerId: string, cleanerId: string) {
  if (role === "CLEANER") {
    return viewerId === cleanerId;
  }
  return true;
}
