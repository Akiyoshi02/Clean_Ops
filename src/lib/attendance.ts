export type BreakEvent = {
  type: "BREAK_START" | "BREAK_END";
  at: string;
};

export type BreakSummary = {
  breakMinutes: number;
  missingStart: boolean;
  missingEnd: boolean;
  onBreak: boolean;
};

export function calculateBreakSummary(events: BreakEvent[]): BreakSummary {
  const sorted = [...events].sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
  );
  let lastStart: Date | null = null;
  let total = 0;
  let missingStart = false;
  let missingEnd = false;

  for (const event of sorted) {
    if (event.type === "BREAK_START") {
      if (lastStart) {
        missingEnd = true;
      }
      lastStart = new Date(event.at);
    } else {
      if (!lastStart) {
        missingStart = true;
      } else {
        const diff = Math.floor(
          (new Date(event.at).getTime() - lastStart.getTime()) / 60000,
        );
        total += Math.max(0, diff);
        lastStart = null;
      }
    }
  }

  if (lastStart) {
    missingEnd = true;
  }

  return {
    breakMinutes: total,
    missingStart,
    missingEnd,
    onBreak: Boolean(lastStart),
  };
}

export function calculateOvertimeMinutes(
  totalMinutes: number,
  thresholdMinutes: number,
) {
  const regularMinutes = Math.max(0, Math.min(totalMinutes, thresholdMinutes));
  const overtimeMinutes = Math.max(0, totalMinutes - thresholdMinutes);
  return { regularMinutes, overtimeMinutes };
}
