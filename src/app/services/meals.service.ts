import { Injectable } from '@angular/core';
import { Meal } from '../models';
import { STORAGE_KEYS } from './storage-keys';
import { StorageService } from './storage.service';

const STORAGE_KEY = STORAGE_KEYS.meals;

@Injectable({ providedIn: 'root' })
export class MealsService {
  constructor(private storage: StorageService) {}

  getAll(): Meal[] {
    return this.storage.get<Meal[]>(STORAGE_KEY) ?? [];
  }

  getById(id: string): Meal | undefined {
    return this.getAll().find((meal) => meal.id === id);
  }

  create(input: Omit<Meal, 'id' | 'updatedAt'>): Meal {
    const meal: Meal = {
      ...input,
      id: crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
    };
    this.saveAll([...this.getAll(), meal]);
    return meal;
  }

  update(id: string, patch: Partial<Omit<Meal, 'id'>>): Meal | undefined {
    let updated: Meal | undefined;
    const all = this.getAll().map((meal) => {
      if (meal.id !== id) {
        return meal;
      }
      updated = { ...meal, ...patch, id, updatedAt: new Date().toISOString() };
      return updated;
    });
    if (updated) {
      this.saveAll(all);
    }
    return updated;
  }

  delete(id: string): void {
    this.saveAll(this.getAll().filter((meal) => meal.id !== id));
  }

  /** Seeds the store from `seed` only if it's currently empty; never overwrites existing data. */
  seedIfEmpty(seed: Meal[]): void {
    if (this.getAll().length === 0 && seed.length > 0) {
      this.saveAll(seed);
    }
  }

  private saveAll(meals: Meal[]): void {
    this.storage.set(STORAGE_KEY, meals);
  }
}
