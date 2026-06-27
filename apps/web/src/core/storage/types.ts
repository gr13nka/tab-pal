import type { Palette } from "../domain/palette";

export interface PaletteSummary {
  id: string;
  name: string;
  updatedAt: string;
  count: number;
}

export type StoreChange = { type: "put"; id: string } | { type: "delete"; id: string };

/**
 * The single storage contract every tool depends on (via `useStorage()`), never
 * a concrete implementation. Async from day one so a cloud impl needs no
 * signature change. `watch` is interface-only in v1 (used by future sync).
 */
export interface PaletteStore {
  list(): Promise<PaletteSummary[]>;
  get(id: string): Promise<Palette | null>;
  put(palette: Palette): Promise<void>;
  delete(id: string): Promise<void>;
  watch?(cb: (event: StoreChange) => void): () => void;
}
