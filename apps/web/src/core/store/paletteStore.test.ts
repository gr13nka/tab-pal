import { describe, it, expect, beforeEach } from "vitest";

import { Color } from "../domain/color";
import { usePaletteStore } from "./paletteStore";

const RED = Color.of("#ff0000");
const GREEN = Color.of("#00ff00");
const BLUE = Color.of("#0000ff");

function reset() {
  usePaletteStore.getState().newPalette("regular");
  usePaletteStore.temporal.getState().clear();
}

describe("paletteStore", () => {
  beforeEach(reset);

  it("setColors replaces colours and resets locks", () => {
    usePaletteStore.getState().setColors([RED, GREEN]);
    const s = usePaletteStore.getState();
    expect(s.palette.colors).toEqual([RED, GREEN]);
    expect(s.locks).toEqual([false, false]);
  });

  it("replaceUnlocked keeps locked slots and replaces the rest", () => {
    usePaletteStore.getState().setColors([RED, GREEN, BLUE]);
    usePaletteStore.getState().toggleLock(1); // lock GREEN
    usePaletteStore
      .getState()
      .replaceUnlocked([Color.of("#111111"), Color.of("#222222"), Color.of("#333333")]);
    const colors = usePaletteStore.getState().palette.colors;
    expect(colors[0].hex).toBe("#111111");
    expect(colors[1].hex).toBe("#00ff00"); // locked, unchanged
    expect(colors[2].hex).toBe("#333333");
  });

  it("undo/redo step through document changes", () => {
    usePaletteStore.getState().setColors([RED]);
    usePaletteStore.getState().setColors([RED, GREEN]);
    usePaletteStore.temporal.getState().undo();
    expect(usePaletteStore.getState().palette.colors).toEqual([RED]);
    usePaletteStore.temporal.getState().redo();
    expect(usePaletteStore.getState().palette.colors).toEqual([RED, GREEN]);
  });

  it("does not record lock toggles in history", () => {
    usePaletteStore.getState().setColors([RED, GREEN]); // one history step
    usePaletteStore.getState().toggleLock(0);
    usePaletteStore.getState().toggleLock(1);
    expect(usePaletteStore.temporal.getState().pastStates.length).toBe(1);
    usePaletteStore.temporal.getState().undo();
    expect(usePaletteStore.getState().palette.colors).toEqual([]); // back to fresh palette
  });

  it("rename and setType mutate the document and bump updatedAt", () => {
    const before = usePaletteStore.getState().palette.updatedAt;
    usePaletteStore.getState().rename("My palette");
    usePaletteStore.getState().setType("ordered-sequential");
    const s = usePaletteStore.getState();
    expect(s.palette.name).toBe("My palette");
    expect(s.palette.type).toBe("ordered-sequential");
    expect(s.palette.updatedAt >= before).toBe(true);
  });

  it("loadPalette swaps the document and resets locks", () => {
    usePaletteStore.getState().setColors([RED, GREEN]);
    usePaletteStore.getState().toggleLock(0);
    const incoming = usePaletteStore.getState().palette; // reuse shape
    usePaletteStore.getState().loadPalette({ ...incoming, name: "Loaded", colors: [BLUE] });
    const s = usePaletteStore.getState();
    expect(s.palette.name).toBe("Loaded");
    expect(s.palette.colors).toEqual([BLUE]);
    expect(s.locks).toEqual([false]);
  });
});
