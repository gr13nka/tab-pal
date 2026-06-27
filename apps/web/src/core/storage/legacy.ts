// Interop with the original tab-pal storage format: one `#rrggbb` per line.

const HEX_LINE = /^#?[0-9a-fA-F]{6}$/;

/** Parse a legacy `.txt` palette into normalized `#rrggbb` hex strings. */
export function parseLegacyTxt(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => HEX_LINE.test(line))
    .map((line) => `#${line.replace(/^#/, "").toLowerCase()}`);
}

/** Serialize hex strings back to the legacy `.txt` format (one per line). */
export function toLegacyTxt(hexes: string[]): string {
  return hexes.length === 0 ? "" : `${hexes.join("\n")}\n`;
}
