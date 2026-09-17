import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Ingredient } from '../../models';
import { IngredientsService } from '../../services/ingredients.service';

/**
 * Create/edit form for a single Ingredient. Shared by every flow that needs one: the Log a meal
 * flow's inline "missing ingredient" add, Manage's standalone add, and Manage's edit-in-place.
 */
@Component({
  selector: 'app-ingredient-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="inline-form">
      <input class="search-input" placeholder="Ingredient name" [(ngModel)]="name" />
      <div class="btn-row">
        <label>Cal/100g <input type="number" [(ngModel)]="caloriesPer100g" /></label>
        <label>Carbs/100g <input type="number" [(ngModel)]="carbsPer100g" /></label>
        <label>Protein/100g <input type="number" [(ngModel)]="proteinPer100g" /></label>
        <label>Fibre/100g <input type="number" [(ngModel)]="fibrePer100g" /></label>
      </div>
      <div class="btn-row">
        <button class="btn btn-primary btn-small" (click)="submit()" [disabled]="!name.trim()">
          {{ ingredient ? 'Save' : 'Add & use' }}
        </button>
        <button class="btn btn-small" (click)="cancel()">Cancel</button>
      </div>
    </div>
  `,
})
export class IngredientFormComponent implements OnChanges {
  @Input() ingredient: Ingredient | null = null;
  /** Prefills a new (non-edit) ingredient — e.g. macros looked up from a scanned barcode. Ignored when `ingredient` is set. */
  @Input() initial: Partial<Omit<Ingredient, 'id'>> | null = null;
  @Output() saved = new EventEmitter<Ingredient>();
  @Output() cancelled = new EventEmitter<void>();

  name = '';
  caloriesPer100g = 100;
  proteinPer100g = 0;
  carbsPer100g = 0;
  fibrePer100g = 0;

  constructor(private ingredientsService: IngredientsService) {}

  ngOnChanges(): void {
    const source = this.ingredient ?? this.initial;
    this.name = source?.name ?? '';
    this.caloriesPer100g = source?.caloriesPer100g ?? 100;
    this.proteinPer100g = source?.proteinPer100g ?? 0;
    this.carbsPer100g = source?.carbsPer100g ?? 0;
    this.fibrePer100g = source?.fibrePer100g ?? 0;
  }

  async submit(): Promise<void> {
    const trimmedName = this.name.trim();
    if (!trimmedName) {
      return;
    }
    const input = {
      name: trimmedName,
      caloriesPer100g: this.caloriesPer100g,
      proteinPer100g: this.proteinPer100g,
      carbsPer100g: this.carbsPer100g,
      fibrePer100g: this.fibrePer100g,
    };
    const result = this.ingredient
      ? await this.ingredientsService.update(this.ingredient.id, input)
      : await this.ingredientsService.create(input);
    if (result) {
      this.saved.emit(result);
    }
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
