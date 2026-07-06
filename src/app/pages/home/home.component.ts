import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Profile } from '../../models';
import { DrinksService } from '../../services/drinks.service';
import { LogService } from '../../services/log.service';
import { ProfilesService } from '../../services/profiles.service';
import { getBucharestToday } from '../../utils/timezone.util';
import { computeDayTotals } from '../../utils/macro-calc.util';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div *ngIf="!activeProfile" class="empty-state">
      No active profile yet. <a routerLink="/settings">Go to Settings</a> to create one.
    </div>

    <ng-container *ngIf="activeProfile as profile">
      <h2>{{ profile.emoji }} {{ profile.name }}</h2>

      <div class="stats-row">
        <div class="stat">
          <div class="stat-value">{{ caloriesRemaining }}</div>
          <div class="stat-label">calories remaining</div>
        </div>
        <div class="stat">
          <div class="stat-value">{{ drinksRemainingDisplay }}</div>
          <div class="stat-label">drinks remaining</div>
        </div>
      </div>

      <div class="card stat-secondary">
        <span>Protein today</span>
        <span class="stat-value">{{ proteinLogged }} / {{ profile.dailyProteinGoal }} g</span>
      </div>

      <div class="actions">
        <a class="btn btn-primary" routerLink="/log-new-meal">Log a new meal</a>
        <a class="btn" routerLink="/log-existing-meal">Log existing meal</a>
        <a class="btn btn-drink" routerLink="/drinks">🥤 Quick-add a drink</a>
      </div>
    </ng-container>
  `,
})
export class HomeComponent implements OnInit {
  activeProfile: Profile | null = null;
  caloriesRemaining = 0;
  proteinLogged = 0;
  drinksRemainingDisplay = '–';

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
    this.proteinLogged = Math.round(totals.protein * 10) / 10;

    const drinks = this.drinksService.getAll();
    if (drinks.length === 0) {
      this.drinksRemainingDisplay = '–';
      return;
    }
    const avgCalories = drinks.reduce((sum, drink) => sum + drink.calories, 0) / drinks.length;
    this.drinksRemainingDisplay = avgCalories > 0 ? String(Math.floor(this.caloriesRemaining / avgCalories)) : '∞';
  }
}
