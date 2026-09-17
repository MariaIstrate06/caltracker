import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CountUpDirective } from '../../components/count-up.directive';
import { ProgressRingsComponent } from '../../components/progress-rings/progress-rings.component';
import { Profile } from '../../models';
import { DrinksService } from '../../services/drinks.service';
import { LogService } from '../../services/log.service';
import { ProfilesService } from '../../services/profiles.service';
import { SnacksService } from '../../services/snacks.service';
import { computeDayTotals } from '../../utils/macro-calc.util';
import { pluralize } from '../../utils/pluralize.util';
import { getBucharestToday } from '../../utils/timezone.util';

interface ChipAvailability {
  id: string;
  label: string;
  remaining: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, CountUpDirective, ProgressRingsComponent],
  template: `
    <div class="empty-state" *ngIf="loadError">
      Couldn't load your data. <button class="btn btn-small" (click)="refresh()">Retry</button>
    </div>

    <ng-container *ngIf="profile as profile">
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

      <div class="card" *ngIf="availability.length">
        <h3>Drinks & snacks available</h3>
        <div class="drinks-grid">
          <div class="drink-chip" *ngFor="let item of availability">
            <span class="drink-chip-count numeric">{{ item.remaining }}</span>
            <span class="drink-chip-name">{{ item.label }}</span>
          </div>
        </div>
      </div>
      <div class="empty-state" *ngIf="!availability.length">
        No drinks/snacks picked yet. Choose some in <a routerLink="/settings">Settings</a>.
      </div>

      <div class="actions">
        <a class="btn btn-primary actions-full" routerLink="/log-meal">Log a meal</a>
        <a class="btn actions-full" routerLink="/log-drink">Log a drink</a>
      </div>
    </ng-container>
  `,
})
export class HomeComponent implements OnInit {
  profile: Profile | null = null;
  loadError = false;
  caloriesRemaining = 0;
  caloriesOverAmount = 0;
  caloriePercent = 0;
  isOverCalorieGoal = false;
  proteinLogged = 0;
  proteinPercent = 0;
  availability: ChipAvailability[] = [];

  constructor(
    private profilesService: ProfilesService,
    private logService: LogService,
    private drinksService: DrinksService,
    private snacksService: SnacksService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    this.loadError = false;
    try {
      const profile = await this.profilesService.getMine();
      this.profile = profile;

      const today = getBucharestToday();
      const [entries, drinks, snacks] = await Promise.all([
        this.logService.getForDate(today),
        this.drinksService.getAll(),
        this.snacksService.getAll(),
      ]);
      const totals = computeDayTotals(entries);

      this.caloriesRemaining = Math.max(0, Math.round(profile.dailyCalorieGoal - totals.calories));
      this.caloriesOverAmount = Math.max(0, Math.round(totals.calories - profile.dailyCalorieGoal));
      this.isOverCalorieGoal = totals.calories > profile.dailyCalorieGoal;
      this.caloriePercent = profile.dailyCalorieGoal > 0 ? Math.min(100, (totals.calories / profile.dailyCalorieGoal) * 100) : 0;
      this.proteinLogged = Math.round(totals.protein * 10) / 10;
      this.proteinPercent = profile.dailyProteinGoal > 0 ? Math.min(100, (totals.protein / profile.dailyProteinGoal) * 100) : 0;

      const featuredDrinks = drinks.filter((drink) => profile.featuredDrinkIds.includes(drink.id));
      const featuredSnacks = snacks.filter((snack) => profile.featuredSnackIds.includes(snack.id));

      const toChip = (item: { id: string; name: string; calories: number }): ChipAvailability => ({
        id: item.id,
        label: pluralize(item.name),
        remaining: item.calories > 0 ? String(Math.max(0, Math.floor(this.caloriesRemaining / item.calories))) : '∞',
      });

      this.availability = [...featuredDrinks.map(toChip), ...featuredSnacks.map(toChip)];
    } catch (error) {
      console.error('Failed to load Home data', error);
      this.loadError = true;
    } finally {
      // Belt-and-suspenders: force a synchronous view check right here instead of relying on
      // zone-triggered change detection to notice this async update on its own.
      this.cdr.detectChanges();
    }
  }
}
