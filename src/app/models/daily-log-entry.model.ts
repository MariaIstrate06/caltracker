import { MealItem } from './meal.model';

export type LogEntryType = 'meal' | 'drink';

export interface DailyLogEntry {
  id: string;
  profileId: string;
  /** ISO date string (yyyy-MM-dd), Europe/Bucharest calendar day. */
  date: string;
  type: LogEntryType;
  /** Meal.id or Drink.id, depending on `type`. */
  refId: string;
  /** Per-entry quantity edits, same shape as Meal.items. Only meaningful when type is 'meal'. */
  itemsOverride?: MealItem[];
  /** ISO timestamp of when the entry was logged. */
  timestamp: string;
  /** Snapshot of computed totals at logging time — later edits to the underlying meal/drink/ingredient must not change these. */
  computedCalories: number;
  computedProtein: number;
  /** ISO timestamp of last local write to this record; used for sync conflict resolution. */
  updatedAt: string;
}
