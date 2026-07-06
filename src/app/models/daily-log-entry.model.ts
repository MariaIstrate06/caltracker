import { MealItem } from './meal.model';

export type LogEntryType = 'meal' | 'drink';

export interface DailyLogEntry {
  id: string;
  profileId: string;
  /** ISO date string (yyyy-MM-dd), Europe/Bucharest calendar day. */
  date: string;
  type: LogEntryType;
  /** Meal.id or Drink.id. Null for a one-off meal (Log New Meal) that was never saved to the meal library. */
  refId: string | null;
  /** Display name for a one-off meal entry (refId === null). Ignored otherwise — library-backed entries get their name from the referenced Meal/Drink. */
  name?: string;
  /**
   * For 'meal' entries, the ingredient list to compute totals from.
   * - refId set: overrides the referenced meal's default items (present only if this entry's quantities were edited).
   * - refId null (one-off meal): this IS the full ingredient list, since there's no library meal to default from.
   */
  itemsOverride?: MealItem[];
  /** For 'drink' entries, how many servings were logged (defaults to 1 if absent). */
  quantity?: number;
  /** ISO timestamp of when the entry was logged. */
  timestamp: string;
  /** Snapshot of computed totals at logging time — later edits to the underlying meal/drink/ingredient must not change these. */
  computedCalories: number;
  computedProtein: number;
  /** ISO timestamp of last local write to this record; used for sync conflict resolution. */
  updatedAt: string;
}
