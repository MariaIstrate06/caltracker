import { MealItem } from './meal.model';

export type LogEntryType = 'meal' | 'drink' | 'snack';

export interface DailyLogEntry {
  id: string;
  /** ISO date string (yyyy-MM-dd), Europe/Bucharest calendar day. */
  date: string;
  type: LogEntryType;
  /** Meal.id, Drink.id, or Snack.id depending on type. Null for a one-off meal that was never saved to the meal library. */
  refId: string | null;
  /** Display name for a one-off meal entry (refId === null). Ignored otherwise — library-backed entries get their name from the referenced Meal/Drink/Snack. */
  name?: string;
  /**
   * For 'meal' entries, the ingredient list to compute totals from.
   * - refId set: overrides the referenced meal's default items (present only if this entry's quantities were edited).
   * - refId null (one-off meal): this IS the full ingredient list, since there's no library meal to default from.
   */
  itemsOverride?: MealItem[];
  /** For 'drink'/'snack' entries, how many servings were logged (defaults to 1 if absent). */
  quantity?: number;
  /** ISO timestamp of when the entry was logged. */
  timestamp: string;
  /** Snapshot of computed totals at logging time — later edits to the underlying meal/drink/ingredient must not change these. */
  computedCalories: number;
  computedProtein: number;
}
