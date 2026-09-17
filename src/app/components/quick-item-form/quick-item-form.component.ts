import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Drink } from '../../models';
import { OpenFoodFactsService } from '../../services/open-food-facts.service';
import { SupabaseRepository } from '../../services/supabase-repository.base';
import { BarcodeScannerComponent } from '../barcode-scanner/barcode-scanner.component';

/** Create/edit form for a flat "calories + protein" item — shared by Drinks and Snacks in Manage. */
@Component({
  selector: 'app-quick-item-form',
  standalone: true,
  imports: [CommonModule, FormsModule, BarcodeScannerComponent],
  template: `
    <div class="inline-form">
      <button type="button" class="btn btn-small" *ngIf="!item" (click)="startScan()">📷 Scan barcode</button>

      @if (scanning) {
        @defer (on immediate) {
          <app-barcode-scanner (scanned)="onBarcodeScanned($event)" (cancelled)="scanning = false" />
        } @loading {
          <div class="confirm-overlay"><div class="scanner-box"><p class="muted">Loading camera…</p></div></div>
        }
      }
      <p class="login-error" *ngIf="scanError">{{ scanError }}</p>

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
  scanning = false;
  scanError: string | null = null;

  constructor(
    private openFoodFacts: OpenFoodFactsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(): void {
    this.name = this.item?.name ?? '';
    this.calories = this.item?.calories ?? 100;
    this.protein = this.item?.protein ?? 0;
  }

  startScan(): void {
    this.scanError = null;
    this.scanning = true;
  }

  async onBarcodeScanned(barcode: string): Promise<void> {
    this.scanning = false;
    try {
      const product = await this.openFoodFacts.lookupByBarcode(barcode);
      if (!product) {
        this.scanError = `No product found for barcode ${barcode} — enter it manually below.`;
      } else {
        this.scanError = null;
        this.name = product.name;
        // A drink/snack is one flat item, not a per-100g figure — prefer the product's own
        // serving-size macros when Open Food Facts has them, falling back to per-100g otherwise.
        this.calories = product.caloriesPerServing ?? product.caloriesPer100g;
        this.protein = product.proteinPerServing ?? product.proteinPer100g;
      }
    } catch (error) {
      console.error('Barcode lookup failed', error);
      this.scanError = 'Could not look up that barcode — enter it manually below.';
    }
    this.cdr.detectChanges();
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
