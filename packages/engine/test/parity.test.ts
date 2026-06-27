import { describe, it, expect } from "vitest";

import {
  hexToRgb,
  rgbToLab,
  hexToLch,
  lchToHex,
  generate,
  getPreset,
} from "../src/index";
import type { PaletteType } from "../src/index";
import parityData from "./fixtures/parity.json";

// The fixture is produced by test/fixtures/generate_parity.py from the Python
// engine. This is the definitive guarantee that the TS port is faithful.
interface Parity {
  source: string;
  rgbToLab: { hex: string; lab: number[] }[];
  hexToLch: { hex: string; lch: number[] }[];
  roundTrip: { hex: string; out: string }[];
  generate: { type: string; n: number; mode: string; baseHue: number; out: string[] }[];
  getPreset: { type: string; name: string; n: number; out: string[] }[];
}

const parity = parityData as unknown as Parity;
const EPS = 1e-9;

describe(`cross-language parity (oracle: ${parity.source})`, () => {
  it("rgbToLab matches Python within 1e-9", () => {
    for (const { hex, lab } of parity.rgbToLab) {
      const got = rgbToLab(hexToRgb(hex));
      for (let i = 0; i < 3; i++) {
        expect(Math.abs(got[i] - lab[i])).toBeLessThan(EPS);
      }
    }
  });

  it("hexToLch matches Python within 1e-9", () => {
    for (const { hex, lch } of parity.hexToLch) {
      const got = hexToLch(hex);
      for (let i = 0; i < 3; i++) {
        expect(Math.abs(got[i] - lch[i])).toBeLessThan(EPS);
      }
    }
  });

  it("hex round-trip matches Python exactly", () => {
    for (const { hex, out } of parity.roundTrip) {
      expect(lchToHex(hexToLch(hex))).toBe(out);
    }
  });

  it(`generate matches Python exactly across ${parity.generate.length} cases`, () => {
    for (const c of parity.generate) {
      expect(generate(c.type as PaletteType, c.n, c.mode, c.baseHue)).toEqual(c.out);
    }
  });

  it(`getPreset matches Python exactly across ${parity.getPreset.length} cases`, () => {
    for (const c of parity.getPreset) {
      expect(getPreset(c.type as PaletteType, c.name, c.n)).toEqual(c.out);
    }
  });
});
