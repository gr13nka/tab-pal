import type { Palette } from "../domain/palette";
import { fromJSON, toJSON } from "../domain/serialization";
import { toLegacyTxt } from "./legacy";
import type { PaletteStore, PaletteSummary } from "./types";

const DIR = "palettes";

// The fs plugin is imported lazily so it is never bundled into the web build and
// only loads inside the Tauri runtime (where this store is selected).
function fs() {
  return import("@tauri-apps/plugin-fs");
}

function slug(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "palette"
  );
}

/**
 * Native (desktop/mobile) storage. Each palette is written twice under the app
 * data dir: a canonical `<id>.json` (full fidelity, stable id) and a
 * human/Python-interop `<name>.txt` (one #rrggbb per line — the legacy format).
 * Reads go through `fromJSON`, so schema migrations always run.
 */
export class TauriFsPaletteStore implements PaletteStore {
  private async ensureDir(): Promise<void> {
    const { exists, mkdir, BaseDirectory } = await fs();
    if (!(await exists(DIR, { baseDir: BaseDirectory.AppData }))) {
      await mkdir(DIR, { baseDir: BaseDirectory.AppData, recursive: true });
    }
  }

  async list(): Promise<PaletteSummary[]> {
    const { readDir, readTextFile, BaseDirectory } = await fs();
    await this.ensureDir();
    const entries = await readDir(DIR, { baseDir: BaseDirectory.AppData });
    const out: PaletteSummary[] = [];
    for (const entry of entries) {
      if (!entry.isFile || !entry.name.endsWith(".json")) continue;
      try {
        const raw: unknown = JSON.parse(
          await readTextFile(`${DIR}/${entry.name}`, { baseDir: BaseDirectory.AppData }),
        );
        const p = fromJSON(raw);
        out.push({ id: p.id, name: p.name, updatedAt: p.updatedAt, count: p.colors.length });
      } catch {
        // Skip unreadable / non-palette files.
      }
    }
    return out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async get(id: string): Promise<Palette | null> {
    const { exists, readTextFile, BaseDirectory } = await fs();
    const path = `${DIR}/${id}.json`;
    if (!(await exists(path, { baseDir: BaseDirectory.AppData }))) return null;
    const raw: unknown = JSON.parse(
      await readTextFile(path, { baseDir: BaseDirectory.AppData }),
    );
    return fromJSON(raw);
  }

  async put(palette: Palette): Promise<void> {
    const { writeTextFile, BaseDirectory } = await fs();
    await this.ensureDir();
    await writeTextFile(
      `${DIR}/${palette.id}.json`,
      JSON.stringify(toJSON(palette), null, 2),
      { baseDir: BaseDirectory.AppData },
    );
    await writeTextFile(
      `${DIR}/${slug(palette.name)}.txt`,
      toLegacyTxt(palette.colors.map((c) => c.hex)),
      { baseDir: BaseDirectory.AppData },
    );
  }

  async delete(id: string): Promise<void> {
    const { exists, readTextFile, remove, BaseDirectory } = await fs();
    const path = `${DIR}/${id}.json`;
    let name: string | null = null;
    if (await exists(path, { baseDir: BaseDirectory.AppData })) {
      try {
        const raw: unknown = JSON.parse(
          await readTextFile(path, { baseDir: BaseDirectory.AppData }),
        );
        name = fromJSON(raw).name;
      } catch {
        // ignore — still remove the json below
      }
      await remove(path, { baseDir: BaseDirectory.AppData });
    }
    if (name) {
      const txt = `${DIR}/${slug(name)}.txt`;
      if (await exists(txt, { baseDir: BaseDirectory.AppData })) {
        await remove(txt, { baseDir: BaseDirectory.AppData });
      }
    }
  }
}
