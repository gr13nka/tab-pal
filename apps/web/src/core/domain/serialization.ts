import { z } from "zod";

import { Color, type ColorJSON } from "./color";
import { migrate } from "./migrations";
import type { Palette, PaletteType } from "./palette";

/** The on-disk / on-wire shape (plain JSON, no derived fields, no class instances). */
export interface StoredPalette {
  id: string;
  name: string;
  type: PaletteType;
  colors: ColorJSON[];
  metadata: { tags?: string[]; source?: string; note?: string };
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
}

const ColorJSONSchema = z.object({
  hex: z.string(),
  alpha: z.number().optional(),
  name: z.string().optional(),
});

const StoredPaletteSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["regular", "ordered-sequential", "ordered-diverging"]),
  colors: z.array(ColorJSONSchema),
  metadata: z.object({
    tags: z.array(z.string()).optional(),
    source: z.string().optional(),
    note: z.string().optional(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
  schemaVersion: z.number(),
});

export function toJSON(palette: Palette): StoredPalette {
  return {
    id: palette.id,
    name: palette.name,
    type: palette.type,
    colors: palette.colors.map((c) => c.toJSON()),
    metadata: palette.metadata,
    createdAt: palette.createdAt,
    updatedAt: palette.updatedAt,
    schemaVersion: palette.schemaVersion,
  };
}

/** Validate + migrate any stored/imported record into a live Palette. */
export function fromJSON(raw: unknown): Palette {
  const migrated = migrate(raw as Record<string, unknown>);
  const v = StoredPaletteSchema.parse(migrated);
  return {
    id: v.id,
    name: v.name,
    type: v.type,
    colors: v.colors.map((c) => Color.fromJSON(c)),
    metadata: v.metadata,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
    schemaVersion: v.schemaVersion,
  };
}
