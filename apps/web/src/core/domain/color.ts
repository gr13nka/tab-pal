import { hexToLab, labToLch } from "@tab-pal/engine";
import type { Lab, LCh } from "@tab-pal/engine";

export interface ColorJSON {
  hex: string;
  alpha?: number;
  name?: string;
}

const HEX_RE = /^[0-9a-f]{6}$/;

function normalizeHex(input: string): string {
  let h = input.trim().toLowerCase();
  if (h.startsWith("#")) h = h.slice(1);
  if (!HEX_RE.test(h)) {
    throw new Error(`invalid hex colour: ${JSON.stringify(input)}`);
  }
  return `#${h}`;
}

/**
 * Immutable colour value object.
 *
 * Source of truth is `hex` (+ optional `alpha`/`name`); Lab/LCh are derived from
 * the engine and lazily memoized. Because the object is immutable (every change
 * yields a new `Color`) the cache can never drift, and `toJSON` builds its result
 * field-by-field so derived fields are structurally unable to leak into storage.
 *
 * It is intentionally NOT an Immer-draftable type: Immer treats class instances
 * without the `immerable` symbol as atomic values, so a `Color` held inside an
 * Immer-managed `Palette` is never frozen and the lazy cache stays valid.
 */
export class Color {
  readonly hex: string;
  readonly alpha?: number;
  readonly name?: string;

  #lab?: Lab;
  #lch?: LCh;

  private constructor(hex: string, alpha: number | undefined, name: string | undefined) {
    this.hex = hex;
    this.alpha = alpha;
    this.name = name;
  }

  static of(hex: string, opts: { alpha?: number; name?: string } = {}): Color {
    return new Color(normalizeHex(hex), opts.alpha, opts.name);
  }

  get lab(): Lab {
    return (this.#lab ??= hexToLab(this.hex));
  }

  get lch(): LCh {
    return (this.#lch ??= labToLch(this.lab));
  }

  withHex(hex: string): Color {
    return new Color(normalizeHex(hex), this.alpha, this.name);
  }

  withName(name: string | undefined): Color {
    return new Color(this.hex, this.alpha, name);
  }

  withAlpha(alpha: number | undefined): Color {
    return new Color(this.hex, alpha, this.name);
  }

  equals(other: Color): boolean {
    return this.hex === other.hex && this.alpha === other.alpha && this.name === other.name;
  }

  toJSON(): ColorJSON {
    const json: ColorJSON = { hex: this.hex };
    if (this.alpha !== undefined) json.alpha = this.alpha;
    if (this.name !== undefined) json.name = this.name;
    return json;
  }

  static fromJSON(json: ColorJSON): Color {
    return new Color(normalizeHex(json.hex), json.alpha, json.name);
  }
}
