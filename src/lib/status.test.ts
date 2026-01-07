import { describe, expect, it } from "vitest";
import { isValidStatusTransition } from "./status";

describe("isValidStatusTransition", () => {
  it("allows valid transitions", () => {
    expect(isValidStatusTransition("DRAFT", "PUBLISHED")).toBe(true);
    expect(isValidStatusTransition("IN_PROGRESS", "COMPLETED_PENDING_REVIEW")).toBe(true);
    expect(isValidStatusTransition("COMPLETED_PENDING_REVIEW", "APPROVED")).toBe(true);
  });

  it("rejects invalid transitions", () => {
    expect(isValidStatusTransition("DRAFT", "APPROVED")).toBe(false);
    expect(isValidStatusTransition("APPROVED", "IN_PROGRESS")).toBe(false);
  });
});
