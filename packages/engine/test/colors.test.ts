import { describe, it, expect } from "vitest";

import {
  hexToRgb,
  rgbToHex,
  lchToHex,
  hexToLch,
  rgbToLab,
  bestTextColor,
  deltaE,
  generate,
  modesFor,
  getPreset,
  relativeLuminance,
  contrastRatio,
  wcagLevel,
  MODES_CATEGORICAL,
  MODES_SEQUENTIAL,
  MODES_DIVERGING,
} from "../src/index";

const HEX = /^#[0-9a-f]{6}$/;

// Mirrors tests/test_colors.py SAMPLES exactly.
const SAMPLES = [
  "#ff0000",
  "#00ff00",
  "#0000ff",
  "#ffffff",
  "#000000",
  "#808080",
  "#1f77b4",
  "#e377c2",
  "#2ca02c",
  "#fde725",
];

function minDeltaE(palette: string[]): number {
  const labs = palette.map((c) => rgbToLab(hexToRgb(c)));
  let min = Infinity;
  for (let i = 0; i < labs.length; i++) {
    for (let j = i + 1; j < labs.length; j++) {
      min = Math.min(min, deltaE(labs[i], labs[j]));
    }
  }
  return min;
}

describe("hex <-> rgb", () => {
  it("round-trips losslessly", () => {
    for (const hex of SAMPLES) {
      expect(rgbToHex(hexToRgb(hex))).toBe(hex);
    }
  });
});

describe("Lab/LCh round-trip", () => {
  it("round-trips back to the exact same sRGB byte", () => {
    for (const hex of SAMPLES) {
      expect(lchToHex(hexToLch(hex))).toBe(hex);
    }
  });
});

describe("bestTextColor", () => {
  it("returns black on light and white on dark", () => {
    expect(bestTextColor("#ffffff")).toBe("#000000");
    expect(bestTextColor("#000000")).toBe("#ffffff");
  });
});

describe("categorical generation", () => {
  it("is valid and perceptibly distinct for multi-hue harmonies", () => {
    for (const mode of MODES_CATEGORICAL) {
      if (mode === "monochromatic") continue; // single-hue ramps are intentionally close
      for (let base = 0; base < 360; base += 30) {
        const pal = generate("regular", 6, mode, base);
        expect(pal).toHaveLength(6);
        expect(pal.every((c) => HEX.test(c))).toBe(true);
        expect(minDeltaE(pal)).toBeGreaterThanOrEqual(10.0);
      }
    }
  });
});

describe("sequential generation", () => {
  it("has monotonically decreasing lightness", () => {
    for (const mode of MODES_SEQUENTIAL) {
      const pal = generate("ordered-sequential", 8, mode, 240);
      const light = pal.map((c) => hexToLch(c)[0]);
      for (let i = 0; i < light.length - 1; i++) {
        expect(light[i]).toBeGreaterThan(light[i + 1]);
      }
      expect(pal.every((c) => HEX.test(c))).toBe(true);
    }
  });
});

describe("diverging generation", () => {
  it("has the lightest colour at the neutral centre", () => {
    const pal = generate("ordered-diverging", 9, "two-hue", 20);
    const light = pal.map((c) => hexToLch(c)[0]);
    const centre = light[Math.floor(light.length / 2)];
    expect(centre).toBe(Math.max(...light));
    expect(pal.every((c) => HEX.test(c))).toBe(true);
  });
});

describe("presets", () => {
  it("slice/cycle qualitative and resample ordered ramps", () => {
    expect(getPreset("regular", "Tableau 10", 4)).toEqual([
      "#1f77b4",
      "#ff7f0e",
      "#2ca02c",
      "#d62728",
    ]);
    expect(getPreset("regular", "Tableau 10", 14)).toHaveLength(14);
    for (const n of [3, 5, 9, 12]) {
      const ramp = getPreset("ordered-sequential", "Viridis", n);
      expect(ramp).toHaveLength(n);
      expect(ramp.every((c) => HEX.test(c))).toBe(true);
      const div = getPreset("ordered-diverging", "RdBu", n);
      expect(div).toHaveLength(n);
      expect(div.every((c) => HEX.test(c))).toBe(true);
    }
  });
});

describe("modesFor", () => {
  it("returns the valid modes for each palette type", () => {
    expect(modesFor("regular")).toEqual(MODES_CATEGORICAL);
    expect(modesFor("ordered-sequential")).toEqual(MODES_SEQUENTIAL);
    expect(modesFor("ordered-diverging")).toEqual(MODES_DIVERGING);
  });
});

describe("WCAG contrast", () => {
  it("computes black-on-white as 21:1 (AAA)", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(wcagLevel(contrastRatio("#000000", "#ffffff"))).toBe("AAA");
  });

  it("has relative luminance 0 for black and 1 for white", () => {
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 6);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 6);
  });

  it("fails very low contrast pairs", () => {
    expect(wcagLevel(contrastRatio("#777777", "#888888"))).toBe("Fail");
  });
});
