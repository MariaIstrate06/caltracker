import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Drink, Profile } from '../../models';
import { DrinksService } from '../../services/drinks.service';
import { LogService } from '../../services/log.service';
import { ProfilesService } from '../../services/profiles.service';
import { computeDayTotals, computeDrinkTotals } from '../../utils/macro-calc.util';
import { getBucharestToday } from '../../utils/timezone.util';

@Component({
  selector: 'app-drinks',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <h2>Add a drink</h2>

    <div *ngIf="!activeProfile" class="empty-state">
      No active profile yet. <a routerLink="/settings">Go to Settings</a> to create one.
    </div>

    <div class="entry-list" *ngIf="activeProfile">
      <div class="entry-row" *ngFor="let drink of drinks">
        <div class="entry-info">
          <strong>{{ drink.name }}</strong>
          <small>{{ drink.calories }} kcal · {{ remainingFor(drink) }} left today</small>
        </div>
        <div class="entry-actions">
          <div class="stepper">
            <button (click)="changeQuantity(drink, -1)">-</button>
            <span>{{ quantityFor(drink) }}</span>
            <button (click)="changeQuantity(drink, 1)">+</button>
          </div>
          <button class="btn btn-drink btn-small" (click)="logDrink(drink)">
            {{ justLoggedId === drink.id ? 'Logged ✓' : 'Log ' + quantityFor(drink) + 'x' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class DrinksComponent implements OnInit {
  activeProfile: Profile | null = null;
  drinks: Drink[] = [];
  quantities: Record<string, number> = {};
  caloriesRemaining = 0;
  justLoggedId: string | null = null;

  constructor(
    private profilesService: ProfilesService,
    private drinksService: DrinksService,
    private logService: LogService
  ) {}

  ngOnInit(): void {
    this.activeProfile = this.profilesService.getActiveProfile() ?? null;
    this.drinks = this.drinksService.getAll();
    this.refreshRemaining();
  }

  quantityFor(drink: Drink): number {
    return this.quantities[drink.id] ?? 1;
  }

  changeQuantity(drink: Drink, delta: number): void {
    this.quantities = { ...this.quantities, [drink.id]: Math.max(1, this.quantityFor(drink) + delta) };
  }

  remainingFor(drink: Drink): string {
    if (drink.calories <= 0) {
      return '∞';
    }
    return String(Math.max(0, Math.floor(this.caloriesRemaining / drink.calories)));
  }

  logDrink(drink: Drink): void {
    const profile = this.activeProfile;
    if (!profile) {
      return;
    }
    const quantity = this.quantityFor(drink);
    const totals = computeDrinkTotals(drink, quantity);
    this.logService.addEntry({
      profileId: profile.id,
      date: getBucharestToday(),
      type: 'drink',
      refId: drink.id,
      quantity,
      timestamp: new Date().toISOString(),
      computedCalories: totals.calories,
      computedProtein: totals.protein,
    });
    this.quantities = { ...this.quantities, [drink.id]: 1 };
    this.refreshRemaining();

    this.justLoggedId = drink.id;
    setTimeout(() => {
      if (this.justLoggedId === drink.id) {
        this.justLoggedId = null;
      }
    }, 1200);
  }

  private refreshRemaining(): void {
    if (!this.activeProfile) {
      this.caloriesRemaining = 0;
      return;
    }
    const entries = this.logService.getForProfileAndDate(this.activeProfile.id, getBucharestToday());
    const totals = computeDayTotals(entries);
    this.caloriesRemaining = Math.max(0, Math.round(this.activeProfile.dailyCalorieGoal - totals.calories));
  }
}
