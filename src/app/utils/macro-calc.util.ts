import { DailyLogEntry } from '../models/daily-log-entry.model';
import { Drink } from '../models/drink.model';
import { Ingredient } from '../models/ingredient.model';
import { Meal, MealItem } from '../models/meal.model';

export interface MacroTotals {
  calories: number;
  protein: number;
}

const ZERO_TOTALS: MacroTotals = { calories: 0, protein: 0 };

/** Computes total calories/protein for a meal, using itemsOverride instead of meal.items when provided. */
export function computeMealTotals(
  meal: Pick<Meal, 'items'>,
  ingredients: Ingredient[],
  itemsOverride?: MealItem[]
): MacroTotals {
  const items = itemsOverride ?? meal.items;
  const ingredientsById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));

  return items.reduce<MacroTotals>((totals, item) => {
    const ingredient = ingredientsById.get(item.ingredientId);
    if (!ingredient) {
      return totals;
    }
    const factor = item.amountGrams / 100;
    return {
      calories: totals.calories + ingredient.caloriesPer100g * factor,
      protein: totals.protein + ingredient.proteinPer100g * factor,
    };
  }, ZERO_TOTALS);
}

/** Computes total calories/protein for `quantity` servings of a drink. */
export function computeDrinkTotals(drink: Pick<Drink, 'calories' | 'protein'>, quantity = 1): MacroTotals {
  return { calories: drink.calories * quantity, protein: drink.protein * quantity };
}

/** Sums the snapshot totals across a set of log entries (e.g. all entries for one day). */
export function computeDayTotals(entries: Pick<DailyLogEntry, 'computedCalories' | 'computedProtein'>[]): MacroTotals {
  return entries.reduce<MacroTotals>(
    (totals, entry) => ({
      calories: totals.calories + entry.computedCalories,
      protein: totals.protein + entry.computedProtein,
    }),
    ZERO_TOTALS
  );
}
