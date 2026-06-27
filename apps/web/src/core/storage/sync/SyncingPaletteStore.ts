import type { Palette } from "../../domain/palette";
import type { PaletteStore, PaletteSummary } from "../types";
import type { SyncEngine } from "./SyncEngine";

/**
 * v3 seam: a write-through decorator combining a local + cloud store via a
 * SyncEngine. Reads serve from local; writes hit local then enqueue a push.
 * Swapping the StorageProvider's injected store to this is the ONLY change
 * needed to turn on cloud sync — tools depend on `PaletteStore` alone.
 */
export class SyncingPaletteStore implements PaletteStore {
  constructor(
    private readonly local: PaletteStore,
    private readonly cloud: PaletteStore,
    private readonly sync: SyncEngine,
  ) {}

  list(): Promise<PaletteSummary[]> {
    return this.local.list();
  }

  get(id: string): Promise<Palette | null> {
    return this.local.get(id);
  }

  async put(palette: Palette): Promise<void> {
    await this.local.put(palette);
    // v3: enqueue a push to `this.cloud` reconciled by `this.sync`.
    void this.cloud;
    void this.sync;
  }

  async delete(id: string): Promise<void> {
    await this.local.delete(id);
    // v3: enqueue a tombstone push.
  }
}
