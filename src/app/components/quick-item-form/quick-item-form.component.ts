import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Drink } from '../../models';
import { SupabaseRepository } from '../../services/supabase-repository.base';

/** Create/edit form for a flat "calories + protein" item — shared by Drinks and Snacks in Manage. */
@Component({
  selector: 'app-quick-item-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="inline-form">
      <input class="search-input" [placeholder]="itemLabel + ' name'" [(ngModel)]="name" />
      <div class="btn-row">
        <label>Calories <input type="number" [(ngModel)]="calories" /></label>
        <label>Protein (g) <input type="number" [(ngModel)]="protein" /></label>
      </div>
      <div class="btn-row">
        <button class="btn btn-primary btn-small" (click)="submit()" [disabled]="!name.trim()">
          {{ item ? 'Save' : 'Add' }}
        </button>
        <button class="btn btn-small" (click)="cancel()">Cancel</button>
      </div>
    </div>
  `,
})
export class QuickItemFormComponent implements OnChanges {
  @Input({ required: true }) repo!: SupabaseRepository<Drink>;
  @Input() item: Drink | null = null;
  @Input() itemLabel = 'Item';
  @Output() saved = new EventEmitter<Drink>();
  @Output() cancelled = new EventEmitter<void>();

  name = '';
  calories = 100;
  protein = 0;

  ngOnChanges(): void {
    this.name = this.item?.name ?? '';
    this.calories = this.item?.calories ?? 100;
    this.protein = this.item?.protein ?? 0;
  }

  async submit(): Promise<void> {
    const trimmedName = this.name.trim();
    if (!trimmedName) {
      return;
    }
    const input = { name: trimmedName, calories: this.calories, protein: this.protein };
    const result = this.item ? await this.repo.update(this.item.id, input) : await this.repo.create(input);
    if (result) {
      this.saved.emit(result);
    }
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
