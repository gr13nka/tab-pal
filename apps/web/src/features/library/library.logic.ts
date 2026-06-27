import { getPreset, presetNames, type PaletteType } from "@tab-pal/engine";

/** A single curated preset with a short colour preview, tagged by its palette type. */
export interface PresetPreview {
  type: PaletteType;
  name: string;
  colors: string[];
}

/** Palette types in display order; entries are grouped by this sequence. */
export const PALETTE_TYPES: PaletteType[] = [
  "regular",
  "ordered-sequential",
  "ordered-diverging",
];

/**
 * List every curated preset, grouped by palette type, with a `previewCount`-long
 * colour preview built from the engine. Pure: no DOM, no store, no router.
 */
export function listPresets(previewCount: number): PresetPreview[] {
  return PALETTE_TYPES.flatMap((type) =>
    presetNames(type).map((name) => ({
      type,
      name,
      colors: getPreset(type, name, previewCount),
    })),
  );
}
