import { openDB, type IDBPDatabase } from "idb";

import type { Palette } from "../domain/palette";
import { fromJSON, toJSON, type StoredPalette } from "../domain/serialization";
import type { PaletteStore, PaletteSummary } from "./types";

const STORE = "palettes";
const DB_VERSION = 1;

/** Local-first web storage. Reads go through `fromJSON`, so migrations always run. */
export class IndexedDbPaletteStore implements PaletteStore {
  #dbPromise: Promise<IDBPDatabase>;

  constructor(dbName = "tab-pal") {
    this.#dbPromise = openDB(dbName, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          const os = db.createObjectStore(STORE, { keyPath: "id" });
          os.createIndex("updatedAt", "updatedAt");
        }
      },
    });
  }

  async list(): Promise<PaletteSummary[]> {
    const db = await this.#dbPromise;
    const all = (await db.getAll(STORE)) as StoredPalette[];
    return all
      .map((p) => ({ id: p.id, name: p.name, updatedAt: p.updatedAt, count: p.colors.length }))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async get(id: string): Promise<Palette | null> {
    const db = await this.#dbPromise;
    const raw = await db.get(STORE, id);
    return raw ? fromJSON(raw) : null;
  }

  async put(palette: Palette): Promise<void> {
    const db = await this.#dbPromise;
    await db.put(STORE, toJSON(palette));
  }

  async delete(id: string): Promise<void> {
    const db = await this.#dbPromise;
    await db.delete(STORE, id);
  }
}
