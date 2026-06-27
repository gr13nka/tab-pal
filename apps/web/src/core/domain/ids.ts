/** Stable, collision-resistant id for a palette (used as the sync identity key). */
export function newId(): string {
  return crypto.randomUUID();
}
