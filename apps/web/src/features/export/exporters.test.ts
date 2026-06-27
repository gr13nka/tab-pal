import { describe, it, expect } from "vitest";

import { Color } from "@/core/domain/color";
import { createPalette } from "@/core/domain/palette";

import { EXPORTERS, type Exporter } from "./exporters";

function exporter(id: string): Exporter {
  const found = EXPORTERS.find((e) => e.id === id);
  if (!found) throw new Error(`missing exporter: ${id}`);
  return found;
}

describe("exporters", () => {
  const palette = createPalette({ colors: [Color.of("#ff0000"), Color.of("#00ff00")] });

  it("hex exporter emits the legacy one-per-line format", () => {
    expect(exporter("hex").serialize(palette)).toBe("#ff0000\n#00ff00\n");
  });

  it("json exporter round-trips to an object whose colors length is 2", () => {
    const parsed = JSON.parse(exporter("json").serialize(palette)) as { colors: unknown[] };
    expect(typeof parsed).toBe("object");
    expect(parsed.colors).toHaveLength(2);
  });

  it("css exporter contains an indexed custom property", () => {
    expect(exporter("css").serialize(palette)).toContain("--color-1: #ff0000");
  });

  it("css exporter uses a slugified name when a colour is named", () => {
    const named = createPalette({ colors: [Color.of("#0000ff", { name: "Sky Blue" })] });
    expect(exporter("css").serialize(named)).toContain("--color-sky-blue: #0000ff");
  });
});
