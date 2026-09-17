import { Injectable } from '@angular/core';

export interface ScannedProduct {
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fibrePer100g: number;
  /** Per-serving values, when Open Food Facts has them — more appropriate for a flat "one item" trackable like a drink or snack than the per-100g figures. Null when the product has no serving-size data. */
  caloriesPerServing: number | null;
  proteinPerServing: number | null;
}

/** Free, keyless product database (openfoodfacts.org) used to fill in macros from a scanned barcode. */
@Injectable({ providedIn: 'root' })
export class OpenFoodFactsService {
  async lookupByBarcode(barcode: string): Promise<ScannedProduct | null> {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=product_name,generic_name,nutriments`
    );
    if (!response.ok) {
      return null;
    }
    const body = await response.json();
    if (body.status !== 1 || !body.product) {
      return null;
    }
    const nutriments = body.product.nutriments ?? {};
    const name = body.product.product_name || body.product.generic_name;
    if (!name) {
      return null;
    }
    const caloriesPerServing = nutriments['energy-kcal_serving'];
    const proteinPerServing = nutriments['proteins_serving'];
    return {
      name,
      caloriesPer100g: Number(nutriments['energy-kcal_100g'] ?? 0),
      proteinPer100g: Number(nutriments['proteins_100g'] ?? 0),
      carbsPer100g: Number(nutriments['carbohydrates_100g'] ?? 0),
      fibrePer100g: Number(nutriments['fiber_100g'] ?? 0),
      caloriesPerServing: caloriesPerServing !== undefined ? Number(caloriesPerServing) : null,
      proteinPerServing: proteinPerServing !== undefined ? Number(proteinPerServing) : null,
    };
  }
}
