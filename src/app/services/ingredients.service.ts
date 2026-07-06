import { Injectable } from '@angular/core';
import { Ingredient } from '../models';
import { StorageService } from './storage.service';

const STORAGE_KEY = 'caltrack.ingredients';

@Injectable({ providedIn: 'root' })
export class IngredientsService {
  constructor(private storage: StorageService) {}

  getAll(): Ingredient[] {
    return this.storage.get<Ingredient[]>(STORAGE_KEY) ?? [];
  }

  getById(id: string): Ingredient | undefined {
    return this.getAll().find((ingredient) => ingredient.id === id);
  }

  create(input: Omit<Ingredient, 'id' | 'updatedAt'>): Ingredient {
    const ingredient: Ingredient = {
      ...input,
      id: crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
    };
    this.saveAll([...this.getAll(), ingredient]);
    return ingredient;
  }

  update(id: string, patch: Partial<Omit<Ingredient, 'id'>>): Ingredient | undefined {
    let updated: Ingredient | undefined;
    const all = this.getAll().map((ingredient) => {
      if (ingredient.id !== id) {
        return ingredient;
      }
      updated = { ...ingredient, ...patch, id, updatedAt: new Date().toISOString() };
      return updated;
    });
    if (updated) {
      this.saveAll(all);
    }
    return updated;
  }

  delete(id: string): void {
    this.saveAll(this.getAll().filter((ingredient) => ingredient.id !== id));
  }

  /** Seeds the store from `seed` only if it's currently empty; never overwrites existing data. */
  seedIfEmpty(seed: Ingredient[]): void {
    if (this.getAll().length === 0 && seed.length > 0) {
      this.saveAll(seed);
    }
  }

  private saveAll(ingredients: Ingredient[]): void {
    this.storage.set(STORAGE_KEY, ingredients);
  }
}
