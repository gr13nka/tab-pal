import { describe, it, expect, beforeEach } from "vitest";

import { Color } from "../domain/color";
import { createPalette } from "../domain/palette";
import { IndexedDbPaletteStore } from "./IndexedDbPaletteStore";

describe("IndexedDbPaletteStore", () => {
  let store: IndexedDbPaletteStore;

  beforeEach(() => {
    // Isolate each test in its own database.
    store = new IndexedDbPaletteStore(`test-${crypto.randomUUID()}`);
  });

  it("put then get round-trips a palette (reviving Color instances)", async () => {
    const p = createPalette({
      name: "Sunset",
      colors: [Color.of("#ff6b6b"), Color.of("#ffd93d")],
    });
    await store.put(p);
    const got = await store.get(p.id);
    expect(got).not.toBeNull();
    expect(got!.name).toBe("Sunset");
    expect(got!.colors.map((c) => c.hex)).toEqual(["#ff6b6b", "#ffd93d"]);
    expect(got!.colors[0]).toBeInstanceOf(Color);
  });

  it("returns null for a missing id", async () => {
    expect(await store.get("missing")).toBeNull();
  });

  it("lists summaries sorted by updatedAt (newest first)", async () => {
    await store.put(createPalette({ name: "A", updatedAt: "2020-01-01T00:00:00.000Z" }));
    await store.put(
      createPalette({
        name: "B",
        updatedAt: "2022-01-01T00:00:00.000Z",
        colors: [Color.of("#000000")],
      }),
    );
    const list = await store.list();
    expect(list.map((s) => s.name)).toEqual(["B", "A"]);
    expect(list[0].count).toBe(1);
  });

  it("deletes a palette", async () => {
    const p = createPalette({ name: "X" });
    await store.put(p);
    await store.delete(p.id);
    expect(await store.get(p.id)).toBeNull();
  });
});
