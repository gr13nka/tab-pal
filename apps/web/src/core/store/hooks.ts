import { useStore } from "zustand";
import { useShallow } from "zustand/shallow";

import { usePaletteStore } from "./paletteStore";

/** Undo/redo controls backed by zundo's temporal store. */
export function useHistory() {
  return useStore(
    usePaletteStore.temporal,
    useShallow((t) => ({
      undo: t.undo,
      redo: t.redo,
      clear: t.clear,
      canUndo: t.pastStates.length > 0,
      canRedo: t.futureStates.length > 0,
    })),
  );
}

/** The active palette document. */
export function useActivePalette() {
  return usePaletteStore((s) => s.palette);
}
