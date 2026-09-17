import { Injectable, NgZone, inject, signal } from '@angular/core';
import { SUPABASE_CLIENT } from '../core/supabase.client';
import { Meal, MealItem } from '../models';

/**
 * Meals can't extend SupabaseRepository directly: each meal also owns a `meal_items` child
 * table (its ingredient list), which needs its own read (nested select) and write
 * (full replace on create/update) path alongside the `meals` row itself.
 */
@Injectable({ providedIn: 'root' })
export class MealsService {
  private readonly supabase = inject(SUPABASE_CLIENT);
  private readonly ngZone = inject(NgZone);

  private readonly _items = signal<Meal[]>([]);
  readonly items = this._items.asReadonly();

  async getAll(): Promise<Meal[]> {
    return this.ngZone.run(async () => {
      const { data, error } = await this.supabase.from('meals').select('*, meal_items(*)');
      if (error) throw error;
      const mapped = (data ?? []).map((row) => this.mapFromRow(row));
      this._items.set(mapped);
      return mapped;
    });
  }

  async getById(id: string): Promise<Meal | undefined> {
    return this.ngZone.run(async () => {
      const { data, error } = await this.supabase.from('meals').select('*, meal_items(*)').eq('id', id).maybeSingle();
      if (error) throw error;
      return data ? this.mapFromRow(data) : undefined;
    });
  }

  async create(input: Omit<Meal, 'id'>): Promise<Meal> {
    return this.ngZone.run(async () => {
      const { data, error } = await this.supabase
        .from('meals')
        .insert({ name: input.name, category: input.category, icon: input.icon ?? null })
        .select()
        .single();
      if (error) throw error;

      const mealId = data['id'] as string;
      await this.replaceMealItems(mealId, input.items);

      const created = await this.getById(mealId);
      if (!created) {
        throw new Error('Failed to load newly created meal');
      }
      this._items.update((all) => [...all, created]);
      return created;
    });
  }

  async update(id: string, patch: Partial<Omit<Meal, 'id'>>): Promise<Meal | undefined> {
    return this.ngZone.run(async () => {
      const row: Record<string, any> = {};
      if (patch.name !== undefined) row['name'] = patch.name;
      if (patch.category !== undefined) row['category'] = patch.category;
      if (patch.icon !== undefined) row['icon'] = patch.icon;
      if (Object.keys(row).length > 0) {
        const { error } = await this.supabase.from('meals').update(row).eq('id', id);
        if (error) throw error;
      }
      if (patch.items !== undefined) {
        await this.replaceMealItems(id, patch.items);
      }

      const updated = await this.getById(id);
      if (updated) {
        this._items.update((all) => all.map((meal) => (meal.id === id ? updated : meal)));
      }
      return updated;
    });
  }

  async delete(id: string): Promise<void> {
    return this.ngZone.run(async () => {
      const { error } = await this.supabase.from('meals').delete().eq('id', id);
      if (error) throw error;
      this._items.update((all) => all.filter((meal) => meal.id !== id));
    });
  }

  private async replaceMealItems(mealId: string, items: MealItem[]): Promise<void> {
    const { error: deleteError } = await this.supabase.from('meal_items').delete().eq('meal_id', mealId);
    if (deleteError) throw deleteError;
    if (items.length === 0) {
      return;
    }
    const rows = items.map((item) => ({ meal_id: mealId, ingredient_id: item.ingredientId, amount_grams: item.amountGrams }));
    const { error: insertError } = await this.supabase.from('meal_items').insert(rows);
    if (insertError) throw insertError;
  }

  private mapFromRow(row: Record<string, any>): Meal {
    const items: MealItem[] = (row['meal_items'] ?? []).map((item: Record<string, any>) => ({
      ingredientId: item['ingredient_id'],
      amountGrams: Number(item['amount_grams']),
    }));
    return {
      id: row['id'],
      name: row['name'],
      category: row['category'],
      icon: row['icon'] ?? undefined,
      items,
    };
  }
}
