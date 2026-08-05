import { describe, expect, it } from "vitest";
import { isApprovedCoach } from "./approvedCoaches";

describe("isApprovedCoach", () => {
  it("allows the initial coach number", () => {
    expect(isApprovedCoach("+15057307634")).toBe(true);
  });

  it("denies other and missing numbers", () => {
    expect(isApprovedCoach("+15055550134")).toBe(false);
    expect(isApprovedCoach(null)).toBe(false);
  });
});
