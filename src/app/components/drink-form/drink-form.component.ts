import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Drink } from '../../models';
import { DrinksService } from '../../services/drinks.service';

/** Create/edit form for a single Drink. Used by Manage's standalone add and edit-in-place. */
@Component({
  selector: 'app-drink-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="inline-form">
      <input class="search-input" placeholder="Drink name" [(ngModel)]="name" />
      <div class="btn-row">
        <label>Calories <input type="number" [(ngModel)]="calories" /></label>
        <label>Protein (g) <input type="number" [(ngModel)]="protein" /></label>
      </div>
      <div class="btn-row">
        <button class="btn btn-primary btn-small" (click)="submit()" [disabled]="!name.trim()">
          {{ drink ? 'Save' : 'Add' }}
        </button>
        <button class="btn btn-small" (click)="cancel()">Cancel</button>
      </div>
    </div>
  `,
})
export class DrinkFormComponent implements OnChanges {
  @Input() drink: Drink | null = null;
  @Output() saved = new EventEmitter<Drink>();
  @Output() cancelled = new EventEmitter<void>();

  name = '';
  calories = 100;
  protein = 0;

  constructor(private drinksService: DrinksService) {}

  ngOnChanges(): void {
    this.name = this.drink?.name ?? '';
    this.calories = this.drink?.calories ?? 100;
    this.protein = this.drink?.protein ?? 0;
  }

  submit(): void {
    const trimmedName = this.name.trim();
    if (!trimmedName) {
      return;
    }
    const input = { name: trimmedName, calories: this.calories, protein: this.protein };
    const result = this.drink ? this.drinksService.update(this.drink.id, input) : this.drinksService.create(input);
    if (result) {
      this.saved.emit(result);
    }
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
