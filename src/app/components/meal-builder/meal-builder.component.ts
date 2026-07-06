import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Ingredient, Meal, MealCategory, MealItem } from '../../models';
import { IngredientsService } from '../../services/ingredients.service';
import { MealsService } from '../../services/meals.service';
import { computeMealTotals, MacroTotals } from '../../utils/macro-calc.util';
import { IngredientFormComponent } from '../ingredient-form/ingredient-form.component';

const CATEGORIES: MealCategory[] = ['breakfast', 'lunch', 'dinner', 'snack'];

/**
 * Name + category + ingredient-rows builder, shared across every way a Meal gets authored:
 * - create from scratch: seedMeal=null, mode='create'
 * - duplicate an existing meal: seedMeal=<source>, mode='create' (always saves as a NEW meal, source untouched)
 * - edit a meal's stored definition: seedMeal=<target>, mode='edit' (saves in place, same id)
 */
@Component({
  selector: 'app-meal-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, IngredientFormComponent],
  template: `
    <input class="search-input" placeholder="Meal name" [(ngModel)]="name" />

    <select class="search-input" [(ngModel)]="category">
      <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
    </select>

    <input class="search-input" placeholder="Search ingredients…" [(ngModel)]="searchQuery" />
    <div class="result-list" *ngIf="filteredIngredients.length">
      <button class="result-item" *ngFor="let ingredient of filteredIngredients" (click)="addIngredientRow(ingredient)">
        <span>{{ ingredient.name }}</span>
        <span class="muted">{{ ingredient.caloriesPer100g }} kcal/100g · {{ ingredient.proteinPer100g }}g protein</span>
      </button>
    </div>
    <p *ngIf="searchQuery && !filteredIngredients.length" class="muted">No matches for "{{ searchQuery }}".</p>

    <button class="btn btn-small" *ngIf="!showAddIngredientForm" (click)="openAddIngredientForm()">+ Add new ingredient</button>
    <app-ingredient-form *ngIf="showAddIngredientForm" (saved)="onIngredientCreated($event)" (cancelled)="showAddIngredientForm = false" />

    <ng-container *ngIf="items.length">
      <h3>Ingredients</h3>
      <div class="item-row" *ngFor="let item of items; let i = index">
        <span class="name">{{ ingredientName(item.ingredientId) }}</span>
        <input type="number" min="0" [(ngModel)]="item.amountGrams" />
        g
        <button class="btn btn-small btn-danger" (click)="removeRow(i)">✕</button>
      </div>

      <div class="totals-bar">
        <span>{{ liveTotals.calories | number: '1.0-0' }} kcal</span>
        <span>{{ liveTotals.protein | number: '1.0-1' }} g protein</span>
      </div>
    </ng-container>

    <div class="btn-row">
      <button class="btn btn-primary" (click)="submit()" [disabled]="!items.length || !name.trim()">
        {{ mode === 'edit' ? 'Save changes' : 'Save meal' }}
      </button>
      <button class="btn" (click)="cancel()">Cancel</button>
    </div>
  `,
})
export class MealBuilderComponent implements OnInit, OnChanges {
  /** Pre-fills the form. Used both for duplicating (mode='create') and editing (mode='edit'). Null means blank/from-scratch. */
  @Input() seedMeal: Meal | null = null;
  @Input() mode: 'create' | 'edit' = 'create';
  @Output() saved = new EventEmitter<Meal>();
  @Output() cancelled = new EventEmitter<void>();

  categories = CATEGORIES;
  name = '';
  category: MealCategory = 'lunch';
  items: MealItem[] = [];
  searchQuery = '';
  showAddIngredientForm = false;

  private allIngredients: Ingredient[] = [];

  constructor(
    private ingredientsService: IngredientsService,
    private mealsService: MealsService
  ) {}

  ngOnInit(): void {
    this.allIngredients = this.ingredientsService.getAll();
    this.applySeed();
  }

  ngOnChanges(): void {
    this.applySeed();
  }

  get filteredIngredients(): Ingredient[] {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      return [];
    }
    return this.allIngredients.filter((ingredient) => ingredient.name.toLowerCase().includes(query)).slice(0, 8);
  }

  get liveTotals(): MacroTotals {
    return computeMealTotals({ items: this.items }, this.allIngredients);
  }

  ingredientName(id: string): string {
    return this.allIngredients.find((ingredient) => ingredient.id === id)?.name ?? '(unknown)';
  }

  addIngredientRow(ingredient: Ingredient): void {
    this.items = [...this.items, { ingredientId: ingredient.id, amountGrams: 100 }];
    this.searchQuery = '';
  }

  removeRow(index: number): void {
    this.items = this.items.filter((_, i) => i !== index);
  }

  openAddIngredientForm(): void {
    this.showAddIngredientForm = true;
  }

  onIngredientCreated(ingredient: Ingredient): void {
    this.allIngredients = [...this.allIngredients, ingredient];
    this.addIngredientRow(ingredient);
    this.showAddIngredientForm = false;
  }

  submit(): void {
    const trimmedName = this.name.trim();
    if (!trimmedName || !this.items.length) {
      return;
    }
    const input = { name: trimmedName, category: this.category, items: this.items };
    if (this.mode === 'edit' && this.seedMeal) {
      const updated = this.mealsService.update(this.seedMeal.id, input);
      if (updated) {
        this.saved.emit(updated);
      }
      return;
    }
    this.saved.emit(this.mealsService.create(input));
  }

  cancel(): void {
    this.cancelled.emit();
  }

  private applySeed(): void {
    if (this.seedMeal) {
      this.name = this.mode === 'edit' ? this.seedMeal.name : `${this.seedMeal.name} (copy)`;
      this.category = this.seedMeal.category;
      this.items = this.seedMeal.items.map((item) => ({ ...item }));
    } else {
      this.name = '';
      this.category = 'lunch';
      this.items = [];
    }
  }
}
