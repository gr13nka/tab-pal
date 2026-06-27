import { contrastRatio, wcagLevel, type WcagLevel } from "@tab-pal/engine";

/** WCAG verdict for a foreground/background pair, for both normal and large text. */
export interface ContrastResult {
  ratio: number;
  normal: WcagLevel;
  large: WcagLevel;
}

/** Matches a 6-digit hex colour, with or without a leading "#". */
const HEX_RE = /^#?[0-9a-fA-F]{6}$/;

/** True when `value` is a valid 6-digit hex colour (e.g. "#1a2b3c" or "1a2b3c"). */
export function isValidHex(value: string): boolean {
  return HEX_RE.test(value.trim());
}

/** Normalise a hex string to the canonical lowercase "#rrggbb" form. */
export function normalizeHex(value: string): string {
  const v = value.trim().toLowerCase();
  return v.startsWith("#") ? v : `#${v}`;
}

/**
 * Evaluate the WCAG contrast of a foreground colour against a background.
 *
 * Delegates the maths to the engine: `contrastRatio` for the 1:1–21:1 ratio and
 * `wcagLevel` for the AAA/AA/AA Large/Fail classification (large text uses the
 * relaxed thresholds).
 */
export function evaluate(fgHex: string, bgHex: string): ContrastResult {
  const ratio = contrastRatio(fgHex, bgHex);
  return {
    ratio,
    normal: wcagLevel(ratio),
    large: wcagLevel(ratio, { largeText: true }),
  };
}

/** Format a contrast ratio the WCAG-conventional way, e.g. `12.34 : 1`. */
export function formatRatio(ratio: number): string {
  return `${ratio.toFixed(2)} : 1`;
}
