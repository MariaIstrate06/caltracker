export interface MealItem {
  ingredientId: string;
  amountGrams: number;
}

export type MealCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Meal {
  id: string;
  name: string;
  category: MealCategory;
  /** Emoji shown next to the meal wherever it's listed. Falls back to a generic default when unset. */
  icon?: string;
  items: MealItem[];
  updatedAt: string;
}
