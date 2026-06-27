import { mod360 } from "./math";
import { lchToLab } from "./spaces/lch";
import { rgbToLab, labToRgb, rgbToHex } from "./spaces/srgb";
import { lchToHex } from "./convert";
import { deltaE, lerpLab } from "./perceptual";
import type { Hex, Lab, PaletteType } from "./types";

/** Hue offsets (degrees) added to a base hue for each categorical harmony. */
export const HARMONY_HUES: Record<string, number[]> = {
  complementary: [0, 180],
  analogous: [-30, 0, 30],
  triadic: [0, 120, 240],
  "split-complementary": [0, 150, 210],
  tetradic: [0, 60, 180, 240],
  monochromatic: [0],
};

export const MODES_CATEGORICAL: string[] = Object.keys(HARMONY_HUES);
export const MODES_SEQUENTIAL: string[] = ["single-hue", "multi-hue"];
export const MODES_DIVERGING: string[] = ["two-hue"];

/** A nullary source of randomness in [0, 1); injected so generation is testable. */
export type Rng = () => number;

export function modesFor(paletteType: PaletteType): string[] {
  if (paletteType === "ordered-sequential") return MODES_SEQUENTIAL;
  if (paletteType === "ordered-diverging") return MODES_DIVERGING;
  return MODES_CATEGORICAL;
}

/** Cap chroma so a colour stays roughly inside the sRGB gamut. */
function gamutChroma(L: number, target = 62.0): number {
  return Math.max(28.0, target - Math.max(0.0, Math.abs(L - 55.0) - 8.0) * 1.1);
}

/** Lab of a colour *after* it is rendered to sRGB (i.e. gamut-clamped). */
function renderedLab(lch: readonly number[]): Lab {
  return rgbToLab(labToRgb(lchToLab([lch[0], lch[1], lch[2]])));
}

/** Nudge later colours so every pair is at least `minDe` apart on screen. */
function enforceMinDistance(colorsLch: number[][], minDe = 12.0, maxTries = 32): void {
  for (let j = 1; j < colorsLch.length; j++) {
    for (let t = 0; t < maxTries; t++) {
      const labj = renderedLab(colorsLch[j]);
      let ok = true;
      for (let i = 0; i < j; i++) {
        if (deltaE(labj, renderedLab(colorsLch[i])) < minDe) {
          ok = false;
          break;
        }
      }
      if (ok) break;
      colorsLch[j][2] = mod360(colorsLch[j][2] + 23);
      // Push lightness alternately darker/lighter to open up more room.
      colorsLch[j][0] = Math.max(30.0, Math.min(82.0, colorsLch[j][0] + (t % 2 ? 8.0 : -8.0)));
      colorsLch[j][1] = gamutChroma(colorsLch[j][0]);
    }
  }
}

export function generateCategorical(
  n: number,
  mode: string,
  baseHue?: number,
  rng: Rng = Math.random,
): Hex[] {
  const base = baseHue ?? rng() * 360;
  const offsets = HARMONY_HUES[mode] ?? HARMONY_HUES.triadic;
  const k = offsets.length;

  // How many colours land on each harmony hue (round-robin assignment).
  const counts = new Array<number>(k).fill(0);
  for (let i = 0; i < n; i++) counts[i % k] += 1;
  const seen = new Array<number>(k).fill(0);

  // A single hue can use the full lightness range; multi-hue schemes keep a
  // tighter band so every colour reads as equally weighted.
  const [lightHi, lightLo] = mode === "monochromatic" ? [90.0, 22.0] : [78.0, 38.0];
  const colours: number[][] = [];
  for (let i = 0; i < n; i++) {
    const g = i % k;
    const cnt = counts[g];
    const pos = seen[g];
    seen[g] += 1;
    const L = cnt === 1 ? 60.0 : lightHi + (lightLo - lightHi) * (pos / (cnt - 1));
    const C = gamutChroma(L);
    const h = mod360(base + offsets[g]);
    colours.push([L, C, h]);
  }

  if (mode !== "monochromatic") enforceMinDistance(colours);
  return colours.map((lch) => lchToHex([lch[0], lch[1], lch[2]]));
}

export function generateSequential(
  n: number,
  mode: string,
  baseHue?: number,
  rng: Rng = Math.random,
): Hex[] {
  const base = baseHue ?? rng() * 360;
  if (n === 1) return [lchToHex([60.0, 45.0, base])];

  const lightL = 92.0;
  const darkL = 30.0;
  const colours: Hex[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1); // 0 = lightest, 1 = darkest
    const L = lightL + (darkL - lightL) * t;
    const C = 12.0 + 52.0 * t; // desaturated when light, saturated when dark
    const h = mode === "multi-hue" ? mod360(base + 50.0 * t) : base;
    colours.push(lchToHex([L, C, h]));
  }
  return colours;
}

export function generateDiverging(
  n: number,
  _mode: string,
  baseHue?: number,
  rng: Rng = Math.random,
): Hex[] {
  const base = baseHue ?? rng() * 360;
  if (n === 1) return [lchToHex([95.0, 2.0, base])];

  const endL = 50.0;
  const endC = 52.0;
  const lab1 = lchToLab([endL, endC, base]);
  const lab2 = lchToLab([endL, endC, mod360(base + 180)]);
  const centre = lchToLab([95.0, 2.0, base]);

  const colours: Hex[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1); // 0 = arm 1, 0.5 = centre, 1 = arm 2
    const lab: Lab = t <= 0.5 ? lerpLab(lab1, centre, t / 0.5) : lerpLab(centre, lab2, (t - 0.5) / 0.5);
    colours.push(rgbToHex(labToRgb(lab)));
  }
  return colours;
}

/** Dispatch to the generator matching a Tableau palette type. */
export function generate(
  paletteType: PaletteType,
  n: number,
  mode: string,
  baseHue?: number,
  rng: Rng = Math.random,
): Hex[] {
  if (paletteType === "ordered-sequential") return generateSequential(n, mode, baseHue, rng);
  if (paletteType === "ordered-diverging") return generateDiverging(n, mode, baseHue, rng);
  return generateCategorical(n, mode, baseHue, rng);
}
