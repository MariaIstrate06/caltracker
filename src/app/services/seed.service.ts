import { Injectable } from '@angular/core';
import { MealCategory } from '../models';
import { SEED_MEAL_ICONS } from '../utils/meal-icons.util';
import { DrinksService } from './drinks.service';
import { IngredientsService } from './ingredients.service';
import { MealsService } from './meals.service';

interface SeedDataFile {
  ingredients: Array<{ id: string; name: string; caloriesPer100g: number; proteinPer100g: number }>;
  drinks: Array<{ id: string; name: string; calories: number; protein: number }>;
  meals: Array<{
    id: string;
    name: string;
    category: MealCategory;
    items: Array<{ ingredientId: string; amount: number }>;
  }>;
}

/** Loads assets/seed-data.json into empty stores on first run. Never overwrites existing user data. */
@Injectable({ providedIn: 'root' })
export class SeedService {
  constructor(
    private ingredientsService: IngredientsService,
    private drinksService: DrinksService,
    private mealsService: MealsService
  ) {}

  async seedIfNeeded(): Promise<void> {
    const needsIngredients = this.ingredientsService.getAll().length === 0;
    const needsDrinks = this.drinksService.getAll().length === 0;
    const needsMeals = this.mealsService.getAll().length === 0;

    if (needsIngredients || needsDrinks || needsMeals) {
      try {
        const response = await fetch('assets/seed-data.json');
        if (response.ok) {
          const data = (await response.json()) as SeedDataFile;
          const now = new Date().toISOString();

          this.ingredientsService.seedIfEmpty(data.ingredients.map((ingredient) => ({ ...ingredient, updatedAt: now })));
          this.drinksService.seedIfEmpty(data.drinks.map((drink) => ({ ...drink, updatedAt: now })));
          this.mealsService.seedIfEmpty(
            data.meals.map((meal) => ({
              id: meal.id,
              name: meal.name,
              category: meal.category,
              icon: SEED_MEAL_ICONS[meal.id],
              items: meal.items.map((item) => ({ ingredientId: item.ingredientId, amountGrams: item.amount })),
              updatedAt: now,
            }))
          );
        }
      } catch (error) {
        console.error('Failed to load seed data', error);
      }
    }

    this.backfillSeedMealIcons();
  }

  /**
   * One-time, idempotent catch-up for libraries seeded before meal icons existed: assigns the
   * same icon a fresh seed would get to any seed meal that's still missing one. Runs on every
   * boot but is a no-op once every seed meal has an icon (the `!meal.icon` guard short-circuits it).
   */
  private backfillSeedMealIcons(): void {
    for (const meal of this.mealsService.getAll()) {
      const icon = SEED_MEAL_ICONS[meal.id];
      if (icon && !meal.icon) {
        this.mealsService.update(meal.id, { icon });
      }
    }
  }
}
