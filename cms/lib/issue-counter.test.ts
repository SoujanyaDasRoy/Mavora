import { describe, it, expect } from "vitest";
import { issueNumberFor } from "./issue-counter";

describe("issueNumberFor", () => {
  it("returns issue 1 for the first day of the year", () => {
    const result = issueNumberFor(new Date("2026-01-01T00:00:00Z"));
    expect(result.issue).toBe(1);
    expect(result.week).toBeGreaterThanOrEqual(1);
  });

  it("returns a positive integer for any date in 2026", () => {
    const result = issueNumberFor(new Date("2026-07-26T12:00:00Z"));
    expect(result.issue).toBeGreaterThan(0);
    expect(Number.isInteger(result.issue)).toBe(true);
    expect(result.week).toBeGreaterThan(0);
  });
});
