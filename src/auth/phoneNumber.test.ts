import { describe, expect, it } from "vitest";
import { normalizeUsPhoneNumber } from "./phoneNumber";

describe("normalizeUsPhoneNumber", () => {
  it("normalizes a ten-digit US number", () => {
    expect(normalizeUsPhoneNumber("5057307634")).toBe("+15057307634");
  });

  it("normalizes a formatted US number", () => {
    expect(normalizeUsPhoneNumber("(505) 730-7634")).toBe("+15057307634");
  });

  it("accepts a leading US country code", () => {
    expect(normalizeUsPhoneNumber("1-505-730-7634")).toBe("+15057307634");
  });

  it("rejects invalid lengths", () => {
    expect(normalizeUsPhoneNumber("505-730")).toBeNull();
  });
});
