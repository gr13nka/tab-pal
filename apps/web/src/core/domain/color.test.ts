import { describe, it, expect } from "vitest";
import { hexToLab } from "@tab-pal/engine";

import { Color } from "./color";

describe("Color", () => {
  it("normalizes hex to lowercase with a leading #", () => {
    expect(Color.of("#FF0000").hex).toBe("#ff0000");
    expect(Color.of("ABCDEF").hex).toBe("#abcdef");
    expect(Color.of("  #00ff00  ").hex).toBe("#00ff00");
  });

  it("rejects invalid hex", () => {
    expect(() => Color.of("#fff")).toThrow();
    expect(() => Color.of("nothex")).toThrow();
    expect(() => Color.of("#gggggg")).toThrow();
  });

  it("derives Lab from the engine and memoizes it", () => {
    const c = Color.of("#1f77b4");
    expect(c.lab).toEqual(hexToLab("#1f77b4"));
    expect(c.lab).toBe(c.lab); // same reference -> memoized
  });

  it("is immutable: withHex/withName/withAlpha return new instances", () => {
    const c = Color.of("#1f77b4", { name: "blue", alpha: 0.5 });
    const c2 = c.withHex("#000000");
    expect(c.hex).toBe("#1f77b4"); // original untouched
    expect(c2.hex).toBe("#000000");
    expect(c2.name).toBe("blue"); // metadata carried
    expect(c2.alpha).toBe(0.5);
    expect(c.withName("red").name).toBe("red");
    expect(c.withName(undefined).name).toBeUndefined();
  });

  it("compares by value", () => {
    expect(Color.of("#ff0000").equals(Color.of("#FF0000"))).toBe(true);
    expect(Color.of("#ff0000", { name: "a" }).equals(Color.of("#ff0000"))).toBe(false);
    expect(Color.of("#ff0000").equals(Color.of("#00ff00"))).toBe(false);
  });

  it("serializes ONLY hex/alpha/name (never derived fields)", () => {
    const plain = Color.of("#ff0000");
    expect(plain.toJSON()).toEqual({ hex: "#ff0000" });
    expect(Object.keys(plain.toJSON())).toEqual(["hex"]);

    const rich = Color.of("#ff0000", { alpha: 0.25, name: "scarlet" });
    expect(rich.toJSON()).toEqual({ hex: "#ff0000", alpha: 0.25, name: "scarlet" });
    // even after deriving Lab/LCh, they must not leak into JSON
    void rich.lab;
    void rich.lch;
    expect(Object.keys(rich.toJSON()).sort()).toEqual(["alpha", "hex", "name"]);
  });

  it("round-trips through JSON", () => {
    const c = Color.of("#abcdef", { alpha: 0.5, name: "x" });
    const back = Color.fromJSON(c.toJSON());
    expect(back.equals(c)).toBe(true);
  });

  it("keeps an alpha of 0", () => {
    expect(Color.of("#000000", { alpha: 0 }).toJSON()).toEqual({ hex: "#000000", alpha: 0 });
  });
});
