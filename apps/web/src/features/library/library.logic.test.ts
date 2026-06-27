import { describe, it, expect } from "vitest";
import { getPreset } from "@tab-pal/engine";

import { listPresets, PALETTE_TYPES } from "./library.logic";

describe("library logic", () => {
  it("returns entries for known categorical and sequential presets", () => {
    const entries = listPresets(6);
    const tableau = entries.find((e) => e.name === "Tableau 10");
    const viridis = entries.find((e) => e.name === "Viridis");

    expect(tableau).toBeDefined();
    expect(tableau?.type).toBe("regular");
    expect(viridis).toBeDefined();
    expect(viridis?.type).toBe("ordered-sequential");
  });

  it("builds previews of exactly previewCount colours matching getPreset()", () => {
    const previewCount = 5;
    const entries = listPresets(previewCount);

    for (const entry of entries) {
      expect(entry.colors).toHaveLength(previewCount);
      expect(entry.colors).toEqual(getPreset(entry.type, entry.name, previewCount));
    }
  });

  it("honours the previewCount parameter", () => {
    expect(listPresets(3).every((e) => e.colors.length === 3)).toBe(true);
    expect(listPresets(12).every((e) => e.colors.length === 12)).toBe(true);
  });

  it("covers every palette type with at least one preset", () => {
    const entries = listPresets(4);
    for (const type of PALETTE_TYPES) {
      expect(entries.some((e) => e.type === type)).toBe(true);
    }
  });
});
