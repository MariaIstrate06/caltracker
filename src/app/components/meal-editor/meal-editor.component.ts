import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Meal, MealCategory, MealItem } from '../../models';
import { ConfirmService } from '../../services/confirm.service';
import { IngredientsService } from '../../services/ingredients.service';
import { LogService } from '../../services/log.service';
import { MealsService } from '../../services/meals.service';
import { computeMealTotals } from '../../utils/macro-calc.util';
import { DEFAULT_MEAL_ICON } from '../../utils/meal-icons.util';
import { getBucharestToday } from '../../utils/timezone.util';
import { IconPickerComponent } from '../icon-picker/icon-picker.component';
import { IngredientPickerComponent } from '../ingredient-picker/ingredient-picker.component';

const CATEGORIES: MealCategory[] = ['breakfast', 'lunch', 'dinner', 'snack'];

/**
 * Name + category + icon + ingredient-rows editor for a Meal, shared across every way a Meal
 * gets authored:
 * - `actions="library"` (create from scratch, duplicate, or edit in Manage/Browse): Save/Cancel,
 *   only ever writes to the shared library.
 * - `actions="log"` (the "+ Add a new meal" step of Log a meal): a top-right ✕ (with a confirm
 *   prompt) instead of Cancel, and three actions — Add (library only), Log (one-off, not saved
 *   to the library), Add & Log (both).
 */
@Component({
  selector: 'app-meal-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, IconPickerComponent, IngredientPickerComponent],
  template: `
    <div class="meal-editor-header" *ngIf="actions === 'log'">
      <h3>{{ mode === 'edit' ? 'Edit meal' : 'New meal' }}</h3>
      <button type="button" class="icon-btn" title="Cancel" (click)="requestCancel()">✕</button>
    </div>

    <div class="name-category-row">
      <input class="search-input name-field" placeholder="Meal name (required)" [(ngModel)]="name" required />
      <select class="search-input category-field" [(ngModel)]="category">
        <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
      </select>
    </div>

    <app-icon-picker [(value)]="icon" />

    <div class="section-divider"></div>

    <app-ingredient-picker [(items)]="items" />

    <div class="btn-row" *ngIf="actions === 'library'">
      <button class="btn btn-primary" (click)="submitLibrary()" [disabled]="!items.length || !name.trim()">
        {{ mode === 'edit' ? 'Save changes' : 'Save meal' }}
      </button>
      <button class="btn" (click)="cancelled.emit()">Cancel</button>
    </div>

    <div class="btn-row" *ngIf="actions === 'log'">
      <button class="btn btn-primary" (click)="addAndLog()" [disabled]="!items.length || !name.trim() || submitting">Add & Log</button>
      <button class="btn" (click)="logOnly()" [disabled]="!items.length || !name.trim() || submitting">Log</button>
      <button class="btn" (click)="addOnly()" [disabled]="!items.length || !name.trim() || submitting">Add</button>
    </div>
  `,
})
export class MealEditorComponent implements OnInit, OnChanges {
  /** Pre-fills the form. Used both for duplicating (mode='create') and editing (mode='edit'). Null means blank/from-scratch. */
  @Input() seedMeal: Meal | null = null;
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() actions: 'library' | 'log' = 'library';
  /** Fires whenever the shared library was written to (Save, Add, Add & Log). */
  @Output() saved = new EventEmitter<Meal>();
  /** Fires whenever a log entry was recorded (Log, Add & Log) — 'log' mode only. */
  @Output() logged = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  categories = CATEGORIES;
  name = '';
  category: MealCategory = 'lunch';
  icon: string = DEFAULT_MEAL_ICON;
  items: MealItem[] = [];
  submitting = false;

  constructor(
    private mealsService: MealsService,
    private logService: LogService,
    private confirmService: ConfirmService,
    private ingredientsService: IngredientsService
  ) {}

  ngOnInit(): void {
    this.applySeed();
  }

  ngOnChanges(): void {
    this.applySeed();
  }

  async requestCancel(): Promise<void> {
    const confirmed = await this.confirmService.confirm('Are you sure you want to cancel?');
    if (confirmed) {
      this.cancelled.emit();
    }
  }

  async submitLibrary(): Promise<void> {
    const meal = await this.writeToLibrary();
    if (meal) {
      this.saved.emit(meal);
    }
  }

  async addOnly(): Promise<void> {
    this.submitting = true;
    const meal = await this.writeToLibrary();
    this.submitting = false;
    if (meal) {
      this.saved.emit(meal);
    }
  }

  async addAndLog(): Promise<void> {
    this.submitting = true;
    const meal = await this.writeToLibrary();
    if (meal) {
      await this.logService.addEntry({
        date: getBucharestToday(),
        type: 'meal',
        refId: meal.id,
        itemsOverride: this.items,
        timestamp: new Date().toISOString(),
        computedCalories: this.liveCalories,
        computedProtein: this.liveProtein,
      });
      this.saved.emit(meal);
      this.logged.emit();
    }
    this.submitting = false;
  }

  async logOnly(): Promise<void> {
    const trimmedName = this.name.trim();
    if (!trimmedName || !this.items.length) {
      return;
    }
    this.submitting = true;
    await this.logService.addEntry({
      date: getBucharestToday(),
      type: 'meal',
      refId: null,
      name: trimmedName,
      itemsOverride: this.items,
      timestamp: new Date().toISOString(),
      computedCalories: this.liveCalories,
      computedProtein: this.liveProtein,
    });
    this.submitting = false;
    this.logged.emit();
  }

  private get liveCalories(): number {
    return this.currentTotals.calories;
  }

  private get liveProtein(): number {
    return this.currentTotals.protein;
  }

  /** IngredientsService's shared signal is already populated by the nested ingredient picker. */
  private get currentTotals() {
    return computeMealTotals({ items: this.items }, this.ingredientsService.items());
  }

  private async writeToLibrary(): Promise<Meal | undefined> {
    const trimmedName = this.name.trim();
    if (!trimmedName || !this.items.length) {
      return undefined;
    }
    const input = { name: trimmedName, category: this.category, icon: this.icon, items: this.items };
    if (this.mode === 'edit' && this.seedMeal) {
      return this.mealsService.update(this.seedMeal.id, input);
    }
    return this.mealsService.create(input);
  }

  private applySeed(): void {
    if (this.seedMeal) {
      this.name = this.mode === 'edit' ? this.seedMeal.name : `${this.seedMeal.name} (copy)`;
      this.category = this.seedMeal.category;
      this.icon = this.seedMeal.icon ?? DEFAULT_MEAL_ICON;
      this.items = this.seedMeal.items.map((item) => ({ ...item }));
    } else {
      this.name = '';
      this.category = 'lunch';
      this.icon = DEFAULT_MEAL_ICON;
      this.items = [];
    }
  }
}
