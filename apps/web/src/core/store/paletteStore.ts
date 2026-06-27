import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { castDraft } from "immer";
import { temporal } from "zundo";

import type { Color } from "../domain/color";
import { createPalette, type Palette, type PaletteType } from "../domain/palette";

export interface PaletteState {
  /** The active document — the only state tracked by undo/redo. */
  palette: Palette;
  /** Per-swatch lock flags, parallel to `palette.colors`. Transient: never persisted, never in history. */
  locks: boolean[];

  setColors: (colors: Color[]) => void;
  replaceUnlocked: (candidates: Color[]) => void;
  setColorAt: (index: number, color: Color) => void;
  toggleLock: (index: number) => void;
  rename: (name: string) => void;
  setType: (type: PaletteType) => void;
  loadPalette: (palette: Palette) => void;
  newPalette: (type?: PaletteType) => void;
}

function stamp(palette: { updatedAt: string }): void {
  palette.updatedAt = new Date().toISOString();
}

// `Color` is an immutable value object that Immer treats as atomic; `castDraft`
// bridges its (readonly) types into the Immer draft without copying.
export const usePaletteStore = create<PaletteState>()(
  temporal(
    immer((set) => ({
      palette: createPalette(),
      locks: [],

      setColors: (colors) =>
        set((state) => {
          state.palette.colors = castDraft(colors);
          state.locks = colors.map(() => false);
          stamp(state.palette);
        }),

      replaceUnlocked: (candidates) =>
        set((state) => {
          const next = state.palette.colors.map((c, i) =>
            state.locks[i] ? c : (candidates[i] ?? c),
          );
          state.palette.colors = castDraft(next);
          stamp(state.palette);
        }),

      setColorAt: (index, color) =>
        set((state) => {
          state.palette.colors[index] = castDraft(color);
          stamp(state.palette);
        }),

      toggleLock: (index) =>
        set((state) => {
          state.locks[index] = !state.locks[index];
        }),

      rename: (name) =>
        set((state) => {
          state.palette.name = name;
          stamp(state.palette);
        }),

      setType: (type) =>
        set((state) => {
          state.palette.type = type;
          stamp(state.palette);
        }),

      loadPalette: (palette) =>
        set((state) => {
          state.palette = castDraft(palette);
          state.locks = palette.colors.map(() => false);
        }),

      newPalette: (type) =>
        set((state) => {
          state.palette = castDraft(createPalette(type ? { type } : {}));
          state.locks = [];
        }),
    })),
    {
      // Only the document is historized; transient `locks` are excluded.
      partialize: (state) => ({ palette: state.palette }),
      // Immer gives a fresh `palette` reference only when the document changed,
      // so reference equality cleanly skips lock-only updates from history.
      equality: (a, b) => a.palette === b.palette,
      limit: 100,
    },
  ),
);
