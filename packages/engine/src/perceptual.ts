import { hexToLch } from "./convert";
import type { Hex, Lab } from "./types";

/** CIE76 perceptual distance (Euclidean in Lab). */
export function deltaE(lab1: Lab, lab2: Lab): number {
  return Math.hypot(lab1[0] - lab2[0], lab1[1] - lab2[1], lab1[2] - lab2[2]);
}

/** Return `#000000` or `#ffffff` for readable text on `hex` (Lab-lightness based). */
export function bestTextColor(hex: Hex): Hex {
  return hexToLch(hex)[0] > 60 ? "#000000" : "#ffffff";
}

/** Linearly interpolate between two Lab colours (`f` in 0..1). */
export function lerpLab(lab1: Lab, lab2: Lab, f: number): Lab {
  return [
    lab1[0] + (lab2[0] - lab1[0]) * f,
    lab1[1] + (lab2[1] - lab1[1]) * f,
    lab1[2] + (lab2[2] - lab1[2]) * f,
  ];
}
