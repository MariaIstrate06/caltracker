import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DrinkFormComponent } from '../../components/drink-form/drink-form.component';
import { IngredientFormComponent } from '../../components/ingredient-form/ingredient-form.component';
import { MealBuilderComponent } from '../../components/meal-builder/meal-builder.component';
import { Drink, Ingredient, Meal } from '../../models';
import { DrinksService } from '../../services/drinks.service';
import { IngredientsService } from '../../services/ingredients.service';
import { MealsService } from '../../services/meals.service';
import { computeMealTotals, MacroTotals } from '../../utils/macro-calc.util';

type Section = 'ingredients' | 'meals' | 'drinks';

@Component({
  selector: 'app-manage',
  standalone: true,
  imports: [CommonModule, FormsModule, IngredientFormComponent, DrinkFormComponent, MealBuilderComponent],
  template: `
    <h2>Manage</h2>

    <div class="btn-row" style="margin-bottom: 16px">
      <button class="btn" [class.btn-primary]="section === 'ingredients'" (click)="section = 'ingredients'">Ingredients</button>
      <button class="btn" [class.btn-primary]="section === 'meals'" (click)="section = 'meals'">Meals</button>
      <button class="btn" [class.btn-primary]="section === 'drinks'" (click)="section = 'drinks'">Drinks</button>
    </div>

    <ng-container *ngIf="section === 'ingredients'">
      <input class="search-input" placeholder="Search ingredients…" [(ngModel)]="ingredientQuery" />
      <button class="btn btn-small" *ngIf="!addingIngredient" (click)="addingIngredient = true; editingIngredient = null">
        + Add ingredient
      </button>
      <app-ingredient-form *ngIf="addingIngredient" (saved)="onIngredientSaved()" (cancelled)="addingIngredient = false" />

      <div class="entry-list">
        <div class="entry-row" *ngFor="let ingredient of filteredIngredients">
          <ng-container *ngIf="editingIngredient?.id !== ingredient.id; else editIngredientTpl">
            <div class="entry-info">
              <strong>{{ ingredient.name }}</strong>
              <small>{{ ingredient.caloriesPer100g }} kcal/100g · {{ ingredient.proteinPer100g }}g protein</small>
            </div>
            <div class="btn-row">
              <button class="btn btn-small" (click)="addingIngredient = false; editingIngredient = ingredient">Edit</button>
              <button class="btn btn-small btn-danger" (click)="deleteIngredient(ingredient)">Delete</button>
            </div>
          </ng-container>
          <ng-template #editIngredientTpl>
            <app-ingredient-form [ingredient]="ingredient" (saved)="onIngredientSaved()" (cancelled)="editingIngredient = null" />
          </ng-template>
        </div>
      </div>
      <div class="empty-state" *ngIf="!filteredIngredients.length">No ingredients match.</div>
    </ng-container>

    <ng-container *ngIf="section === 'meals'">
      <ng-container *ngIf="!addingMeal && !editingMeal">
        <input class="search-input" placeholder="Search meals…" [(ngModel)]="mealQuery" />
        <button class="btn btn-small" (click)="addingMeal = true">+ Add meal from scratch</button>

        <div class="entry-list">
          <div class="entry-row" *ngFor="let meal of filteredMeals">
            <div class="entry-info">
              <strong>{{ meal.name }}</strong>
              <small>{{ meal.category }} · {{ mealTotals(meal).calories | number: '1.0-0' }} kcal</small>
            </div>
            <div class="btn-row">
              <button class="btn btn-small" (click)="editingMeal = meal">Edit</button>
              <button class="btn btn-small btn-danger" (click)="deleteMeal(meal)">Delete</button>
            </div>
          </div>
        </div>
        <div class="empty-state" *ngIf="!filteredMeals.length">No meals match.</div>
      </ng-container>

      <ng-container *ngIf="addingMeal">
        <h3>New meal</h3>
        <app-meal-builder mode="create" (saved)="onMealSaved()" (cancelled)="addingMeal = false" />
      </ng-container>

      <ng-container *ngIf="editingMeal as meal">
        <h3>Edit "{{ meal.name }}"</h3>
        <app-meal-builder [seedMeal]="meal" mode="edit" (saved)="onMealSaved()" (cancelled)="editingMeal = null" />
      </ng-container>
    </ng-container>

    <ng-container *ngIf="section === 'drinks'">
      <input class="search-input" placeholder="Search drinks…" [(ngModel)]="drinkQuery" />
      <button class="btn btn-small" *ngIf="!addingDrink" (click)="addingDrink = true; editingDrink = null">+ Add drink</button>
      <app-drink-form *ngIf="addingDrink" (saved)="onDrinkSaved()" (cancelled)="addingDrink = false" />

      <div class="entry-list">
        <div class="entry-row" *ngFor="let drink of filteredDrinks">
          <ng-container *ngIf="editingDrink?.id !== drink.id; else editDrinkTpl">
            <div class="entry-info">
              <strong>{{ drink.name }}</strong>
              <small>{{ drink.calories }} kcal · {{ drink.protein }}g protein</small>
            </div>
            <div class="btn-row">
              <button class="btn btn-small" (click)="addingDrink = false; editingDrink = drink">Edit</button>
              <button class="btn btn-small btn-danger" (click)="deleteDrink(drink)">Delete</button>
            </div>
          </ng-container>
          <ng-template #editDrinkTpl>
            <app-drink-form [drink]="drink" (saved)="onDrinkSaved()" (cancelled)="editingDrink = null" />
          </ng-template>
        </div>
      </div>
      <div class="empty-state" *ngIf="!filteredDrinks.length">No drinks match.</div>
    </ng-container>
  `,
})
export class ManageComponent implements OnInit {
  section: Section = 'ingredients';

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

  constructor(
    private ingredientsService: IngredientsService,
    private mealsService: MealsService,
    private drinksService: DrinksService
  ) {}

  ngOnInit(): void {
    this.ingredients = this.ingredientsService.getAll();
    this.meals = this.mealsService.getAll();
    this.drinks = this.drinksService.getAll();
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

  mealTotals(meal: Meal): MacroTotals {
    return computeMealTotals(meal, this.ingredients);
  }

  onIngredientSaved(): void {
    this.addingIngredient = false;
    this.editingIngredient = null;
    this.ingredients = this.ingredientsService.getAll();
  }

  deleteIngredient(ingredient: Ingredient): void {
    if (!confirm(`Delete "${ingredient.name}"? Past log entries that used it keep their historically logged values.`)) {
      return;
    }
    this.ingredientsService.delete(ingredient.id);
    this.ingredients = this.ingredientsService.getAll();
  }

  onMealSaved(): void {
    this.addingMeal = false;
    this.editingMeal = null;
    this.meals = this.mealsService.getAll();
  }

  deleteMeal(meal: Meal): void {
    if (!confirm(`Delete "${meal.name}"? Past log entries that used it keep their historically logged values.`)) {
      return;
    }
    this.mealsService.delete(meal.id);
    this.meals = this.mealsService.getAll();
  }

  onDrinkSaved(): void {
    this.addingDrink = false;
    this.editingDrink = null;
    this.drinks = this.drinksService.getAll();
  }

  deleteDrink(drink: Drink): void {
    if (!confirm(`Delete "${drink.name}"? Past log entries that used it keep their historically logged values.`)) {
      return;
    }
    this.drinksService.delete(drink.id);
    this.drinks = this.drinksService.getAll();
  }

  private filterByName<T extends { name: string }>(items: T[], query: string): T[] {
    const normalizedQuery = query.trim().toLowerCase();
    const source = normalizedQuery ? items.filter((item) => item.name.toLowerCase().includes(normalizedQuery)) : items;
    return [...source].sort((a, b) => a.name.localeCompare(b.name));
  }
}
