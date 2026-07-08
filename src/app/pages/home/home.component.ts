import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CountUpDirective } from '../../components/count-up.directive';
import { ProgressRingsComponent } from '../../components/progress-rings/progress-rings.component';
import { Profile } from '../../models';
import { DrinksService } from '../../services/drinks.service';
import { LogService } from '../../services/log.service';
import { ProfilesService } from '../../services/profiles.service';
import { computeDayTotals } from '../../utils/macro-calc.util';
import { pluralize } from '../../utils/pluralize.util';
import { getBucharestToday } from '../../utils/timezone.util';

/** Home shows only this curated set of drinks, in this order — not the whole library (that's what Add a drink is for). */
const FEATURED_DRINK_NAMES = ['Beer', 'Wine glass', 'Gin & Tonic', 'Espresso tonic'];

interface DrinkAvailability {
  id: string;
  label: string;
  remaining: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, CountUpDirective, ProgressRingsComponent],
  template: `
    <div *ngIf="!activeProfile" class="empty-state">
      No active profile yet. <a routerLink="/settings">Go to Settings</a> to create one.
    </div>

    <ng-container *ngIf="activeProfile as profile">
      <h2>{{ profile.emoji }} Hi, {{ profile.name }}.</h2>

      <div class="card rings-card">
        <app-progress-rings [caloriePercent]="caloriePercent" [proteinPercent]="proteinPercent" [caloriesOver]="isOverCalorieGoal" />
        <div class="rings-legend">
          <div class="rings-legend-item">
            <span class="legend-dot" [style.background]="isOverCalorieGoal ? 'var(--status-over)' : 'var(--accent)'"></span>
            <strong class="numeric" [appCountUp]="isOverCalorieGoal ? caloriesOverAmount : caloriesRemaining">0</strong>
            <span>{{ isOverCalorieGoal ? 'kcal over' : 'kcal left' }}</span>
          </div>
          <div class="rings-legend-item">
            <span class="legend-dot" style="background: var(--accent-protein)"></span>
            <strong class="numeric"
              ><span [appCountUp]="proteinLogged" [countUpDecimals]="1">0</span>/{{ profile.dailyProteinGoal }}</strong
            >
            <span>g protein</span>
          </div>
        </div>
      </div>

      <div class="card" *ngIf="drinkAvailability.length">
        <h3>Drinks available</h3>
        <div class="drinks-grid">
          <div class="drink-chip" *ngFor="let drink of drinkAvailability">
            <span class="drink-chip-count numeric">{{ drink.remaining }}</span>
            <span class="drink-chip-name">{{ drink.label }}</span>
          </div>
        </div>
      </div>

      <div class="actions">
        <a class="btn btn-primary actions-full" routerLink="/log-new-meal">Log a new meal</a>
        <a class="btn" routerLink="/log-existing-meal">Log existing meal</a>
        <a class="btn" routerLink="/drinks">Add a drink</a>
      </div>
    </ng-container>
  `,
})
export class HomeComponent implements OnInit {
  activeProfile: Profile | null = null;
  caloriesRemaining = 0;
  caloriesOverAmount = 0;
  caloriePercent = 0;
  isOverCalorieGoal = false;
  proteinLogged = 0;
  proteinPercent = 0;
  drinkAvailability: DrinkAvailability[] = [];

  constructor(
    private profilesService: ProfilesService,
    private logService: LogService,
    private drinksService: DrinksService
  ) {}

  ngOnInit(): void {
    this.refresh();
  }

  private refresh(): void {
    const profile = this.profilesService.getActiveProfile();
    this.activeProfile = profile ?? null;
    if (!profile) {
      return;
    }

    const today = getBucharestToday();
    const entries = this.logService.getForProfileAndDate(profile.id, today);
    const totals = computeDayTotals(entries);

    this.caloriesRemaining = Math.max(0, Math.round(profile.dailyCalorieGoal - totals.calories));
    this.caloriesOverAmount = Math.max(0, Math.round(totals.calories - profile.dailyCalorieGoal));
    this.isOverCalorieGoal = totals.calories > profile.dailyCalorieGoal;
    this.caloriePercent = profile.dailyCalorieGoal > 0 ? Math.min(100, (totals.calories / profile.dailyCalorieGoal) * 100) : 0;
    this.proteinLogged = Math.round(totals.protein * 10) / 10;
    this.proteinPercent = profile.dailyProteinGoal > 0 ? Math.min(100, (totals.protein / profile.dailyProteinGoal) * 100) : 0;

    const featuredIndex = (name: string) => FEATURED_DRINK_NAMES.findIndex((featured) => featured.toLowerCase() === name.toLowerCase());
    this.drinkAvailability = this.drinksService
      .getAll()
      .filter((drink) => featuredIndex(drink.name) !== -1)
      .sort((a, b) => featuredIndex(a.name) - featuredIndex(b.name))
      .map((drink) => ({
        id: drink.id,
        label: pluralize(drink.name),
        remaining: drink.calories > 0 ? String(Math.max(0, Math.floor(this.caloriesRemaining / drink.calories))) : '∞',
      }));
  }
}
