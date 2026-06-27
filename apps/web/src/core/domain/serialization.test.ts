import { describe, it, expect } from "vitest";

import { Color } from "./color";
import { createPalette } from "./palette";
import { toJSON, fromJSON } from "./serialization";
import { migrate } from "./migrations";

describe("serialization", () => {
  const sample = createPalette({
    name: "Sunset",
    colors: [Color.of("#ff6b6b", { name: "coral" }), Color.of("#ffd93d", { alpha: 0.5 })],
  });

  it("toJSON emits stored colours as plain hex/alpha/name", () => {
    const json = toJSON(sample);
    expect(json.colors).toEqual([
      { hex: "#ff6b6b", name: "coral" },
      { hex: "#ffd93d", alpha: 0.5 },
    ]);
    expect(json.schemaVersion).toBe(1);
  });

  it("round-trips through fromJSON(toJSON())", () => {
    const back = fromJSON(toJSON(sample));
    expect(back.id).toBe(sample.id);
    expect(back.name).toBe(sample.name);
    expect(back.colors.length).toBe(2);
    expect(back.colors[0].equals(sample.colors[0])).toBe(true);
    expect(back.colors[1].equals(sample.colors[1])).toBe(true);
  });

  it("revives Color instances (not plain objects)", () => {
    const back = fromJSON(toJSON(sample));
    expect(back.colors[0]).toBeInstanceOf(Color);
    expect(back.colors[0].lab).toEqual(sample.colors[0].lab);
  });

  it("migrates a v0 record to the current schema", () => {
    const v0 = {
      id: "abc",
      name: "Legacy",
      colors: [{ hex: "#112233" }],
      createdAt: "2020-01-01T00:00:00.000Z",
      updatedAt: "2020-01-01T00:00:00.000Z",
      schemaVersion: 0,
    };
    const p = fromJSON(v0);
    expect(p.schemaVersion).toBe(1);
    expect(p.type).toBe("regular");
    expect(p.metadata).toEqual({});
    expect(p.colors[0].hex).toBe("#112233");
  });

  it("treats a missing schemaVersion as v0", () => {
    const raw = migrate({ id: "x", name: "n", colors: [], createdAt: "t", updatedAt: "t" });
    expect(raw.schemaVersion).toBe(1);
  });

  it("rejects structurally invalid data", () => {
    expect(() => fromJSON({ id: "x" })).toThrow();
  });
});
