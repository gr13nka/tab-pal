import { describe, it, expect } from "vitest";

import { evaluate, formatRatio, isValidHex, normalizeHex } from "./contrast.logic";

describe("contrast logic", () => {
  it("rates black on white as the maximum ~21:1 ratio with AAA normal text", () => {
    const result = evaluate("#000000", "#ffffff");
    expect(result.ratio).toBeCloseTo(21, 1);
    expect(result.normal).toBe("AAA");
    expect(result.large).toBe("AAA");
  });

  it("is symmetric: swapping fg/bg yields the same ratio", () => {
    const a = evaluate("#000000", "#ffffff");
    const b = evaluate("#ffffff", "#000000");
    expect(b.ratio).toBeCloseTo(a.ratio, 10);
  });

  it("fails a low-contrast pair for normal text", () => {
    const result = evaluate("#777777", "#808080");
    expect(result.normal).toBe("Fail");
    expect(result.large).toBe("Fail");
  });

  it("classifies a mid-contrast pair as AA Large for normal but AA for large text", () => {
    // A ratio in the [3, 4.5) band: passes large text at AA, normal only as 'AA Large'.
    const result = evaluate("#8c8c8c", "#ffffff");
    expect(result.ratio).toBeGreaterThanOrEqual(3);
    expect(result.ratio).toBeLessThan(4.5);
    expect(result.normal).toBe("AA Large");
    expect(result.large).toBe("AA");
  });

  it("formats a ratio with two decimals and the ' : 1' suffix", () => {
    expect(formatRatio(12.3456)).toBe("12.35 : 1");
    expect(formatRatio(21)).toBe("21.00 : 1");
  });

  it("validates 6-digit hex with or without a leading hash", () => {
    expect(isValidHex("#1a2b3c")).toBe(true);
    expect(isValidHex("1A2B3C")).toBe(true);
    expect(isValidHex("#abc")).toBe(false);
    expect(isValidHex("#12345g")).toBe(false);
    expect(isValidHex("")).toBe(false);
  });

  it("normalises hex to canonical lowercase #rrggbb", () => {
    expect(normalizeHex("AABBCC")).toBe("#aabbcc");
    expect(normalizeHex("#AABBCC")).toBe("#aabbcc");
  });
});
