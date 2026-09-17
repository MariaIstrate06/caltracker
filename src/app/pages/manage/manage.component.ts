import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IngredientFormComponent } from '../../components/ingredient-form/ingredient-form.component';
import { MealEditorComponent } from '../../components/meal-editor/meal-editor.component';
import { QuickItemFormComponent } from '../../components/quick-item-form/quick-item-form.component';
import { Drink, Ingredient, Meal, Snack } from '../../models';
import { ConfirmService } from '../../services/confirm.service';
import { DrinksService } from '../../services/drinks.service';
import { IngredientsService } from '../../services/ingredients.service';
import { MealsService } from '../../services/meals.service';
import { SnacksService } from '../../services/snacks.service';
import { computeMealTotals, MacroTotals } from '../../utils/macro-calc.util';
import { DEFAULT_MEAL_ICON } from '../../utils/meal-icons.util';

type Section = 'meals' | 'ingredients' | 'drinks' | 'snacks';

@Component({
  selector: 'app-manage',
  standalone: true,
  imports: [CommonModule, FormsModule, IngredientFormComponent, MealEditorComponent, QuickItemFormComponent],
  template: `
    <h2>Manage</h2>
    <p class="muted">Everything here is a shared library — edits apply for everyone. Past logs keep their historical values; only future logs use the update.</p>

    <div class="tab-bar">
      <button [class.active]="section === 'meals'" (click)="section = 'meals'">Meals</button>
      <button [class.active]="section === 'ingredients'" (click)="section = 'ingredients'">Ingredients</button>
      <button [class.active]="section === 'drinks'" (click)="section = 'drinks'">Drinks</button>
      <button [class.active]="section === 'snacks'" (click)="section = 'snacks'">Snacks</button>
    </div>

    <ng-container *ngIf="section === 'meals'">
      <ng-container *ngIf="!addingMeal && !editingMeal">
        <div class="search-bar">
          <input class="search-input" placeholder="Search meals…" [(ngModel)]="mealQuery" />
          <button type="button" class="search-bar-action" (click)="addingMeal = true">+ Add meal</button>
        </div>

        <div class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th>Meal</th>
                <th>Category</th>
                <th>Calories</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let meal of filteredMeals">
                <td>{{ meal.icon || defaultIcon }} {{ meal.name }}</td>
                <td>{{ meal.category }}</td>
                <td>{{ mealTotals(meal).calories | number: '1.0-0' }}</td>
                <td class="actions-cell">
                  <div class="btn-row">
                    <button class="btn btn-small" (click)="editingMeal = meal">Edit</button>
                    <button class="btn btn-small btn-danger" (click)="deleteMeal(meal)">Delete</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="empty-state" *ngIf="!filteredMeals.length">No meals match.</div>
      </ng-container>

      <ng-container *ngIf="addingMeal">
        <app-meal-editor mode="create" actions="library" (saved)="onMealSaved()" (cancelled)="addingMeal = false" />
      </ng-container>

      <ng-container *ngIf="editingMeal as meal">
        <app-meal-editor [seedMeal]="meal" mode="edit" actions="library" (saved)="onMealSaved()" (cancelled)="editingMeal = null" />
      </ng-container>
    </ng-container>

    <ng-container *ngIf="section === 'ingredients'">
      <div class="search-bar">
        <input class="search-input" placeholder="Search ingredients…" [(ngModel)]="ingredientQuery" />
        <button type="button" class="search-bar-action" (click)="addingIngredient = true; editingIngredient = null">+ Add ingredient</button>
      </div>
      <app-ingredient-form *ngIf="addingIngredient" (saved)="onIngredientSaved()" (cancelled)="addingIngredient = false" />

      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th>Ingredient</th>
              <th>Cal/100g</th>
              <th>Carbs/100g</th>
              <th>Protein/100g</th>
              <th>Fibre/100g</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <ng-container *ngFor="let ingredient of filteredIngredients">
              <tr *ngIf="editingIngredient?.id !== ingredient.id">
                <td>{{ ingredient.name }}</td>
                <td>{{ ingredient.caloriesPer100g }}</td>
                <td>{{ ingredient.carbsPer100g }}</td>
                <td>{{ ingredient.proteinPer100g }}</td>
                <td>{{ ingredient.fibrePer100g }}</td>
                <td class="actions-cell">
                  <div class="btn-row">
                    <button class="btn btn-small" (click)="addingIngredient = false; editingIngredient = ingredient">Edit</button>
                    <button class="btn btn-small btn-danger" (click)="deleteIngredient(ingredient)">Delete</button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="editingIngredient?.id === ingredient.id">
                <td colspan="6" class="edit-cell">
                  <app-ingredient-form [ingredient]="ingredient" (saved)="onIngredientSaved()" (cancelled)="editingIngredient = null" />
                </td>
              </tr>
            </ng-container>
          </tbody>
        </table>
      </div>
      <div class="empty-state" *ngIf="!filteredIngredients.length">No ingredients match.</div>
    </ng-container>

    <ng-container *ngIf="section === 'drinks'">
      <div class="search-bar">
        <input class="search-input" placeholder="Search drinks…" [(ngModel)]="drinkQuery" />
        <button type="button" class="search-bar-action" (click)="addingDrink = true; editingDrink = null">+ Add drink</button>
      </div>
      <app-quick-item-form *ngIf="addingDrink" [repo]="drinksService" itemLabel="Drink" (saved)="onDrinkSaved()" (cancelled)="addingDrink = false" />

      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th>Drink</th>
              <th>Calories</th>
              <th>Protein</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <ng-container *ngFor="let drink of filteredDrinks">
              <tr *ngIf="editingDrink?.id !== drink.id">
                <td>{{ drink.name }}</td>
                <td>{{ drink.calories }}</td>
                <td>{{ drink.protein }}</td>
                <td class="actions-cell">
                  <div class="btn-row">
                    <button class="btn btn-small" (click)="addingDrink = false; editingDrink = drink">Edit</button>
                    <button class="btn btn-small btn-danger" (click)="deleteDrink(drink)">Delete</button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="editingDrink?.id === drink.id">
                <td colspan="4" class="edit-cell">
                  <app-quick-item-form [repo]="drinksService" [item]="drink" itemLabel="Drink" (saved)="onDrinkSaved()" (cancelled)="editingDrink = null" />
                </td>
              </tr>
            </ng-container>
          </tbody>
        </table>
      </div>
      <div class="empty-state" *ngIf="!filteredDrinks.length">No drinks match.</div>
    </ng-container>

    <ng-container *ngIf="section === 'snacks'">
      <div class="search-bar">
        <input class="search-input" placeholder="Search snacks…" [(ngModel)]="snackQuery" />
        <button type="button" class="search-bar-action" (click)="addingSnack = true; editingSnack = null">+ Add snack</button>
      </div>
      <app-quick-item-form *ngIf="addingSnack" [repo]="snacksService" itemLabel="Snack" (saved)="onSnackSaved()" (cancelled)="addingSnack = false" />

      <div class="table-scroll">
        <table class="data-table">
          <thead>
            <tr>
              <th>Snack</th>
              <th>Calories</th>
              <th>Protein</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <ng-container *ngFor="let snack of filteredSnacks">
              <tr *ngIf="editingSnack?.id !== snack.id">
                <td>{{ snack.name }}</td>
                <td>{{ snack.calories }}</td>
                <td>{{ snack.protein }}</td>
                <td class="actions-cell">
                  <div class="btn-row">
                    <button class="btn btn-small" (click)="addingSnack = false; editingSnack = snack">Edit</button>
                    <button class="btn btn-small btn-danger" (click)="deleteSnack(snack)">Delete</button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="editingSnack?.id === snack.id">
                <td colspan="4" class="edit-cell">
                  <app-quick-item-form [repo]="snacksService" [item]="snack" itemLabel="Snack" (saved)="onSnackSaved()" (cancelled)="editingSnack = null" />
                </td>
              </tr>
            </ng-container>
          </tbody>
        </table>
      </div>
      <div class="empty-state" *ngIf="!filteredSnacks.length">No snacks match.</div>
    </ng-container>
  `,
})
export class ManageComponent implements OnInit {
  section: Section = 'meals';
  readonly defaultIcon = DEFAULT_MEAL_ICON;

  ingredients: Ingredient[] = [];
  ingredientQuery = '';
  addingIngredient = false;
  editingIngredient: Ingredient | null = null;

  meals: Meal[] = [];
  mealQuery = '';
  addingMeal = false;
  editingMeal: Meal | null = null;

  drinks: Drink[] = [];
  drinkQuery = '';
  addingDrink = false;
  editingDrink: Drink | null = null;

  snacks: Snack[] = [];
  snackQuery = '';
  addingSnack = false;
  editingSnack: Snack | null = null;

  constructor(
    public ingredientsService: IngredientsService,
    private mealsService: MealsService,
    public drinksService: DrinksService,
    public snacksService: SnacksService,
    private confirmService: ConfirmService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    [this.ingredients, this.meals, this.drinks, this.snacks] = await Promise.all([
      this.ingredientsService.getAll(),
      this.mealsService.getAll(),
      this.drinksService.getAll(),
      this.snacksService.getAll(),
    ]);
    this.cdr.detectChanges();
  }

  get filteredIngredients(): Ingredient[] {
    return this.filterByName(this.ingredients, this.ingredientQuery);
  }

  get filteredMeals(): Meal[] {
    return this.filterByName(this.meals, this.mealQuery);
  }

  get filteredDrinks(): Drink[] {
    return this.filterByName(this.drinks, this.drinkQuery);
  }

  get filteredSnacks(): Snack[] {
    return this.filterByName(this.snacks, this.snackQuery);
  }

  mealTotals(meal: Meal): MacroTotals {
    return computeMealTotals(meal, this.ingredients);
  }

  async onIngredientSaved(): Promise<void> {
    this.addingIngredient = false;
    this.editingIngredient = null;
    this.ingredients = await this.ingredientsService.getAll();
    this.cdr.detectChanges();
  }

  async deleteIngredient(ingredient: Ingredient): Promise<void> {
    const confirmed = await this.confirmService.confirm(
      `Delete "${ingredient.name}"? Past log entries that used it keep their historically logged values.`
    );
    if (!confirmed) {
      return;
    }
    await this.ingredientsService.delete(ingredient.id);
    this.ingredients = await this.ingredientsService.getAll();
    this.cdr.detectChanges();
  }

  async onMealSaved(): Promise<void> {
    this.addingMeal = false;
    this.editingMeal = null;
    this.meals = await this.mealsService.getAll();
    this.cdr.detectChanges();
  }

  async deleteMeal(meal: Meal): Promise<void> {
    const confirmed = await this.confirmService.confirm(
      `Delete "${meal.name}"? Past log entries that used it keep their historically logged values.`
    );
    if (!confirmed) {
      return;
    }
    await this.mealsService.delete(meal.id);
    this.meals = await this.mealsService.getAll();
    this.cdr.detectChanges();
  }

  async onDrinkSaved(): Promise<void> {
    this.addingDrink = false;
    this.editingDrink = null;
    this.drinks = await this.drinksService.getAll();
    this.cdr.detectChanges();
  }

  async deleteDrink(drink: Drink): Promise<void> {
    const confirmed = await this.confirmService.confirm(
      `Delete "${drink.name}"? Past log entries that used it keep their historically logged values.`
    );
    if (!confirmed) {
      return;
    }
    await this.drinksService.delete(drink.id);
    this.drinks = await this.drinksService.getAll();
    this.cdr.detectChanges();
  }

  async onSnackSaved(): Promise<void> {
    this.addingSnack = false;
    this.editingSnack = null;
    this.snacks = await this.snacksService.getAll();
    this.cdr.detectChanges();
  }

  async deleteSnack(snack: Snack): Promise<void> {
    const confirmed = await this.confirmService.confirm(
      `Delete "${snack.name}"? Past log entries that used it keep their historically logged values.`
    );
    if (!confirmed) {
      return;
    }
    await this.snacksService.delete(snack.id);
    this.snacks = await this.snacksService.getAll();
    this.cdr.detectChanges();
  }

  private filterByName<T extends { name: string }>(items: T[], query: string): T[] {
    const normalizedQuery = query.trim().toLowerCase();
    const source = normalizedQuery ? items.filter((item) => item.name.toLowerCase().includes(normalizedQuery)) : items;
    return [...source].sort((a, b) => a.name.localeCompare(b.name));
  }
}
