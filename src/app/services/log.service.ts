import { Injectable, NgZone, inject } from '@angular/core';
import { SUPABASE_CLIENT } from '../core/supabase.client';
import { AuthService } from './auth.service';
import { DailyLogEntry } from '../models';

/** Row Level Security scopes every read/write to the signed-in user — no client-side profileId filtering needed. */
@Injectable({ providedIn: 'root' })
export class LogService {
  private readonly supabase = inject(SUPABASE_CLIENT);
  private readonly auth = inject(AuthService);
  private readonly ngZone = inject(NgZone);

  async getAll(): Promise<DailyLogEntry[]> {
    return this.ngZone.run(async () => {
      const { data, error } = await this.supabase.from('log_entries').select('*').order('timestamp');
      if (error) throw error;
      return (data ?? []).map((row) => this.mapFromRow(row));
    });
  }

  async getForDate(date: string): Promise<DailyLogEntry[]> {
    return this.ngZone.run(async () => {
      const { data, error } = await this.supabase.from('log_entries').select('*').eq('date', date).order('timestamp');
      if (error) throw error;
      return (data ?? []).map((row) => this.mapFromRow(row));
    });
  }

  async addEntry(entry: Omit<DailyLogEntry, 'id'>): Promise<DailyLogEntry> {
    const userId = this.auth.requireUserId();
    return this.ngZone.run(async () => {
      const { data, error } = await this.supabase
        .from('log_entries')
        .insert({
          user_id: userId,
          date: entry.date,
          type: entry.type,
          ref_id: entry.refId,
          name: entry.name ?? null,
          items_override: entry.itemsOverride ?? null,
          quantity: entry.quantity ?? null,
          timestamp: entry.timestamp,
          computed_calories: entry.computedCalories,
          computed_protein: entry.computedProtein,
        })
        .select()
        .single();
      if (error) throw error;
      return this.mapFromRow(data);
    });
  }

  /** Updates a log entry in place (e.g. editing its logged quantity) — never touches the underlying meal/drink definition. */
  async update(id: string, patch: Partial<Omit<DailyLogEntry, 'id'>>): Promise<DailyLogEntry | undefined> {
    const row: Record<string, any> = {};
    if (patch.itemsOverride !== undefined) row['items_override'] = patch.itemsOverride;
    if (patch.quantity !== undefined) row['quantity'] = patch.quantity;
    if (patch.computedCalories !== undefined) row['computed_calories'] = patch.computedCalories;
    if (patch.computedProtein !== undefined) row['computed_protein'] = patch.computedProtein;

    return this.ngZone.run(async () => {
      const { data, error } = await this.supabase.from('log_entries').update(row).eq('id', id).select().maybeSingle();
      if (error) throw error;
      return data ? this.mapFromRow(data) : undefined;
    });
  }

  async deleteEntry(id: string): Promise<void> {
    return this.ngZone.run(async () => {
      const { error } = await this.supabase.from('log_entries').delete().eq('id', id);
      if (error) throw error;
    });
  }

  private mapFromRow(row: Record<string, any>): DailyLogEntry {
    return {
      id: row['id'],
      date: row['date'],
      type: row['type'],
      refId: row['ref_id'],
      name: row['name'] ?? undefined,
      itemsOverride: row['items_override'] ?? undefined,
      quantity: row['quantity'] ?? undefined,
      timestamp: row['timestamp'],
      computedCalories: Number(row['computed_calories']),
      computedProtein: Number(row['computed_protein']),
    };
  }
}
