import type { PaletteType } from "@tab-pal/engine";

import { Color } from "./color";
import { newId } from "./ids";

export type { PaletteType };

/** Bump when the persisted shape changes; add a matching migration (see migrations.ts). */
export const CURRENT_SCHEMA_VERSION = 1;

export interface PaletteMetadata {
  tags?: string[];
  source?: string;
  note?: string;
}

/** The single "document" the app edits and persists. */
export interface Palette {
  readonly id: string;
  readonly name: string;
  readonly colors: readonly Color[];
  readonly type: PaletteType;
  readonly metadata: PaletteMetadata;
  readonly createdAt: string; // ISO
  readonly updatedAt: string; // ISO — last-write-wins key for future sync
  readonly schemaVersion: number;
}

export function createPalette(init: Partial<Palette> = {}): Palette {
  const now = new Date().toISOString();
  return {
    id: init.id ?? newId(),
    name: init.name ?? "Untitled",
    colors: init.colors ?? [],
    type: init.type ?? "regular",
    metadata: init.metadata ?? {},
    createdAt: init.createdAt ?? now,
    updatedAt: init.updatedAt ?? now,
    schemaVersion: CURRENT_SCHEMA_VERSION,
  };
}
