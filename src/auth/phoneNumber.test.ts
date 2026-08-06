import { describe, expect, it } from "vitest";
import {
  formatE164PhoneNumber,
  formatUsPhoneInput,
  normalizeUsPhoneNumber,
} from "./phoneNumber";

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

describe("formatUsPhoneInput", () => {
  it("formats digits as the coach types", () => {
    expect(formatUsPhoneInput("5")).toBe("5");
    expect(formatUsPhoneInput("5057")).toBe("(505) 7");
    expect(formatUsPhoneInput("5057307634")).toBe("(505) 730-7634");
  });

  it("keeps no more than ten national digits", () => {
    expect(formatUsPhoneInput("1-505-730-7634-99")).toBe("(505) 730-7634");
  });
});

describe("formatE164PhoneNumber", () => {
  it("shows a readable US number", () => {
    expect(formatE164PhoneNumber("+15057307634")).toBe("(505) 730-7634");
  });

  it("falls back to the original value", () => {
    expect(formatE164PhoneNumber("+442071838750")).toBe("+442071838750");
  });
});
