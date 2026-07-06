export interface MealItem {
  ingredientId: string;
  amountGrams: number;
}

export type MealCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Meal {
  id: string;
  name: string;
  category: MealCategory;
  items: MealItem[];
  updatedAt: string;
}
