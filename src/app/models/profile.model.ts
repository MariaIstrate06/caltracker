export type Theme = 'green' | 'pink';

export interface Profile {
  id: string;
  name: string;
  emoji: string;
  dailyCalorieGoal: number;
  dailyProteinGoal: number;
  theme: Theme;
  /** Drink/snack ids to show on Home's "Drinks & snacks available" card. */
  featuredDrinkIds: string[];
  featuredSnackIds: string[];
}
