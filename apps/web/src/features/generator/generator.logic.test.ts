import { describe, it, expect } from "vitest";
import { generate, getPreset } from "@tab-pal/engine";

import { buildColors } from "./generator.logic";

describe("generator logic", () => {
  it("builds harmony colours from the engine", () => {
    const colors = buildColors(
      { type: "regular", source: "harmony", mode: "triadic", count: 5, presetName: null },
      30,
    );
    expect(colors.map((c) => c.hex)).toEqual(generate("regular", 5, "triadic", 30));
  });

  it("builds preset colours when the source is a preset", () => {
    const colors = buildColors(
      { type: "regular", source: "preset", mode: "triadic", count: 4, presetName: "Tableau 10" },
      30,
    );
    expect(colors.map((c) => c.hex)).toEqual(getPreset("regular", "Tableau 10", 4));
  });

  it("falls back to harmony when preset source has no preset name", () => {
    const colors = buildColors(
      { type: "regular", source: "preset", mode: "analogous", count: 3, presetName: null },
      10,
    );
    expect(colors.map((c) => c.hex)).toEqual(generate("regular", 3, "analogous", 10));
  });
});
