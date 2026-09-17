import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MealEditorComponent } from '../../components/meal-editor/meal-editor.component';
import { Ingredient, Meal, MealItem } from '../../models';
import { IngredientsService } from '../../services/ingredients.service';
import { LogService } from '../../services/log.service';
import { MealsService } from '../../services/meals.service';
import { deletedEntityLabel } from '../../utils/deleted-entity.util';
import { computeMealTotals, MealMacroTotals } from '../../utils/macro-calc.util';
import { DEFAULT_MEAL_ICON } from '../../utils/meal-icons.util';
import { getBucharestToday } from '../../utils/timezone.util';

type View = 'search' | 'portion' | 'create';

@Component({
  selector: 'app-log-meal',
  standalone: true,
  imports: [CommonModule, FormsModule, MealEditorComponent],
  template: `
    <h2>Log a meal</h2>

    <ng-container *ngIf="view === 'search'">
      <div class="search-bar">
        <input class="search-input" placeholder="Search meals…" [(ngModel)]="searchQuery" />
        <button type="button" class="search-bar-action" (click)="startCreate()">+ Add a new meal</button>
      </div>
      <div class="result-list" *ngIf="filteredMeals.length">
        <button class="result-item" *ngFor="let meal of filteredMeals" (click)="selectMeal(meal)">
          <span>{{ meal.icon || defaultIcon }} {{ meal.name }}</span>
          <span class="muted">{{ meal.category }}</span>
        </button>
      </div>
      <p *ngIf="searchQuery && !filteredMeals.length" class="muted">No meals match "{{ searchQuery }}".</p>

      <div class="btn-row">
        <button class="btn" (click)="cancel()">Cancel</button>
      </div>
    </ng-container>

    <ng-container *ngIf="view === 'portion' && selectedMeal as meal">
      <h3>{{ meal.icon || defaultIcon }} {{ meal.name }}</h3>

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
        <button class="btn btn-primary" (click)="confirmPortion()">Log this meal</button>
        <button class="btn" (click)="backToSearch()">Back</button>
      </div>
    </ng-container>

    <app-meal-editor *ngIf="view === 'create'" actions="log" (logged)="onLogged()" (cancelled)="backToSearch()" />
  `,
})
export class LogMealComponent implements OnInit {
  view: View = 'search';
  searchQuery = '';
  selectedMeal: Meal | null = null;
  editItems: MealItem[] = [];
  readonly defaultIcon = DEFAULT_MEAL_ICON;

  private allMeals: Meal[] = [];
  private allIngredients: Ingredient[] = [];

  constructor(
    private mealsService: MealsService,
    private ingredientsService: IngredientsService,
    private logService: LogService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    [this.allMeals, this.allIngredients] = await Promise.all([this.mealsService.getAll(), this.ingredientsService.getAll()]);
    this.cdr.detectChanges();
  }

  get filteredMeals(): Meal[] {
    const query = this.searchQuery.trim().toLowerCase();
    const source = query ? this.allMeals.filter((meal) => meal.name.toLowerCase().includes(query)) : this.allMeals;
    return source.slice(0, 20);
  }

  get liveTotals(): MealMacroTotals {
    if (!this.selectedMeal) {
      return { calories: 0, protein: 0, carbs: 0, fibre: 0 };
    }
    return computeMealTotals(this.selectedMeal, this.allIngredients, this.editItems);
  }

  ingredientName(id: string): string {
    return this.allIngredients.find((ingredient) => ingredient.id === id)?.name ?? deletedEntityLabel('ingredient');
  }

  selectMeal(meal: Meal): void {
    this.selectedMeal = meal;
    this.editItems = meal.items.map((item) => ({ ...item }));
    this.view = 'portion';
  }

  startCreate(): void {
    this.view = 'create';
  }

  backToSearch(): void {
    this.selectedMeal = null;
    this.editItems = [];
    this.view = 'search';
  }

  async confirmPortion(): Promise<void> {
    const meal = this.selectedMeal;
    if (!meal) {
      return;
    }
    const totals = this.liveTotals;
    await this.logService.addEntry({
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

  onLogged(): void {
    this.router.navigateByUrl('/today');
  }

  cancel(): void {
    this.router.navigateByUrl('/home');
  }
}
