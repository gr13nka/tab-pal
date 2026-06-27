import { describe, it, expect } from "vitest";

import { parseLegacyTxt, toLegacyTxt } from "./legacy";

describe("legacy .txt interop", () => {
  it("parses one hex per line, ignoring blanks and whitespace", () => {
    expect(parseLegacyTxt("#ff0000\n#00FF00\n\n  #0000ff  \n")).toEqual([
      "#ff0000",
      "#00ff00",
      "#0000ff",
    ]);
  });

  it("accepts lines without a leading #", () => {
    expect(parseLegacyTxt("ff0000\n00ff00")).toEqual(["#ff0000", "#00ff00"]);
  });

  it("drops non-hex lines", () => {
    expect(parseLegacyTxt("# a comment\n#123456\nnope")).toEqual(["#123456"]);
  });

  it("serializes one hex per line with a trailing newline", () => {
    expect(toLegacyTxt(["#ff0000", "#00ff00"])).toBe("#ff0000\n#00ff00\n");
  });

  it("round-trips", () => {
    const hexes = ["#1f77b4", "#ff7f0e", "#2ca02c"];
    expect(parseLegacyTxt(toLegacyTxt(hexes))).toEqual(hexes);
  });
});
