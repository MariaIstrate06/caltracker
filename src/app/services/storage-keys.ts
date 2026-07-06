/** Single source of truth for localStorage keys, so SyncService knows exactly which keys are syncable app data. */
export const STORAGE_KEYS = {
  profiles: 'caltrack.profiles',
  activeProfileId: 'caltrack.activeProfileId',
  ingredients: 'caltrack.ingredients',
  meals: 'caltrack.meals',
  drinks: 'caltrack.drinks',
  logEntries: 'caltrack.logEntries',
  githubToken: 'caltrack.githubToken',
  syncBaseline: 'caltrack.sync.baseline',
  syncDirty: 'caltrack.sync.dirty',
  syncLastSyncedAt: 'caltrack.sync.lastSyncedAt',
} as const;

/** Keys that make up the single JSON document synced to GitHub. Everything else (active profile, token, sync bookkeeping) stays device-local. */
export const SYNCABLE_KEYS: string[] = [
  STORAGE_KEYS.profiles,
  STORAGE_KEYS.ingredients,
  STORAGE_KEYS.meals,
  STORAGE_KEYS.drinks,
  STORAGE_KEYS.logEntries,
];
