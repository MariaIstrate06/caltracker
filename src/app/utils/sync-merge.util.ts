import { SyncDocument } from '../models/sync.model';

interface Identifiable {
  id: string;
  updatedAt: string;
}

/** Unions two arrays by id, keeping whichever side has the newer `updatedAt` per id. */
export function mergeById<T extends Identifiable>(local: T[], remote: T[]): T[] {
  const byId = new Map<string, T>();
  for (const item of remote) {
    byId.set(item.id, item);
  }
  for (const item of local) {
    const existing = byId.get(item.id);
    if (!existing || item.updatedAt >= existing.updatedAt) {
      byId.set(item.id, item);
    }
  }
  return Array.from(byId.values());
}

/** Merges two tombstone maps (id -> deletedAt ISO timestamp), keeping the later deletion per id. */
export function mergeTombstones(a: Record<string, string>, b: Record<string, string>): Record<string, string> {
  const merged: Record<string, string> = { ...a };
  for (const [id, deletedAt] of Object.entries(b)) {
    if (!merged[id] || deletedAt > merged[id]) {
      merged[id] = deletedAt;
    }
  }
  return merged;
}

/** Drops any record whose tombstone is newer than the record's own last edit, i.e. it was deleted after that edit. */
export function pruneTombstoned<T extends Identifiable>(items: T[], tombstones: Record<string, string>): T[] {
  return items.filter((item) => {
    const deletedAt = tombstones[item.id];
    return !deletedAt || deletedAt < item.updatedAt;
  });
}

/** Ids present in `baseline` but missing from `current` — i.e. deleted locally since the last sync. */
export function diffDeletedIds<T extends { id: string }>(baseline: T[], current: T[]): string[] {
  const currentIds = new Set(current.map((item) => item.id));
  return baseline.filter((item) => !currentIds.has(item.id)).map((item) => item.id);
}

/** Merges two full sync documents: union each collection by id (newest wins), merge tombstones, then prune deletions. */
export function mergeSyncDocuments(local: SyncDocument, remote: SyncDocument): SyncDocument {
  const tombstones = mergeTombstones(local.tombstones, remote.tombstones);
  const prune = <T extends Identifiable>(items: T[]) => pruneTombstoned(items, tombstones);

  return {
    profiles: prune(mergeById(local.profiles, remote.profiles)),
    ingredients: prune(mergeById(local.ingredients, remote.ingredients)),
    meals: prune(mergeById(local.meals, remote.meals)),
    drinks: prune(mergeById(local.drinks, remote.drinks)),
    logEntries: prune(mergeById(local.logEntries, remote.logEntries)),
    tombstones,
  };
}

export function emptySyncDocument(): SyncDocument {
  return { profiles: [], ingredients: [], meals: [], drinks: [], logEntries: [], tombstones: {} };
}
