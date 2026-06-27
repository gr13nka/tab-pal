import { generate, getPreset, modesFor, presetNames, type PaletteType } from "@tab-pal/engine";

import { Color } from "@/core/domain/color";

export type Source = "harmony" | "preset";

export interface GeneratorControls {
  type: PaletteType;
  source: Source;
  mode: string;
  count: number;
  presetName: string | null;
}

/** Produce the colours for the current controls (preset lookup or harmony generation). */
export function buildColors(controls: GeneratorControls, baseHue?: number): Color[] {
  const hexes =
    controls.source === "preset" && controls.presetName
      ? getPreset(controls.type, controls.presetName, controls.count)
      : generate(controls.type, controls.count, controls.mode, baseHue);
  return hexes.map((hex) => Color.of(hex));
}

export { modesFor, presetNames };
