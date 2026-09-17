import { DailyLogEntry } from '../models/daily-log-entry.model';
import { Drink } from '../models/drink.model';
import { Ingredient } from '../models/ingredient.model';
import { Meal, MealItem } from '../models/meal.model';

export interface MacroTotals {
  calories: number;
  protein: number;
}

/** Meals are ingredient-composed, so their live totals can additionally show carbs/fibre — unlike
 *  drinks/snacks (flat calories+protein only) and logged entries (which snapshot calories+protein only). */
export interface MealMacroTotals extends MacroTotals {
  carbs: number;
  fibre: number;
}

const ZERO_TOTALS: MacroTotals = { calories: 0, protein: 0 };
const ZERO_MEAL_TOTALS: MealMacroTotals = { calories: 0, protein: 0, carbs: 0, fibre: 0 };

/** Computes total calories/protein/carbs/fibre for a meal, using itemsOverride instead of meal.items when provided. */
export function computeMealTotals(
  meal: Pick<Meal, 'items'>,
  ingredients: Ingredient[],
  itemsOverride?: MealItem[]
): MealMacroTotals {
  const items = itemsOverride ?? meal.items;
  const ingredientsById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));

  return items.reduce<MealMacroTotals>((totals, item) => {
    const ingredient = ingredientsById.get(item.ingredientId);
    if (!ingredient) {
      return totals;
    }
    const factor = item.amountGrams / 100;
    return {
      calories: totals.calories + ingredient.caloriesPer100g * factor,
      protein: totals.protein + ingredient.proteinPer100g * factor,
      carbs: totals.carbs + ingredient.carbsPer100g * factor,
      fibre: totals.fibre + ingredient.fibrePer100g * factor,
    };
  }, ZERO_MEAL_TOTALS);
}

/** Computes total calories/protein for `quantity` servings of a drink. */
export function computeDrinkTotals(drink: Pick<Drink, 'calories' | 'protein'>, quantity = 1): MacroTotals {
  return { calories: drink.calories * quantity, protein: drink.protein * quantity };
}

/** Scales a snapshot of totals from one quantity to another (e.g. editing a logged "2x Beer" entry to 3x), without depending on the drink's current live definition. */
export function rescaleQuantity(totals: MacroTotals, fromQuantity: number, toQuantity: number): MacroTotals {
  if (fromQuantity <= 0) {
    return ZERO_TOTALS;
  }
  const factor = toQuantity / fromQuantity;
  return { calories: totals.calories * factor, protein: totals.protein * factor };
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
