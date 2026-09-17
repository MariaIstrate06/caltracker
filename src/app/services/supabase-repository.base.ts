import { NgZone, inject, signal } from '@angular/core';
import { SUPABASE_CLIENT } from '../core/supabase.client';

/**
 * Generic CRUD over a single Supabase table for entities shaped like `{ id, ...columns }`.
 * Subclasses only provide the table name and the camelCase<->snake_case row mapping;
 * see IngredientsService/DrinksService for the plain case, MealsService for a table that
 * also manages a nested child table.
 */
export abstract class SupabaseRepository<T extends { id: string }> {
  protected readonly supabase = inject(SUPABASE_CLIENT);
  private readonly ngZone = inject(NgZone);
  protected abstract readonly table: string;

  private readonly _items = signal<T[]>([]);
  /** Latest fetched list, kept in sync across create/update/delete so every injector of this service sees the same data. */
  readonly items = this._items.asReadonly();

  protected abstract mapFromRow(row: Record<string, any>): T;
  protected abstract mapToRow(input: Record<string, any>): Record<string, any>;

  // Every method routes its Supabase call through ngZone.run — supabase-js's underlying
  // request/auth plumbing can resolve outside Angular's zone, which would otherwise leave a
  // component's state updated but unrendered until an unrelated zone-tracked event (a click)
  // happens to trigger change detection.

  async getAll(): Promise<T[]> {
    return this.ngZone.run(async () => {
      const { data, error } = await this.supabase.from(this.table).select('*');
      if (error) throw error;
      const mapped = (data ?? []).map((row) => this.mapFromRow(row));
      this._items.set(mapped);
      return mapped;
    });
  }

  async getById(id: string): Promise<T | undefined> {
    return this.ngZone.run(async () => {
      const { data, error } = await this.supabase.from(this.table).select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data ? this.mapFromRow(data) : undefined;
    });
  }

  async create(input: Omit<T, 'id'>): Promise<T> {
    return this.ngZone.run(async () => {
      const { data, error } = await this.supabase.from(this.table).insert(this.mapToRow(input)).select().single();
      if (error) throw error;
      const created = this.mapFromRow(data);
      this._items.update((all) => [...all, created]);
      return created;
    });
  }

  async update(id: string, patch: Partial<Omit<T, 'id'>>): Promise<T | undefined> {
    return this.ngZone.run(async () => {
      const { data, error } = await this.supabase.from(this.table).update(this.mapToRow(patch)).eq('id', id).select().maybeSingle();
      if (error) throw error;
      if (!data) {
        return undefined;
      }
      const updated = this.mapFromRow(data);
      this._items.update((all) => all.map((item) => (item.id === id ? updated : item)));
      return updated;
    });
  }

  async delete(id: string): Promise<void> {
    return this.ngZone.run(async () => {
      const { error } = await this.supabase.from(this.table).delete().eq('id', id);
      if (error) throw error;
      this._items.update((all) => all.filter((item) => item.id !== id));
    });
  }
}
