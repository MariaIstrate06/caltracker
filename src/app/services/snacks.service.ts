import { Injectable } from '@angular/core';
import { Snack } from '../models';
import { SupabaseRepository } from './supabase-repository.base';

@Injectable({ providedIn: 'root' })
export class SnacksService extends SupabaseRepository<Snack> {
  protected readonly table = 'snacks';

  protected mapFromRow(row: Record<string, any>): Snack {
    return {
      id: row['id'],
      name: row['name'],
      calories: Number(row['calories']),
      protein: Number(row['protein']),
    };
  }

  protected mapToRow(input: Record<string, any>): Record<string, any> {
    const row: Record<string, any> = {};
    if (input['name'] !== undefined) row['name'] = input['name'];
    if (input['calories'] !== undefined) row['calories'] = input['calories'];
    if (input['protein'] !== undefined) row['protein'] = input['protein'];
    return row;
  }
}
