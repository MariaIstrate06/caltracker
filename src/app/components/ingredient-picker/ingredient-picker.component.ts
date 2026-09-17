import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Ingredient, MealItem } from '../../models';
import { IngredientsService } from '../../services/ingredients.service';
import { deletedEntityLabel } from '../../utils/deleted-entity.util';
import { computeMealTotals, MealMacroTotals } from '../../utils/macro-calc.util';
import { IngredientFormComponent } from '../ingredient-form/ingredient-form.component';

/**
 * Search-and-add ingredient rows with per-row and total macros (kcal/carbs/protein/fibre).
 * Shared by every place a meal's ingredient list is authored: the Log a meal flow and the
 * Meal Editor (create/duplicate/edit).
 *
 * The trailing search-bar button is "Scan ingredient" by default, and switches to "+ Add new
 * ingredient" only once typing has ruled out every existing match — either way it just opens
 * IngredientFormComponent, telling it whether to jump straight into the scanner or not; the
 * form itself owns the actual scanning/prefill logic so it works the same everywhere that form
 * is used (Manage's direct "+ Add ingredient" included), not just from here.
 */
@Component({
  selector: 'app-ingredient-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, IngredientFormComponent],
  template: `
    <div class="search-bar">
      <input class="search-input" placeholder="Search ingredients…" [(ngModel)]="searchQuery" />
      <button type="button" class="search-bar-action" (click)="onActionClick()">{{ actionLabel }}</button>
    </div>
    <div class="result-list" *ngIf="filteredIngredients.length">
      <button class="result-item" *ngFor="let ingredient of filteredIngredients" (click)="addRow(ingredient)">
        <span>{{ ingredient.name }}</span>
        <span class="muted"
          >{{ ingredient.caloriesPer100g }} kcal · {{ ingredient.carbsPer100g }}g carbs · {{ ingredient.proteinPer100g }}g protein ·
          {{ ingredient.fibrePer100g }}g fibre <small>/100g</small></span
        >
      </button>
    </div>
    <p *ngIf="searchQuery && !filteredIngredients.length" class="muted">No matches for "{{ searchQuery }}".</p>

    <app-ingredient-form
      *ngIf="showAddForm"
      [autoOpenScanner]="autoOpenScannerForForm"
      (saved)="onIngredientCreated($event)"
      (cancelled)="showAddForm = false"
    />

    <ng-container *ngIf="items.length">
      <h3>Ingredients</h3>
      <div class="item-row macro-item-row" *ngFor="let item of items; let i = index">
        <div class="macro-item-main">
          <span class="name">{{ ingredientName(item.ingredientId) }}</span>
          <input type="number" min="0" [(ngModel)]="item.amountGrams" (ngModelChange)="emitItems()" />
          g
          <button class="btn btn-small btn-danger" (click)="removeRow(i)">✕</button>
        </div>
        <div class="macro-item-macros muted">
          {{ rowMacros(item).calories | number: '1.0-0' }} kcal · {{ rowMacros(item).carbs | number: '1.0-1' }}g carbs ·
          {{ rowMacros(item).protein | number: '1.0-1' }}g protein · {{ rowMacros(item).fibre | number: '1.0-1' }}g fibre
        </div>
      </div>

      <div class="totals-bar macro-totals-bar">
        <span>{{ liveTotals.calories | number: '1.0-0' }} kcal</span>
        <span>{{ liveTotals.carbs | number: '1.0-1' }} g carbs</span>
        <span>{{ liveTotals.protein | number: '1.0-1' }} g protein</span>
        <span>{{ liveTotals.fibre | number: '1.0-1' }} g fibre</span>
      </div>
    </ng-container>
  `,
})
export class IngredientPickerComponent implements OnInit {
  @Input() items: MealItem[] = [];
  @Output() itemsChange = new EventEmitter<MealItem[]>();

  searchQuery = '';
  showAddForm = false;
  autoOpenScannerForForm = false;

  constructor(private ingredientsService: IngredientsService) {}

  ngOnInit(): void {
    void this.ingredientsService.getAll();
  }

  get allIngredients(): Ingredient[] {
    return this.ingredientsService.items();
  }

  get filteredIngredients(): Ingredient[] {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      return [];
    }
    return this.allIngredients.filter((ingredient) => ingredient.name.toLowerCase().includes(query)).slice(0, 8);
  }

  /** "Add new ingredient" only once typing has ruled out every existing match; "Scan ingredient" otherwise. */
  get actionLabel(): string {
    const hasUnmatchedQuery = this.searchQuery.trim().length > 0 && this.filteredIngredients.length === 0;
    return hasUnmatchedQuery ? '+ Add new ingredient' : '📷 Scan ingredient';
  }

  get liveTotals(): MealMacroTotals {
    return computeMealTotals({ items: this.items }, this.allIngredients);
  }

  rowMacros(item: MealItem): MealMacroTotals {
    return computeMealTotals({ items: [item] }, this.allIngredients);
  }

  ingredientName(id: string): string {
    return this.allIngredients.find((ingredient) => ingredient.id === id)?.name ?? deletedEntityLabel('ingredient');
  }

  onActionClick(): void {
    this.autoOpenScannerForForm = !this.actionLabel.includes('Add new');
    this.showAddForm = true;
  }

  addRow(ingredient: Ingredient): void {
    this.items = [...this.items, { ingredientId: ingredient.id, amountGrams: 100 }];
    this.searchQuery = '';
    this.emitItems();
  }

  removeRow(index: number): void {
    this.items = this.items.filter((_, i) => i !== index);
    this.emitItems();
  }

  onIngredientCreated(ingredient: Ingredient): void {
    this.addRow(ingredient);
    this.showAddForm = false;
  }

  emitItems(): void {
    this.itemsChange.emit(this.items);
  }
}
