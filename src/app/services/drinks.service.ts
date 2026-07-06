import { Injectable } from '@angular/core';
import { Drink } from '../models';
import { StorageService } from './storage.service';

const STORAGE_KEY = 'caltrack.drinks';

@Injectable({ providedIn: 'root' })
export class DrinksService {
  constructor(private storage: StorageService) {}

  getAll(): Drink[] {
    return this.storage.get<Drink[]>(STORAGE_KEY) ?? [];
  }

  getById(id: string): Drink | undefined {
    return this.getAll().find((drink) => drink.id === id);
  }

  create(input: Omit<Drink, 'id' | 'updatedAt'>): Drink {
    const drink: Drink = {
      ...input,
      id: crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
    };
    this.saveAll([...this.getAll(), drink]);
    return drink;
  }

  update(id: string, patch: Partial<Omit<Drink, 'id'>>): Drink | undefined {
    let updated: Drink | undefined;
    const all = this.getAll().map((drink) => {
      if (drink.id !== id) {
        return drink;
      }
      updated = { ...drink, ...patch, id, updatedAt: new Date().toISOString() };
      return updated;
    });
    if (updated) {
      this.saveAll(all);
    }
    return updated;
  }

  delete(id: string): void {
    this.saveAll(this.getAll().filter((drink) => drink.id !== id));
  }

  /** Seeds the store from `seed` only if it's currently empty; never overwrites existing data. */
  seedIfEmpty(seed: Drink[]): void {
    if (this.getAll().length === 0 && seed.length > 0) {
      this.saveAll(seed);
    }
  }

  private saveAll(drinks: Drink[]): void {
    this.storage.set(STORAGE_KEY, drinks);
  }
}
