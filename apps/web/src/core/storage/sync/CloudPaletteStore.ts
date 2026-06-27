import type { Palette } from "../../domain/palette";
import type { PaletteStore, PaletteSummary } from "../types";
import type { AuthProvider } from "./AuthProvider";

/**
 * v3 seam (not implemented): a remote PaletteStore (e.g. Supabase). Because it
 * implements the same `PaletteStore` interface, no tool or store code changes
 * when it lands — only the StorageProvider injection.
 */
export class CloudPaletteStore implements PaletteStore {
  constructor(private readonly opts: { baseUrl: string; auth: AuthProvider }) {}

  private notImplemented(): never {
    throw new Error(`CloudPaletteStore (${this.opts.baseUrl}) is not implemented until v3`);
  }

  list(): Promise<PaletteSummary[]> {
    return this.notImplemented();
  }
  get(_id: string): Promise<Palette | null> {
    return this.notImplemented();
  }
  put(_palette: Palette): Promise<void> {
    return this.notImplemented();
  }
  delete(_id: string): Promise<void> {
    return this.notImplemented();
  }
}
