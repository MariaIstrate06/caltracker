import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Ingredient, MealItem } from '../../models';
import { IngredientsService } from '../../services/ingredients.service';
import { LogService } from '../../services/log.service';
import { ProfilesService } from '../../services/profiles.service';
import { computeMealTotals, MacroTotals } from '../../utils/macro-calc.util';
import { getBucharestToday } from '../../utils/timezone.util';

@Component({
  selector: 'app-log-new-meal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h2>Log a new meal</h2>

    <input class="search-input" placeholder="Search ingredients…" [(ngModel)]="searchQuery" />

    <div class="result-list" *ngIf="filteredIngredients.length">
      <button class="result-item" *ngFor="let ingredient of filteredIngredients" (click)="addIngredientRow(ingredient)">
        <span>{{ ingredient.name }}</span>
        <span class="muted">{{ ingredient.caloriesPer100g }} kcal/100g · {{ ingredient.proteinPer100g }}g protein</span>
      </button>
    </div>
    <p *ngIf="searchQuery && !filteredIngredients.length" class="muted">No matches for "{{ searchQuery }}".</p>

    <button class="btn btn-small" *ngIf="!showAddIngredientForm" (click)="openAddIngredientForm()">+ Add new ingredient</button>

    <div class="inline-form" *ngIf="showAddIngredientForm">
      <input class="search-input" placeholder="Ingredient name" [(ngModel)]="newIngredientName" />
      <div class="btn-row">
        <label>Cal/100g <input type="number" [(ngModel)]="newIngredientCalories" /></label>
        <label>Protein/100g <input type="number" [(ngModel)]="newIngredientProtein" /></label>
      </div>
      <div class="btn-row">
        <button class="btn btn-primary btn-small" (click)="submitNewIngredient()" [disabled]="!newIngredientName.trim()">
          Add &amp; use
        </button>
        <button class="btn btn-small" (click)="showAddIngredientForm = false">Cancel</button>
      </div>
    </div>

    <ng-container *ngIf="items.length">
      <h3>This meal</h3>
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

      <input class="search-input" placeholder="Name this meal (optional)" [(ngModel)]="mealName" />
    </ng-container>

    <div class="btn-row">
      <button class="btn btn-primary" (click)="confirm()" [disabled]="!items.length">Log this meal</button>
      <button class="btn" (click)="cancel()">Cancel</button>
    </div>
  `,
})
export class LogNewMealComponent implements OnInit {
  searchQuery = '';
  items: MealItem[] = [];
  mealName = '';

  showAddIngredientForm = false;
  newIngredientName = '';
  newIngredientCalories = 100;
  newIngredientProtein = 0;

  private allIngredients: Ingredient[] = [];

  constructor(
    private ingredientsService: IngredientsService,
    private logService: LogService,
    private profilesService: ProfilesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.allIngredients = this.ingredientsService.getAll();
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
    this.newIngredientName = this.searchQuery.trim();
    this.showAddIngredientForm = true;
  }

  submitNewIngredient(): void {
    const name = this.newIngredientName.trim();
    if (!name) {
      return;
    }
    const created = this.ingredientsService.create({
      name,
      caloriesPer100g: this.newIngredientCalories,
      proteinPer100g: this.newIngredientProtein,
    });
    this.allIngredients = [...this.allIngredients, created];
    this.addIngredientRow(created);
    this.newIngredientName = '';
    this.newIngredientCalories = 100;
    this.newIngredientProtein = 0;
    this.showAddIngredientForm = false;
  }

  confirm(): void {
    if (!this.items.length) {
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
      refId: null,
      name: this.mealName.trim() || this.buildDefaultName(),
      itemsOverride: this.items,
      timestamp: new Date().toISOString(),
      computedCalories: totals.calories,
      computedProtein: totals.protein,
    });
    this.router.navigateByUrl('/today');
  }

  cancel(): void {
    this.router.navigateByUrl('/home');
  }

  private buildDefaultName(): string {
    const names = this.items.map((item) => this.ingredientName(item.ingredientId));
    if (names.length <= 2) {
      return names.join(', ') || 'Meal';
    }
    return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
  }
}
