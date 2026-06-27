import { CURRENT_SCHEMA_VERSION } from "./palette";

type RawRecord = Record<string, unknown>;

/** Upgrades a stored record from version n to n+1 (total and additive). */
type Migration = (raw: RawRecord) => RawRecord;

/**
 * Keyed by the version being upgraded FROM. Every read path (IndexedDB, native
 * .txt/sidecar, cloud, import) runs `migrate` first, so all converge on the
 * current schema. Add a field later => bump CURRENT_SCHEMA_VERSION + add a step.
 */
const migrations: Record<number, Migration> = {
  // v0 (pre-versioned / legacy) -> v1: ensure type + metadata exist.
  0: (raw) => ({
    ...raw,
    type: raw.type ?? "regular",
    metadata: raw.metadata ?? {},
    schemaVersion: 1,
  }),
};

export function migrate(raw: RawRecord): RawRecord {
  let current = raw;
  let version = typeof current.schemaVersion === "number" ? current.schemaVersion : 0;
  while (version < CURRENT_SCHEMA_VERSION) {
    const step = migrations[version];
    if (!step) throw new Error(`no migration from schema version ${version}`);
    current = step(current);
    const next = typeof current.schemaVersion === "number" ? current.schemaVersion : version + 1;
    if (next <= version) throw new Error(`migration from ${version} did not advance the version`);
    version = next;
  }
  return current;
}
