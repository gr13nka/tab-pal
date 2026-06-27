import { hexToRgb, rgbToXyz } from "./spaces/srgb";
import type { Hex } from "./types";

/**
 * WCAG 2.x relative luminance of a colour (0 = black, 1 = white).
 *
 * This is exactly the XYZ Y channel (the engine already applies the same sRGB
 * companding and 0.2126/0.7152/0.0722 weights), scaled back to 0-1.
 */
export function relativeLuminance(hex: Hex): number {
  return rgbToXyz(hexToRgb(hex))[1] / 100;
}

/** WCAG contrast ratio between two colours (1:1 to 21:1). */
export function contrastRatio(a: Hex, b: Hex): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

export type WcagLevel = "AAA" | "AA" | "AA Large" | "Fail";

/**
 * Classify a contrast ratio against WCAG 2.x thresholds.
 *
 * Normal text: AAA ≥ 7, AA ≥ 4.5, "AA Large" ≥ 3 (passes only for large text).
 * Large text (≥ 18pt / 14pt bold): AAA ≥ 4.5, AA ≥ 3.
 */
export function wcagLevel(ratio: number, opts: { largeText?: boolean } = {}): WcagLevel {
  if (opts.largeText ?? false) {
    if (ratio >= 4.5) return "AAA";
    if (ratio >= 3) return "AA";
    return "Fail";
  }
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA Large";
  return "Fail";
}
