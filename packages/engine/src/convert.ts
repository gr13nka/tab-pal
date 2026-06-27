import { hexToRgb, rgbToHex, rgbToLab, labToRgb } from "./spaces/srgb";
import { labToLch, lchToLab } from "./spaces/lch";
import type { Hex, Lab, LCh } from "./types";

// Convenience round-trips between hex and the perceptual hub (Lab/LCh).

export function hexToLab(hex: Hex): Lab {
  return rgbToLab(hexToRgb(hex));
}

export function labToHex(lab: Lab): Hex {
  return rgbToHex(labToRgb(lab));
}

export function hexToLch(hex: Hex): LCh {
  return labToLch(rgbToLab(hexToRgb(hex)));
}

export function lchToHex(lch: LCh): Hex {
  return rgbToHex(labToRgb(lchToLab(lch)));
}
