import { describe, expect, it } from "vitest";
import {
  canManageUsers,
  canManageOperations,
  canApproveTimesheets,
  canReviewJobs,
  canViewTimesheetEntry,
} from "./permissions";

describe("permissions helpers", () => {
  it("restricts user management to HR", () => {
    expect(canManageUsers("HR")).toBe(true);
    expect(canManageUsers("SUPERVISOR")).toBe(false);
  });

  it("allows operational management for HR and supervisors", () => {
    expect(canManageOperations("SUPERVISOR")).toBe(true);
    expect(canManageOperations("CLEANER")).toBe(false);
  });

  it("limits timesheet approvals to HR", () => {
    expect(canApproveTimesheets("HR")).toBe(true);
    expect(canApproveTimesheets("SUPERVISOR")).toBe(false);
  });

  it("restricts review capability for cleaners", () => {
    expect(canReviewJobs("CLEANER")).toBe(false);
    expect(canReviewJobs("SUPERVISOR")).toBe(true);
  });

  it("limits cleaner timesheet visibility to self", () => {
    expect(canViewTimesheetEntry("CLEANER", "u1", "u1")).toBe(true);
    expect(canViewTimesheetEntry("CLEANER", "u1", "u2")).toBe(false);
  });
});
