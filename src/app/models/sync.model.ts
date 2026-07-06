import { DailyLogEntry } from './daily-log-entry.model';
import { Drink } from './drink.model';
import { Ingredient } from './ingredient.model';
import { Meal } from './meal.model';
import { Profile } from './profile.model';

/** The single JSON document synced to store.json on the `data` branch. */
export interface SyncDocument {
  profiles: Profile[];
  ingredients: Ingredient[];
  meals: Meal[];
  drinks: Drink[];
  logEntries: DailyLogEntry[];
  /** Record id -> ISO deletion timestamp, so deletes can outrace a stale copy of the record during merge. */
  tombstones: Record<string, string>;
}

export type SyncState = 'offline' | 'syncing' | 'synced' | 'error';

export interface SyncStatus {
  state: SyncState;
  lastSyncedAt: string | null;
  error: string | null;
}
