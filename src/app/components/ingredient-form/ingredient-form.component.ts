import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Ingredient } from '../../models';
import { IngredientsService } from '../../services/ingredients.service';
import { OpenFoodFactsService } from '../../services/open-food-facts.service';
import { BarcodeScannerComponent } from '../barcode-scanner/barcode-scanner.component';

/**
 * Create/edit form for a single Ingredient. Shared by every flow that needs one: the Log a meal
 * flow's ingredient picker, Manage's standalone add, and Manage's edit-in-place — the barcode
 * scanner lives here so it's available consistently everywhere this form is used.
 */
@Component({
  selector: 'app-ingredient-form',
  standalone: true,
  imports: [CommonModule, FormsModule, BarcodeScannerComponent],
  template: `
    <div class="inline-form">
      <button type="button" class="btn btn-small" *ngIf="!ingredient" (click)="startScan()">📷 Scan barcode</button>

      @if (scanning) {
        @defer (on immediate) {
          <app-barcode-scanner (scanned)="onBarcodeScanned($event)" (cancelled)="scanning = false" />
        } @loading {
          <div class="confirm-overlay"><div class="scanner-box"><p class="muted">Loading camera…</p></div></div>
        }
      }
      <p class="login-error" *ngIf="scanError">{{ scanError }}</p>

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
export class IngredientFormComponent implements OnChanges, OnInit {
  @Input() ingredient: Ingredient | null = null;
  /** Prefills a new (non-edit) ingredient — e.g. macros looked up from a scanned barcode. Ignored when `ingredient` is set. */
  @Input() initial: Partial<Omit<Ingredient, 'id'>> | null = null;
  /** Opens the scanner immediately instead of waiting for the user to tap "Scan barcode" — used when the caller's own trigger already meant "scan". */
  @Input() autoOpenScanner = false;
  @Output() saved = new EventEmitter<Ingredient>();
  @Output() cancelled = new EventEmitter<void>();

  name = '';
  caloriesPer100g = 100;
  proteinPer100g = 0;
  carbsPer100g = 0;
  fibrePer100g = 0;
  scanning = false;
  scanError: string | null = null;

  constructor(
    private ingredientsService: IngredientsService,
    private openFoodFacts: OpenFoodFactsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.autoOpenScanner && !this.ingredient) {
      this.scanning = true;
    }
  }

  ngOnChanges(): void {
    const source = this.ingredient ?? this.initial;
    this.name = source?.name ?? '';
    this.caloriesPer100g = source?.caloriesPer100g ?? 100;
    this.proteinPer100g = source?.proteinPer100g ?? 0;
    this.carbsPer100g = source?.carbsPer100g ?? 0;
    this.fibrePer100g = source?.fibrePer100g ?? 0;
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
        this.caloriesPer100g = product.caloriesPer100g;
        this.proteinPer100g = product.proteinPer100g;
        this.carbsPer100g = product.carbsPer100g;
        this.fibrePer100g = product.fibrePer100g;
      }
    } catch (error) {
      console.error('Barcode lookup failed', error);
      this.scanError = 'Could not look up that barcode — enter the ingredient manually below.';
    }
    this.cdr.detectChanges();
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
