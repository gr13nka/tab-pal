import { toJSON } from "@/core/domain/serialization";
import type { Color } from "@/core/domain/color";
import type { Palette } from "@/core/domain/palette";
import { toLegacyTxt } from "@/core/storage/legacy";

/**
 * A single output format. Each exporter is a pure function from the active
 * palette to a string blob; the page handles preview / copy / download. New
 * formats are added by appending to EXPORTERS — nothing else in the feature
 * needs to change.
 */
export interface Exporter {
  id: string;
  label: string;
  /** File extension (no dot), used for the download filename. */
  ext: string;
  /** MIME type for the Blob. */
  mime: string;
  serialize(palette: Palette): string;
}

/** Turn an arbitrary colour name into a safe, deterministic CSS-ident fragment. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** A stable custom-property name: slugified colour name, else 1-based index. */
function cssVarName(color: Color, index: number): string {
  if (color.name) {
    const slug = slugify(color.name);
    if (slug) return `--color-${slug}`;
  }
  return `--color-${index + 1}`;
}

export const EXPORTERS: Exporter[] = [
  {
    id: "hex",
    label: "Hex list (.txt)",
    ext: "txt",
    mime: "text/plain",
    serialize: (palette) => toLegacyTxt(palette.colors.map((c) => c.hex)),
  },
  {
    id: "json",
    label: "JSON",
    ext: "json",
    mime: "application/json",
    serialize: (palette) => JSON.stringify(toJSON(palette), null, 2),
  },
  {
    id: "css",
    label: "CSS variables",
    ext: "css",
    mime: "text/css",
    serialize: (palette) => {
      const lines = palette.colors.map((c, i) => `  ${cssVarName(c, i)}: ${c.hex};`);
      return `:root {\n${lines.join("\n")}\n}\n`;
    },
  },
];
