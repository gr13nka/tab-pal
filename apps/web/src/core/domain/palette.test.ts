import { describe, it, expect } from "vitest";

import { Color } from "./color";
import { createPalette, CURRENT_SCHEMA_VERSION } from "./palette";

describe("createPalette", () => {
  it("fills sensible defaults", () => {
    const p = createPalette();
    expect(p.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(p.name).toBe("Untitled");
    expect(p.colors).toEqual([]);
    expect(p.type).toBe("regular");
    expect(p.metadata).toEqual({});
    expect(p.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(typeof p.createdAt).toBe("string");
    expect(p.updatedAt).toBe(p.createdAt);
  });

  it("accepts overrides", () => {
    const colors = [Color.of("#ff0000"), Color.of("#00ff00")];
    const p = createPalette({ name: "Sunset", colors, type: "ordered-sequential" });
    expect(p.name).toBe("Sunset");
    expect(p.colors).toBe(colors);
    expect(p.type).toBe("ordered-sequential");
  });

  it("always stamps the current schema version", () => {
    const p = createPalette({ schemaVersion: 999 });
    expect(p.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it("gives distinct ids", () => {
    expect(createPalette().id).not.toBe(createPalette().id);
  });
});
