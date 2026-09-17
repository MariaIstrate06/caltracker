import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MealEditorComponent } from '../../components/meal-editor/meal-editor.component';
import { Drink, Ingredient, Meal, Snack } from '../../models';
import { DrinksService } from '../../services/drinks.service';
import { IngredientsService } from '../../services/ingredients.service';
import { MealsService } from '../../services/meals.service';
import { SnacksService } from '../../services/snacks.service';
import { deletedEntityLabel } from '../../utils/deleted-entity.util';
import { computeMealTotals, MealMacroTotals } from '../../utils/macro-calc.util';
import { DEFAULT_MEAL_ICON } from '../../utils/meal-icons.util';

type Section = 'meals' | 'ingredients' | 'drinks' | 'snacks';
type MealView = 'list' | 'detail' | 'duplicate';

@Component({
  selector: 'app-browse',
  standalone: true,
  imports: [CommonModule, MealEditorComponent],
  template: `
    <h2>Browse</h2>

    <div class="tab-bar">
      <button [class.active]="section === 'meals'" (click)="section = 'meals'">Meals</button>
      <button [class.active]="section === 'ingredients'" (click)="section = 'ingredients'">Ingredients</button>
      <button [class.active]="section === 'drinks'" (click)="section = 'drinks'">Drinks</button>
      <button [class.active]="section === 'snacks'" (click)="section = 'snacks'">Snacks</button>
    </div>

    <ng-container *ngIf="section === 'meals'">
      <ng-container [ngSwitch]="mealView">
        <div *ngSwitchCase="'list'">
          <div class="table-scroll">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Meal</th>
                  <th>Category</th>
                  <th>Calories</th>
                </tr>
              </thead>
              <tbody>
                <tr class="clickable" *ngFor="let meal of meals" (click)="openMeal(meal)">
                  <td>{{ meal.icon || defaultIcon }} {{ meal.name }}</td>
                  <td>{{ meal.category }}</td>
                  <td>{{ mealTotals(meal).calories | number: '1.0-0' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="empty-state" *ngIf="!meals.length">No meals in the library yet.</div>
        </div>

        <ng-container *ngSwitchCase="'detail'">
          <ng-container *ngIf="selectedMeal as meal">
            <h3>{{ meal.icon || defaultIcon }} {{ meal.name }}</h3>
            <p class="muted">{{ meal.category }}</p>

            <div class="item-row" *ngFor="let item of meal.items">
              <span class="name">{{ ingredientName(item.ingredientId) }}</span>
              <span class="muted">{{ item.amountGrams }} g</span>
            </div>

            <div class="totals-bar">
              <span>{{ detailTotals.calories | number: '1.0-0' }} kcal</span>
              <span>{{ detailTotals.carbs | number: '1.0-1' }} g carbs</span>
              <span>{{ detailTotals.protein | number: '1.0-1' }} g protein</span>
              <span>{{ detailTotals.fibre | number: '1.0-1' }} g fibre</span>
            </div>

            <div class="btn-row">
              <button class="btn btn-primary" (click)="startDuplicate()">Duplicate</button>
              <button class="btn" (click)="backToList()">Back</button>
            </div>
          </ng-container>
        </ng-container>

        <div *ngSwitchCase="'duplicate'">
          <h3>Duplicate "{{ selectedMeal?.name }}"</h3>
          <app-meal-editor [seedMeal]="selectedMeal" mode="create" actions="library" (saved)="onDuplicated($event)" (cancelled)="mealView = 'detail'" />
        </div>
      </ng-container>
    </ng-container>

    <ng-container *ngIf="section === 'ingredients'">
      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th>Ingredient</th>
              <th>Cal/100g</th>
              <th>Carbs/100g</th>
              <th>Protein/100g</th>
              <th>Fibre/100g</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let ingredient of ingredients">
              <td>{{ ingredient.name }}</td>
              <td>{{ ingredient.caloriesPer100g }}</td>
              <td>{{ ingredient.carbsPer100g }}</td>
              <td>{{ ingredient.proteinPer100g }}</td>
              <td>{{ ingredient.fibrePer100g }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="empty-state" *ngIf="!ingredients.length">No ingredients in the library yet.</div>
    </ng-container>

    <ng-container *ngIf="section === 'drinks'">
      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th>Drink</th>
              <th>Calories</th>
              <th>Protein</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let drink of drinks">
              <td>{{ drink.name }}</td>
              <td>{{ drink.calories }}</td>
              <td>{{ drink.protein }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="empty-state" *ngIf="!drinks.length">No drinks in the library yet.</div>
    </ng-container>

    <ng-container *ngIf="section === 'snacks'">
      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th>Snack</th>
              <th>Calories</th>
              <th>Protein</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let snack of snacks">
              <td>{{ snack.name }}</td>
              <td>{{ snack.calories }}</td>
              <td>{{ snack.protein }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="empty-state" *ngIf="!snacks.length">No snacks in the library yet.</div>
    </ng-container>
  `,
})
export class BrowseComponent implements OnInit {
  section: Section = 'meals';
  mealView: MealView = 'list';
  selectedMeal: Meal | null = null;
  readonly defaultIcon = DEFAULT_MEAL_ICON;

  meals: Meal[] = [];
  ingredients: Ingredient[] = [];
  drinks: Drink[] = [];
  snacks: Snack[] = [];

  constructor(
    private mealsService: MealsService,
    private ingredientsService: IngredientsService,
    private drinksService: DrinksService,
    private snacksService: SnacksService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    [this.meals, this.ingredients, this.drinks, this.snacks] = await Promise.all([
      this.mealsService.getAll(),
      this.ingredientsService.getAll(),
      this.drinksService.getAll(),
      this.snacksService.getAll(),
    ]);
    this.meals = [...this.meals].sort((a, b) => a.name.localeCompare(b.name));
    this.cdr.detectChanges();
  }

  get detailTotals(): MealMacroTotals {
    if (!this.selectedMeal) {
      return { calories: 0, protein: 0, carbs: 0, fibre: 0 };
    }
    return computeMealTotals(this.selectedMeal, this.ingredients);
  }

  mealTotals(meal: Meal): MealMacroTotals {
    return computeMealTotals(meal, this.ingredients);
  }

  ingredientName(id: string): string {
    return this.ingredients.find((ingredient) => ingredient.id === id)?.name ?? deletedEntityLabel('ingredient');
  }

  openMeal(meal: Meal): void {
    this.selectedMeal = meal;
    this.mealView = 'detail';
  }

  backToList(): void {
    this.selectedMeal = null;
    this.mealView = 'list';
  }

  startDuplicate(): void {
    this.mealView = 'duplicate';
  }

  onDuplicated(newMeal: Meal): void {
    void this.refreshMeals();
    this.selectedMeal = newMeal;
    this.mealView = 'detail';
  }

  private async refreshMeals(): Promise<void> {
    this.meals = (await this.mealsService.getAll()).sort((a, b) => a.name.localeCompare(b.name));
    this.cdr.detectChanges();
  }
}
