import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MealBuilderComponent } from '../../components/meal-builder/meal-builder.component';
import { Ingredient, Meal, MealCategory } from '../../models';
import { IngredientsService } from '../../services/ingredients.service';
import { MealsService } from '../../services/meals.service';
import { computeMealTotals, MacroTotals } from '../../utils/macro-calc.util';

const CATEGORIES: MealCategory[] = ['breakfast', 'lunch', 'dinner', 'snack'];

interface CategoryGroup {
  category: MealCategory;
  meals: Meal[];
}

type View = 'list' | 'detail' | 'duplicate';

@Component({
  selector: 'app-browse',
  standalone: true,
  imports: [CommonModule, MealBuilderComponent],
  template: `
    <h2>Browse meals</h2>

    <ng-container [ngSwitch]="view">
      <div *ngSwitchCase="'list'">
        <div class="card" *ngFor="let group of groupedMeals">
          <h3>{{ group.category }}</h3>
          <div class="result-list">
            <button class="result-item" *ngFor="let meal of group.meals" (click)="openMeal(meal)">
              <span>{{ meal.name }}</span>
            </button>
          </div>
        </div>
        <div class="empty-state" *ngIf="!groupedMeals.length">No meals in the library yet.</div>
      </div>

      <ng-container *ngSwitchCase="'detail'">
        <ng-container *ngIf="selectedMeal as meal">
          <h3>{{ meal.name }}</h3>
          <p class="muted">{{ meal.category }}</p>

          <div class="item-row" *ngFor="let item of meal.items">
            <span class="name">{{ ingredientName(item.ingredientId) }}</span>
            <span class="muted">{{ item.amountGrams }} g</span>
          </div>

          <div class="totals-bar">
            <span>{{ detailTotals.calories | number: '1.0-0' }} kcal</span>
            <span>{{ detailTotals.protein | number: '1.0-1' }} g protein</span>
          </div>

          <div class="btn-row">
            <button class="btn btn-primary" (click)="startDuplicate()">Duplicate</button>
            <button class="btn" (click)="backToList()">Back</button>
          </div>
        </ng-container>
      </ng-container>

      <div *ngSwitchCase="'duplicate'">
        <h3>Duplicate "{{ selectedMeal?.name }}"</h3>
        <app-meal-builder [seedMeal]="selectedMeal" mode="create" (saved)="onDuplicated($event)" (cancelled)="view = 'detail'" />
      </div>
    </ng-container>
  `,
})
export class BrowseComponent implements OnInit {
  view: View = 'list';
  selectedMeal: Meal | null = null;
  groupedMeals: CategoryGroup[] = [];

  private allIngredients: Ingredient[] = [];

  constructor(
    private mealsService: MealsService,
    private ingredientsService: IngredientsService
  ) {}

  ngOnInit(): void {
    this.allIngredients = this.ingredientsService.getAll();
    this.refresh();
  }

  get detailTotals(): MacroTotals {
    if (!this.selectedMeal) {
      return { calories: 0, protein: 0 };
    }
    return computeMealTotals(this.selectedMeal, this.allIngredients);
  }

  ingredientName(id: string): string {
    return this.allIngredients.find((ingredient) => ingredient.id === id)?.name ?? '(deleted ingredient)';
  }

  openMeal(meal: Meal): void {
    this.selectedMeal = meal;
    this.view = 'detail';
  }

  backToList(): void {
    this.selectedMeal = null;
    this.view = 'list';
  }

  startDuplicate(): void {
    this.view = 'duplicate';
  }

  onDuplicated(newMeal: Meal): void {
    this.refresh();
    this.selectedMeal = newMeal;
    this.view = 'detail';
  }

  private refresh(): void {
    const allMeals = this.mealsService.getAll();
    this.groupedMeals = CATEGORIES.map((category) => ({
      category,
      meals: allMeals.filter((meal) => meal.category === category).sort((a, b) => a.name.localeCompare(b.name)),
    })).filter((group) => group.meals.length > 0);
  }
}
