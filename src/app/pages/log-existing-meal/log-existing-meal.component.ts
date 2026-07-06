import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Ingredient, Meal, MealItem } from '../../models';
import { IngredientsService } from '../../services/ingredients.service';
import { LogService } from '../../services/log.service';
import { MealsService } from '../../services/meals.service';
import { ProfilesService } from '../../services/profiles.service';
import { computeMealTotals, MacroTotals } from '../../utils/macro-calc.util';
import { getBucharestToday } from '../../utils/timezone.util';

@Component({
  selector: 'app-log-existing-meal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Log existing meal</h2>

    <ng-container *ngIf="!selectedMeal">
      <input class="search-input" placeholder="Search meals…" [(ngModel)]="searchQuery" />
      <div class="result-list" *ngIf="filteredMeals.length; else noMeals">
        <button class="result-item" *ngFor="let meal of filteredMeals" (click)="selectMeal(meal)">
          <span>{{ meal.name }}</span>
          <span class="muted">{{ meal.category }}</span>
        </button>
      </div>
      <ng-template #noMeals>
        <p class="muted">No meals match "{{ searchQuery }}".</p>
      </ng-template>
    </ng-container>

    <ng-container *ngIf="selectedMeal as meal">
      <h3>{{ meal.name }}</h3>

      <div class="item-row" *ngFor="let item of editItems">
        <span class="name">{{ ingredientName(item.ingredientId) }}</span>
        <input type="number" min="0" [(ngModel)]="item.amountGrams" />
        g
      </div>

      <div class="totals-bar">
        <span>{{ liveTotals.calories | number: '1.0-0' }} kcal</span>
        <span>{{ liveTotals.protein | number: '1.0-1' }} g protein</span>
      </div>

      <div class="btn-row">
        <button class="btn btn-primary" (click)="confirm()">Log this meal</button>
        <button class="btn" (click)="backToSearch()">Back</button>
      </div>
    </ng-container>

    <div class="btn-row" *ngIf="!selectedMeal">
      <button class="btn" (click)="cancel()">Cancel</button>
    </div>
  `,
})
export class LogExistingMealComponent implements OnInit {
  searchQuery = '';
  selectedMeal: Meal | null = null;
  editItems: MealItem[] = [];

  private allMeals: Meal[] = [];
  private allIngredients: Ingredient[] = [];

  constructor(
    private mealsService: MealsService,
    private ingredientsService: IngredientsService,
    private logService: LogService,
    private profilesService: ProfilesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.allMeals = this.mealsService.getAll();
    this.allIngredients = this.ingredientsService.getAll();
  }

  get filteredMeals(): Meal[] {
    const query = this.searchQuery.trim().toLowerCase();
    const source = query ? this.allMeals.filter((meal) => meal.name.toLowerCase().includes(query)) : this.allMeals;
    return source.slice(0, 20);
  }

  get liveTotals(): MacroTotals {
    if (!this.selectedMeal) {
      return { calories: 0, protein: 0 };
    }
    return computeMealTotals(this.selectedMeal, this.allIngredients, this.editItems);
  }

  ingredientName(id: string): string {
    return this.allIngredients.find((ingredient) => ingredient.id === id)?.name ?? '(unknown)';
  }

  selectMeal(meal: Meal): void {
    this.selectedMeal = meal;
    this.editItems = meal.items.map((item) => ({ ...item }));
  }

  backToSearch(): void {
    this.selectedMeal = null;
    this.editItems = [];
  }

  confirm(): void {
    const meal = this.selectedMeal;
    if (!meal) {
      return;
    }
    const profile = this.profilesService.getActiveProfile();
    if (!profile) {
      return;
    }
    const totals = this.liveTotals;
    this.logService.addEntry({
      profileId: profile.id,
      date: getBucharestToday(),
      type: 'meal',
      refId: meal.id,
      itemsOverride: this.editItems,
      timestamp: new Date().toISOString(),
      computedCalories: totals.calories,
      computedProtein: totals.protein,
    });
    this.router.navigateByUrl('/today');
  }

  cancel(): void {
    this.router.navigateByUrl('/home');
  }
}
