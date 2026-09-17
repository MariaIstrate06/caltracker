import { Injectable } from '@angular/core';
import { Ingredient } from '../models';
import { SupabaseRepository } from './supabase-repository.base';

@Injectable({ providedIn: 'root' })
export class IngredientsService extends SupabaseRepository<Ingredient> {
  protected readonly table = 'ingredients';

  protected mapFromRow(row: Record<string, any>): Ingredient {
    return {
      id: row['id'],
      name: row['name'],
      caloriesPer100g: Number(row['calories_per_100g']),
      proteinPer100g: Number(row['protein_per_100g']),
      carbsPer100g: Number(row['carbs_per_100g']),
      fibrePer100g: Number(row['fibre_per_100g']),
    };
  }

  protected mapToRow(input: Record<string, any>): Record<string, any> {
    const row: Record<string, any> = {};
    if (input['name'] !== undefined) row['name'] = input['name'];
    if (input['caloriesPer100g'] !== undefined) row['calories_per_100g'] = input['caloriesPer100g'];
    if (input['proteinPer100g'] !== undefined) row['protein_per_100g'] = input['proteinPer100g'];
    if (input['carbsPer100g'] !== undefined) row['carbs_per_100g'] = input['carbsPer100g'];
    if (input['fibrePer100g'] !== undefined) row['fibre_per_100g'] = input['fibrePer100g'];
    return row;
  }
}
