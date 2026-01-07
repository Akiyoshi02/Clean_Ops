import { describe, expect, it } from "vitest";
import { calculateBreakSummary, calculateOvertimeMinutes } from "./attendance";

describe("calculateBreakSummary", () => {
  it("pairs break start and end to compute minutes", () => {
    const summary = calculateBreakSummary([
      { type: "BREAK_START", at: "2025-01-01T10:00:00Z" },
      { type: "BREAK_END", at: "2025-01-01T10:15:00Z" },
    ]);
    expect(summary.breakMinutes).toBe(15);
    expect(summary.missingStart).toBe(false);
    expect(summary.missingEnd).toBe(false);
  });

  it("flags missing end when break never ends", () => {
    const summary = calculateBreakSummary([
      { type: "BREAK_START", at: "2025-01-01T10:00:00Z" },
    ]);
    expect(summary.breakMinutes).toBe(0);
    expect(summary.missingEnd).toBe(true);
  });
});

describe("calculateOvertimeMinutes", () => {
  it("splits regular and overtime minutes", () => {
    const result = calculateOvertimeMinutes(2500, 2280);
    expect(result.regularMinutes).toBe(2280);
    expect(result.overtimeMinutes).toBe(220);
  });
});
