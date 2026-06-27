// v3 seam (interface only): reconciles a local and a cloud store by last-write-wins
// on (id, updatedAt); deletes are tombstones by id.

export type SyncStatus = "idle" | "syncing" | "error" | "offline";

export interface SyncResult {
  pushed: number;
  pulled: number;
  conflicts: number;
}

export interface SyncEngine {
  readonly status: SyncStatus;
  sync(): Promise<SyncResult>;
}
