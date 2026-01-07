import { describe, expect, it } from "vitest";
import { haversineDistanceMeters } from "./geo";

describe("haversineDistanceMeters", () => {
  it("returns zero for identical points", () => {
    expect(haversineDistanceMeters(0, 0, 0, 0)).toBeCloseTo(0, 3);
  });

  it("returns expected distance for 1 degree longitude at equator", () => {
    const distance = haversineDistanceMeters(0, 0, 0, 1);
    expect(distance).toBeGreaterThan(110000);
    expect(distance).toBeLessThan(112500);
  });
});
