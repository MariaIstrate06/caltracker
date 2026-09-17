import { Injectable, NgZone, inject } from '@angular/core';
import { SUPABASE_CLIENT } from '../core/supabase.client';
import { Profile } from '../models';
import { AuthService } from './auth.service';

/** A user has exactly one profile row (auto-created by a DB trigger on signup), so this is a singular resource, not a list. */
@Injectable({ providedIn: 'root' })
export class ProfilesService {
  private readonly supabase = inject(SUPABASE_CLIENT);
  private readonly auth = inject(AuthService);
  private readonly ngZone = inject(NgZone);

  async getMine(): Promise<Profile> {
    const userId = this.auth.requireUserId();
    return this.ngZone.run(async () => {
      const { data, error } = await this.supabase.from('profiles').select('*').eq('id', userId).single();
      if (error) throw error;
      return this.mapFromRow(data);
    });
  }

  async updateMine(patch: Partial<Omit<Profile, 'id'>>): Promise<Profile> {
    const userId = this.auth.requireUserId();
    const row: Record<string, any> = {};
    if (patch.name !== undefined) row['name'] = patch.name;
    if (patch.emoji !== undefined) row['emoji'] = patch.emoji;
    if (patch.dailyCalorieGoal !== undefined) row['daily_calorie_goal'] = patch.dailyCalorieGoal;
    if (patch.dailyProteinGoal !== undefined) row['daily_protein_goal'] = patch.dailyProteinGoal;
    if (patch.theme !== undefined) row['theme'] = patch.theme;
    if (patch.featuredDrinkIds !== undefined) row['featured_drink_ids'] = patch.featuredDrinkIds;
    if (patch.featuredSnackIds !== undefined) row['featured_snack_ids'] = patch.featuredSnackIds;

    return this.ngZone.run(async () => {
      const { data, error } = await this.supabase.from('profiles').update(row).eq('id', userId).select().single();
      if (error) throw error;
      return this.mapFromRow(data);
    });
  }

  private mapFromRow(row: Record<string, any>): Profile {
    return {
      id: row['id'],
      name: row['name'],
      emoji: row['emoji'],
      dailyCalorieGoal: Number(row['daily_calorie_goal']),
      dailyProteinGoal: Number(row['daily_protein_goal']),
      theme: row['theme'] === 'pink' ? 'pink' : 'green',
      featuredDrinkIds: row['featured_drink_ids'] ?? [],
      featuredSnackIds: row['featured_snack_ids'] ?? [],
    };
  }
}
