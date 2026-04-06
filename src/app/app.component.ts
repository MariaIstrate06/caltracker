import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type IngredientCategory = 'Meat' | 'Carb' | 'Veggie' | 'Other';

interface IngredientTemplate {
  id: string;
  name: string;
  category: IngredientCategory;
  caloriesPer100g: number;
  proteinPer100g: number;
  custom?: boolean;
  unitType?: 'grams' | 'count';
  unitName?: string;
  caloriesPerUnit?: number;
  proteinPerUnit?: number;
}

interface MealIngredient {
  id: string;
  templateId: string | 'custom';
  category: IngredientCategory;
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  weight: number;
  custom: boolean;
  unitType?: 'grams' | 'count';
  unitName?: string;
  caloriesPerUnit?: number;
  proteinPerUnit?: number;
}

interface MealEntry {
  id: string;
  name: string;
  ingredients: MealIngredient[];
  totalCalories: number;
  totalProtein: number;
  createdAt: string;
}

interface CalTrackState {
  targetCalories: number;
  mealHistory: MealEntry[];
  customIngredients: IngredientTemplate[];
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'CalTrack';
  targetCalories = 2000;
  currentMealName = '';
  currentIngredients: MealIngredient[] = [];
  mealHistory: MealEntry[] = [];
  customIngredients: IngredientTemplate[] = [];
  categories: IngredientCategory[] = ['Meat', 'Carb', 'Veggie', 'Other'];
  showMealBuilder = false;

  constructor() {
    this.loadState();
    this.resetCurrentMeal();
  }

  get totalCalories() {
    return this.mealHistory.reduce((sum, meal) => sum + meal.totalCalories, 0);
  }

  get totalProtein() {
    return this.mealHistory.reduce((sum, meal) => sum + meal.totalProtein, 0);
  }

  get remainingCalories() {
    return this.targetCalories - (this.currentMealCalories + this.mealTodayCalories);
  }

  get trackingStatus() {
    return this.remainingCalories >= 0 ? 'good' : 'over';
  }

  get statusText() {
    return this.remainingCalories >= 0
      ? `You can still consume ${this.remainingCalories} cal today.`
      : `You are ${Math.abs(this.remainingCalories)} cal over today.`;
  }

  get currentMealCalories() {
    return this.currentIngredients.reduce((sum, item) => sum + this.ingredientTotalCalories(item), 0);
  }

  get currentMealProtein() {
    return this.currentIngredients.reduce((sum, item) => sum + this.ingredientTotalProtein(item), 0);
  }

  get mealTodayCalories() {
    return this.mealHistory.reduce((sum, meal) => sum + meal.totalCalories, 0);
  }

  get mealTodayProtein() {
    return this.mealHistory.reduce((sum, meal) => sum + meal.totalProtein, 0);
  }

  get todayCaloriesPercent() {
    return Math.min(100, Math.round((this.mealTodayCalories / this.targetCalories) * 100));
  }

  get todayProteinPercent() {
    return Math.min(100, Math.round((this.mealTodayProtein / 120) * 100));
  }

  get todayMealCount() {
    const todayKey = this.getBucharestDateKey(new Date());
    return this.mealHistory.filter((meal) => this.getBucharestDateKey(meal.createdAt) === todayKey).length;
  }

  get recentDaySummaries() {
    return [0, 1].map((offset) => {
      const dateKey = this.getDateKeyForOffset(offset);
      const meals = this.mealHistory.filter((meal) => this.getBucharestDateKey(meal.createdAt) === dateKey);
      return {
        label: offset === 0 ? 'Today' : 'Yesterday',
        calories: meals.reduce((sum, meal) => sum + meal.totalCalories, 0),
        protein: meals.reduce((sum, meal) => sum + meal.totalProtein, 0),
      };
    });
  }

  get allTemplates() {
    return [...this.defaultTemplates, ...this.customIngredients];
  }

  get defaultTemplates(): IngredientTemplate[] {
    return [
      { id: 'chicken-wings', name: 'Chicken wings', category: 'Meat', caloriesPer100g: 203, proteinPer100g: 30 },
      { id: 'chicken-filet', name: 'Chicken fillet', category: 'Meat', caloriesPer100g: 165, proteinPer100g: 31 },
      { id: 'chicken-breast', name: 'Chicken breast', category: 'Meat', caloriesPer100g: 165, proteinPer100g: 31 },
      { id: 'beef', name: 'Beef', category: 'Meat', caloriesPer100g: 250, proteinPer100g: 26 },
      { id: 'steak', name: 'Steak', category: 'Meat', caloriesPer100g: 271, proteinPer100g: 25 },
      { id: 'pork-chop', name: 'Pork chop', category: 'Meat', caloriesPer100g: 242, proteinPer100g: 26 },
      { id: 'pasta', name: 'Pasta', category: 'Carb', caloriesPer100g: 131, proteinPer100g: 5 },
      { id: 'noodles', name: 'Noodles', category: 'Carb', caloriesPer100g: 138, proteinPer100g: 4 },
      { id: 'rice', name: 'Rice', category: 'Carb', caloriesPer100g: 130, proteinPer100g: 2.7 },
      { id: 'bread', name: 'Bread', category: 'Carb', caloriesPer100g: 265, proteinPer100g: 9 },
      { id: 'potatoes-mashed', name: 'Potatoes (mashed)', category: 'Carb', caloriesPer100g: 117, proteinPer100g: 2.1 },
      { id: 'potatoes-fried', name: 'Potatoes (fried)', category: 'Carb', caloriesPer100g: 312, proteinPer100g: 3.4 },
      { id: 'potatoes-boiled', name: 'Potatoes (boiled)', category: 'Carb', caloriesPer100g: 87, proteinPer100g: 1.9 },
      { id: 'potatoes-airfried', name: 'Potatoes (airfried)', category: 'Carb', caloriesPer100g: 145, proteinPer100g: 2.6 },
      { id: 'tomato', name: 'Tomato', category: 'Veggie', caloriesPer100g: 18, proteinPer100g: 0.9, unitType: 'count', unitName: 'tomato', caloriesPerUnit: 18, proteinPerUnit: 0.9 },
      { id: 'onion', name: 'Onion', category: 'Veggie', caloriesPer100g: 40, proteinPer100g: 1.1, unitType: 'count', unitName: 'onion', caloriesPerUnit: 40, proteinPerUnit: 1.1 },
      { id: 'cucumber', name: 'Cucumber', category: 'Veggie', caloriesPer100g: 16, proteinPer100g: 0.7, unitType: 'count', unitName: 'cucumber', caloriesPerUnit: 16, proteinPerUnit: 0.7 },
      { id: 'pickle', name: 'Pickle', category: 'Veggie', caloriesPer100g: 11, proteinPer100g: 0.5, unitType: 'count', unitName: 'pickle', caloriesPerUnit: 11, proteinPerUnit: 0.5 },
      { id: 'green-salad', name: 'Green salad', category: 'Veggie', caloriesPer100g: 15, proteinPer100g: 1.4 },
      { id: 'carrot', name: 'Carrot', category: 'Veggie', caloriesPer100g: 41, proteinPer100g: 0.9, unitType: 'count', unitName: 'carrot', caloriesPerUnit: 41, proteinPerUnit: 0.9 },
    ];
  }

  addIngredientRow() {
    this.currentIngredients = [...this.currentIngredients, this.createIngredientRow('Other', null, true)];
  }

  openNewMeal() {
    this.showMealBuilder = true;
    this.resetCurrentMeal();
  }

  cancelMeal() {
    this.showMealBuilder = false;
    this.resetCurrentMeal();
  }

  removeIngredientRow(rowId: string) {
    this.currentIngredients = this.currentIngredients.filter((row) => row.id !== rowId);
  }

  onCategoryChange(row: MealIngredient, category: IngredientCategory) {
    row.category = category;
    const template = this.getFirstTemplateByCategory(category);
    if (template) {
      this.applyTemplate(row, template);
      row.custom = false;
      row.templateId = template.id;
      row.weight = template.unitType === 'count' ? 1 : 100;
    } else {
      row.custom = true;
      row.templateId = 'custom';
      row.name = '';
      row.caloriesPer100g = 100;
      row.proteinPer100g = 0;
      row.unitType = 'grams';
      row.unitName = undefined;
      row.caloriesPerUnit = undefined;
      row.proteinPerUnit = undefined;
      row.weight = 100;
    }
    this.saveState();
  }

  onIngredientChange(row: MealIngredient, value: string) {
    if (value === 'custom') {
      row.custom = true;
      row.templateId = 'custom';
      row.name = '';
      row.caloriesPer100g = 100;
      row.proteinPer100g = 0;
      this.saveState();
      return;
    }

    const template = this.getTemplate(value);
    if (template) {
      this.applyTemplate(row, template);
      row.custom = false;
      row.templateId = template.id;
      this.saveState();
    }
  }

  applyTemplate(row: MealIngredient, template: IngredientTemplate) {
    row.templateId = template.id;
    row.category = template.category;
    row.name = template.name;
    row.caloriesPer100g = template.caloriesPer100g;
    row.proteinPer100g = template.proteinPer100g;
    row.unitType = template.unitType ?? 'grams';
    row.unitName = template.unitName;
    row.caloriesPerUnit = template.caloriesPerUnit;
    row.proteinPerUnit = template.proteinPerUnit;
    row.custom = !!template.custom;
  }

  getTemplate(templateId: string | null): IngredientTemplate | undefined {
    return this.allTemplates.find((template) => template.id === templateId) ?? undefined;
  }

  getFirstTemplateByCategory(category: IngredientCategory) {
    return this.allTemplates.find((template) => template.category === category);
  }

  isCountBasedIngredient(ingredient: MealIngredient) {
    return ingredient.unitType === 'count';
  }

  getIngredientUnitLabel(ingredient: MealIngredient) {
    return this.isCountBasedIngredient(ingredient) ? ingredient.unitName ?? 'item' : 'g';
  }

  ingredientTotalCalories(ingredient: MealIngredient) {
    if (this.isCountBasedIngredient(ingredient)) {
      const perUnit = ingredient.caloriesPerUnit ?? ingredient.caloriesPer100g;
      return Math.round(perUnit * ingredient.weight);
    }
    return Math.round((ingredient.caloriesPer100g * ingredient.weight) / 100);
  }

  ingredientTotalProtein(ingredient: MealIngredient) {
    if (this.isCountBasedIngredient(ingredient)) {
      const perUnit = ingredient.proteinPerUnit ?? ingredient.proteinPer100g;
      return Number((perUnit * ingredient.weight).toFixed(1));
    }
    return Number(((ingredient.proteinPer100g * ingredient.weight) / 100).toFixed(1));
  }

  saveMeal() {
    if (!this.currentMealName.trim()) {
      return;
    }

    const ingredients = this.currentIngredients.filter((item) => item.name.trim() && item.weight > 0);
    if (!ingredients.length) {
      return;
    }

    if (!confirm('Save this meal to history?')) {
      return;
    }

    const entry: MealEntry = {
      id: this.randomId(),
      name: this.currentMealName.trim(),
      ingredients: ingredients.map((item) => ({ ...item })),
      totalCalories: this.currentMealCalories,
      totalProtein: Number(this.currentMealProtein.toFixed(1)),
      createdAt: new Date().toISOString(),
    };

    this.mealHistory = [entry, ...this.mealHistory];
    this.saveCustomRows(ingredients);
    this.saveState();
    this.resetCurrentMeal();
  }

  exportHistory() {
    const downloadData = JSON.stringify(this.getExportState(), null, 2);
    const blob = new Blob([downloadData], { type: 'application/json' });
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob);
    anchor.download = 'cal-track-history.json';
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  }

  handleImportFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as CalTrackState;
        this.mergeImportedState(parsed);
        this.saveState();
      } catch {
        alert('Failed to import JSON. Please provide a valid CalTrack export file.');
      }
    };
    reader.readAsText(file);
    input.value = '';
  }

  private mergeImportedState(state: CalTrackState) {
    const existingMealIds = new Set(this.mealHistory.map((meal) => meal.id));
    const mergedMeals = [...this.mealHistory];
    for (const meal of state.mealHistory ?? []) {
      if (!existingMealIds.has(meal.id)) {
        mergedMeals.push(meal);
      }
    }

    const savedTemplates = new Map(this.allTemplates.map((template) => [template.name.toLowerCase() + '|' + template.category, template]));
    const mergedCustoms = [...this.customIngredients];
    for (const template of state.customIngredients ?? []) {
      const key = template.name.toLowerCase() + '|' + template.category;
      if (!savedTemplates.has(key)) {
        mergedCustoms.push({ ...template, id: this.randomId(), custom: true });
        savedTemplates.set(key, template);
      }
    }

    if (typeof state.targetCalories === 'number') {
      this.targetCalories = state.targetCalories;
    }

    this.mealHistory = mergedMeals;
    this.customIngredients = mergedCustoms;
  }

  private saveCustomRows(ingredients: MealIngredient[]) {
    const keys = new Set(this.allTemplates.map((template) => template.name.toLowerCase() + '|' + template.category));
    for (const ingredient of ingredients) {
      if (!ingredient.custom || !ingredient.name.trim()) {
        continue;
      }

      const key = ingredient.name.toLowerCase() + '|' + ingredient.category;
      if (!keys.has(key)) {
        this.customIngredients = [
          ...this.customIngredients,
          {
            id: this.randomId(),
            name: ingredient.name.trim(),
            category: ingredient.category,
            caloriesPer100g: ingredient.caloriesPer100g,
            proteinPer100g: ingredient.proteinPer100g,
            custom: true,
          },
        ];
        keys.add(key);
      }
    }
  }

  private getExportState(): CalTrackState {
    return {
      targetCalories: this.targetCalories,
      mealHistory: this.mealHistory,
      customIngredients: this.customIngredients,
    };
  }

  private getBucharestDateKey(dateValue: string | Date) {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return date.toLocaleDateString('en-CA', { timeZone: 'Europe/Bucharest' });
  }

  private getDateKeyForOffset(offset: number) {
    const date = new Date(Date.now() - offset * 86400000);
    return date.toLocaleDateString('en-CA', { timeZone: 'Europe/Bucharest' });
  }

  saveState() {
    localStorage.setItem('calTrackState', JSON.stringify(this.getExportState()));
  }

  private loadState() {
    const saved = localStorage.getItem('calTrackState');
    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved) as CalTrackState;
      this.targetCalories = parsed.targetCalories ?? this.targetCalories;
      this.mealHistory = parsed.mealHistory ?? [];
      this.customIngredients = parsed.customIngredients ?? [];
    } catch {
      // Ignore invalid saved state.
    }
  }

  private resetCurrentMeal() {
    this.currentMealName = '';
    this.currentIngredients = [];
  }

  private createIngredientRow(category: IngredientCategory, templateId: string | null = null, custom = false): MealIngredient {
    const template = templateId ? this.getTemplate(templateId) : this.getFirstTemplateByCategory(category);
    if (template && !custom) {
      return {
        id: this.randomId(),
        templateId: template.id,
        category: template.category,
        name: template.name,
        caloriesPer100g: template.caloriesPer100g,
        proteinPer100g: template.proteinPer100g,
        weight: template.unitType === 'count' ? 1 : 100,
        custom: !!template.custom,
        unitType: template.unitType ?? 'grams',
        unitName: template.unitName,
        caloriesPerUnit: template.caloriesPerUnit,
        proteinPerUnit: template.proteinPerUnit,
      };
    }

    return {
      id: this.randomId(),
      templateId: 'custom',
      category,
      name: '',
      caloriesPer100g: 100,
      proteinPer100g: 0,
      weight: 100,
      custom: true,
      unitType: 'grams',
    };
  }

  private randomId() {
    return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
  }
}
