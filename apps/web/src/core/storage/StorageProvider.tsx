import { createContext, useContext, useMemo, type ReactNode } from "react";

import { IndexedDbPaletteStore } from "./IndexedDbPaletteStore";
import { TauriFsPaletteStore } from "./TauriFsPaletteStore";
import type { PaletteStore } from "./types";

const StorageContext = createContext<PaletteStore | null>(null);

/** True when running inside a Tauri (desktop/mobile) shell. */
export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/**
 * Select the storage implementation for the current platform. Web uses
 * IndexedDB; the native (Tauri fs) store is wired in during the Tauri phase.
 * When accounts/sync arrive, this is where a SyncingPaletteStore is injected.
 */
export function makePaletteStore(): PaletteStore {
  // Native shells store palettes on disk; the browser uses IndexedDB. Both sit
  // behind PaletteStore, so the UI never branches on platform.
  return isTauri() ? new TauriFsPaletteStore() : new IndexedDbPaletteStore();
}

export function StorageProvider({
  store,
  children,
}: {
  store?: PaletteStore;
  children: ReactNode;
}) {
  const value = useMemo(() => store ?? makePaletteStore(), [store]);
  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
}

export function useStorage(): PaletteStore {
  const store = useContext(StorageContext);
  if (!store) throw new Error("useStorage must be used within a StorageProvider");
  return store;
}
