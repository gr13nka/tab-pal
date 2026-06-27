/**
 * Banker's rounding (round half to even) — matches Python's built-in `round()`.
 *
 * The engine is a port of a Python reference whose lossless Lab/LCh round-trip
 * depends on half-to-even rounding; JS `Math.round` is half-up and would produce
 * off-by-one bytes at exact .5 boundaries.
 */
export function roundHalfEven(value: number): number {
  const floor = Math.floor(value);
  const diff = value - floor;
  if (diff < 0.5) return floor;
  if (diff > 0.5) return floor + 1;
  // Exactly .5 — round toward the even integer.
  return floor % 2 === 0 ? floor : floor + 1;
}

/** Non-negative modulo 360, matching Python's `% 360` (whose result is never negative). */
export function mod360(value: number): number {
  return ((value % 360) + 360) % 360;
}
