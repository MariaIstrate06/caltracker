import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DailyLogEntry, Ingredient, MealItem, Profile } from '../../models';
import { DrinksService } from '../../services/drinks.service';
import { IngredientsService } from '../../services/ingredients.service';
import { LogService } from '../../services/log.service';
import { MealsService } from '../../services/meals.service';
import { ProfilesService } from '../../services/profiles.service';
import { computeDayTotals, computeMealTotals, MacroTotals, rescaleQuantity } from '../../utils/macro-calc.util';
import { DEFAULT_MEAL_ICON } from '../../utils/meal-icons.util';
import { getBucharestToday, shiftDateKey } from '../../utils/timezone.util';

interface EntryView {
  entry: DailyLogEntry;
  /** Meal entries get an icon prefix (e.g. "🍕 Pizza"); drinks don't have icons, so this is just the name. */
  displayName: string;
  calories: number;
  protein: number;
}

@Component({
  selector: 'app-today',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <h2>Today</h2>

    <div class="day-nav">
      <button class="btn btn-small" (click)="goToPrevDay()">← Prev</button>
      <strong>{{ dateLabel }}</strong>
      <button class="btn btn-small" (click)="goToNextDay()" [disabled]="isToday">Next →</button>
    </div>
    <div *ngIf="!isToday" style="text-align: center; margin-bottom: 12px">
      <button class="btn btn-small" (click)="goToToday()">Jump to today</button>
    </div>

    <div *ngIf="!activeProfile" class="empty-state">
      No active profile yet. <a routerLink="/settings">Go to Settings</a> to create one.
    </div>

    <ng-container *ngIf="activeProfile">
      <div class="totals-bar">
        <span>{{ totals.calories | number: '1.0-0' }} kcal</span>
        <span>{{ totals.protein | number: '1.0-1' }} g protein</span>
      </div>

      <div class="entry-list" *ngIf="entries.length; else emptyEntries">
        <div class="entry-row" *ngFor="let view of entries">
          <ng-container *ngIf="editingId !== view.entry.id; else editTemplate">
            <div class="entry-info">
              <strong>{{ view.displayName }}</strong>
              <small *ngIf="view.entry.type === 'drink'">{{ view.entry.quantity ?? 1 }}x</small>
              <small *ngIf="view.entry.type === 'meal'">{{ view.entry.timestamp | date: 'HH:mm' }}</small>
            </div>
            <div class="entry-side">
              <div class="entry-macros">{{ view.calories | number: '1.0-0' }} kcal · {{ view.protein | number: '1.0-1' }} g</div>
              <div class="btn-row">
                <button class="btn btn-small" (click)="startEdit(view)">Edit</button>
                <button class="btn btn-small btn-danger" (click)="remove(view)">Remove</button>
              </div>
            </div>
          </ng-container>

          <ng-template #editTemplate>
            <div style="width: 100%">
              <strong>{{ view.displayName }}</strong>

              <div *ngIf="view.entry.type === 'meal'">
                <div class="item-row" *ngFor="let item of editMealItems">
                  <span class="name">{{ ingredientName(item.ingredientId) }}</span>
                  <input type="number" min="0" [(ngModel)]="item.amountGrams" (ngModelChange)="recomputeEditTotals()" />
                  g
                </div>
              </div>

              <div *ngIf="view.entry.type === 'drink'" class="stepper">
                <button (click)="changeEditQuantity(-1)">-</button>
                <span>{{ editDrinkQuantity }}</span>
                <button (click)="changeEditQuantity(1)">+</button>
              </div>

              <div class="totals-bar">
                <span>{{ editTotals.calories | number: '1.0-0' }} kcal</span>
                <span>{{ editTotals.protein | number: '1.0-1' }} g</span>
              </div>

              <div class="btn-row">
                <button class="btn btn-primary btn-small" (click)="saveEdit(view)">Save</button>
                <button class="btn btn-small" (click)="cancelEdit()">Cancel</button>
              </div>
            </div>
          </ng-template>
        </div>
      </div>
      <ng-template #emptyEntries>
        <div class="empty-state">Nothing logged {{ isToday ? 'today' : 'on this day' }} yet.</div>
      </ng-template>
    </ng-container>
  `,
})
export class TodayComponent implements OnInit {
  activeProfile: Profile | null = null;
  selectedDate = getBucharestToday();
  entries: EntryView[] = [];
  totals: MacroTotals = { calories: 0, protein: 0 };

  editingId: string | null = null;
  editMealItems: MealItem[] = [];
  editDrinkQuantity = 1;
  editTotals: MacroTotals = { calories: 0, protein: 0 };

  private allIngredients: Ingredient[] = [];

  constructor(
    private profilesService: ProfilesService,
    private logService: LogService,
    private mealsService: MealsService,
    private drinksService: DrinksService,
    private ingredientsService: IngredientsService
  ) {}

  ngOnInit(): void {
    this.activeProfile = this.profilesService.getActiveProfile() ?? null;
    this.allIngredients = this.ingredientsService.getAll();
    this.refresh();
  }

  get isToday(): boolean {
    return this.selectedDate === getBucharestToday();
  }

  get dateLabel(): string {
    if (this.isToday) {
      return 'Today';
    }
    if (this.selectedDate === shiftDateKey(getBucharestToday(), -1)) {
      return 'Yesterday';
    }
    return this.selectedDate;
  }

  goToPrevDay(): void {
    this.selectedDate = shiftDateKey(this.selectedDate, -1);
    this.cancelEdit();
    this.refresh();
  }

  goToNextDay(): void {
    if (this.isToday) {
      return;
    }
    this.selectedDate = shiftDateKey(this.selectedDate, 1);
    this.cancelEdit();
    this.refresh();
  }

  goToToday(): void {
    this.selectedDate = getBucharestToday();
    this.cancelEdit();
    this.refresh();
  }

  ingredientName(id: string): string {
    return this.allIngredients.find((ingredient) => ingredient.id === id)?.name ?? '(deleted ingredient)';
  }

  startEdit(view: EntryView): void {
    this.editingId = view.entry.id;
    if (view.entry.type === 'meal') {
      const meal = view.entry.refId ? this.mealsService.getById(view.entry.refId) : null;
      const items = view.entry.itemsOverride ?? meal?.items ?? [];
      this.editMealItems = items.map((item) => ({ ...item }));
    } else {
      this.editDrinkQuantity = view.entry.quantity ?? 1;
    }
    this.recomputeEditTotals();
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editMealItems = [];
    this.editDrinkQuantity = 1;
  }

  recomputeEditTotals(): void {
    const view = this.entries.find((candidate) => candidate.entry.id === this.editingId);
    if (!view) {
      return;
    }
    if (view.entry.type === 'meal') {
      this.editTotals = computeMealTotals({ items: this.editMealItems }, this.allIngredients);
    } else {
      const base = { calories: view.entry.computedCalories, protein: view.entry.computedProtein };
      this.editTotals = rescaleQuantity(base, view.entry.quantity ?? 1, this.editDrinkQuantity);
    }
  }

  changeEditQuantity(delta: number): void {
    this.editDrinkQuantity = Math.max(1, this.editDrinkQuantity + delta);
    this.recomputeEditTotals();
  }

  saveEdit(view: EntryView): void {
    if (view.entry.type === 'meal') {
      this.logService.update(view.entry.id, {
        itemsOverride: this.editMealItems,
        computedCalories: this.editTotals.calories,
        computedProtein: this.editTotals.protein,
      });
    } else {
      this.logService.update(view.entry.id, {
        quantity: this.editDrinkQuantity,
        computedCalories: this.editTotals.calories,
        computedProtein: this.editTotals.protein,
      });
    }
    this.cancelEdit();
    this.refresh();
  }

  remove(view: EntryView): void {
    this.logService.deleteEntry(view.entry.id);
    if (this.editingId === view.entry.id) {
      this.cancelEdit();
    }
    this.refresh();
  }

  private refresh(): void {
    if (!this.activeProfile) {
      this.entries = [];
      this.totals = { calories: 0, protein: 0 };
      return;
    }
    const rawEntries = this.logService
      .getForProfileAndDate(this.activeProfile.id, this.selectedDate)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    this.entries = rawEntries.map((entry) => this.toView(entry));
    this.totals = computeDayTotals(rawEntries);
  }

  private toView(entry: DailyLogEntry): EntryView {
    let displayName: string;
    if (entry.type === 'meal') {
      const meal = entry.refId ? this.mealsService.getById(entry.refId) : null;
      const name = entry.refId ? (meal?.name ?? '(deleted meal)') : (entry.name ?? 'Meal');
      const icon = meal?.icon ?? DEFAULT_MEAL_ICON;
      displayName = `${icon} ${name}`;
    } else {
      displayName = entry.refId ? (this.drinksService.getById(entry.refId)?.name ?? '(deleted drink)') : (entry.name ?? 'Drink');
    }
    return { entry, displayName, calories: entry.computedCalories, protein: entry.computedProtein };
  }
}
