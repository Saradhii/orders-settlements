import { describe, expect, it } from "vitest";

import { toCents, toDateInput } from "./format";

describe("toCents", () => {
  it("reads whole amounts", () => {
    expect(toCents("1000")).toBe(100000);
    expect(toCents("0")).toBe(0);
  });

  it("reads amounts with cents", () => {
    expect(toCents("19.99")).toBe(1999);
    expect(toCents("0.01")).toBe(1);
    expect(toCents("0.10")).toBe(10);
    expect(toCents("0.1")).toBe(10);
  });

  it("stays exact where a float multiply would not", () => {
    expect(toCents("8.87")).toBe(887);
    expect(toCents("1.15")).toBe(115);
    expect(toCents("1234567.89")).toBe(123456789);
  });

  it("accepts a leading decimal point", () => {
    expect(toCents(".5")).toBe(50);
  });

  it("ignores surrounding whitespace", () => {
    expect(toCents("  42.50  ")).toBe(4250);
  });

  it("rejects exponent notation", () => {
    expect(toCents("1e3")).toBeNull();
    expect(toCents("1E3")).toBeNull();
  });

  it("rejects negatives and signs", () => {
    expect(toCents("-5")).toBeNull();
    expect(toCents("+5")).toBeNull();
  });

  it("rejects fractions of a cent", () => {
    expect(toCents("1.234")).toBeNull();
  });

  it("rejects anything that is not a number", () => {
    expect(toCents("")).toBeNull();
    expect(toCents("   ")).toBeNull();
    expect(toCents("abc")).toBeNull();
    expect(toCents("1,000")).toBeNull();
    expect(toCents("$5")).toBeNull();
    expect(toCents("Infinity")).toBeNull();
  });
});

describe("toDateInput", () => {
  it("formats a local date without shifting the calendar day", () => {
    expect(toDateInput(new Date(2026, 7, 15))).toBe("2026-08-15");
    expect(toDateInput(new Date(2026, 0, 1))).toBe("2026-01-01");
    expect(toDateInput(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});
