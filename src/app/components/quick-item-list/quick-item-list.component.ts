import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { Drink } from '../../models';
import { LogEntryType } from '../../models/daily-log-entry.model';
import { LogService } from '../../services/log.service';
import { ProfilesService } from '../../services/profiles.service';
import { SupabaseRepository } from '../../services/supabase-repository.base';
import { computeDayTotals, computeDrinkTotals } from '../../utils/macro-calc.util';
import { getBucharestToday } from '../../utils/timezone.util';

/**
 * Quick-add stepper list for a flat "calories + protein" item type. Drinks and Snacks are
 * structurally identical (name/calories/protein), so this one component — parameterized by
 * which repository to read/write — covers both instead of two near-duplicate list components.
 */
@Component({
  selector: 'app-quick-item-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state" *ngIf="loadError">
      Couldn't load. <button class="btn btn-small" (click)="refresh()">Retry</button>
    </div>

    <div class="entry-list" *ngIf="!loadError">
      <div class="entry-row" *ngFor="let item of repo.items()">
        <div class="entry-info">
          <strong>{{ item.name }}</strong>
          <small>{{ item.calories }} kcal · {{ remainingFor(item) }} left today</small>
        </div>
        <div class="entry-actions">
          <div class="stepper">
            <button (click)="changeQuantity(item, -1)">-</button>
            <span>{{ quantityFor(item) }}</span>
            <button (click)="changeQuantity(item, 1)">+</button>
          </div>
          <button class="btn btn-drink btn-small" (click)="logItem(item)">
            {{ justLoggedId === item.id ? 'Logged ✓' : 'Log ' + quantityFor(item) + 'x' }}
          </button>
        </div>
      </div>
      <div class="empty-state" *ngIf="!repo.items().length">Nothing here yet — add one in Manage.</div>
    </div>
  `,
})
export class QuickItemListComponent implements OnInit {
  @Input({ required: true }) repo!: SupabaseRepository<Drink>;
  @Input({ required: true }) logType!: LogEntryType;

  quantities: Record<string, number> = {};
  caloriesRemaining = 0;
  justLoggedId: string | null = null;
  loadError = false;

  private dailyCalorieGoal = 0;

  constructor(
    private profilesService: ProfilesService,
    private logService: LogService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    this.loadError = false;
    try {
      const [profile] = await Promise.all([this.profilesService.getMine(), this.repo.getAll()]);
      this.dailyCalorieGoal = profile.dailyCalorieGoal;
      await this.refreshRemaining();
    } catch (error) {
      console.error('Failed to load quick-item list', error);
      this.loadError = true;
    } finally {
      this.cdr.detectChanges();
    }
  }

  quantityFor(item: Drink): number {
    return this.quantities[item.id] ?? 1;
  }

  changeQuantity(item: Drink, delta: number): void {
    this.quantities = { ...this.quantities, [item.id]: Math.max(1, this.quantityFor(item) + delta) };
  }

  remainingFor(item: Drink): string {
    if (item.calories <= 0) {
      return '∞';
    }
    return String(Math.max(0, Math.floor(this.caloriesRemaining / item.calories)));
  }

  async logItem(item: Drink): Promise<void> {
    const quantity = this.quantityFor(item);
    const totals = computeDrinkTotals(item, quantity);
    await this.logService.addEntry({
      date: getBucharestToday(),
      type: this.logType,
      refId: item.id,
      quantity,
      timestamp: new Date().toISOString(),
      computedCalories: totals.calories,
      computedProtein: totals.protein,
    });
    this.quantities = { ...this.quantities, [item.id]: 1 };
    await this.refreshRemaining();

    this.justLoggedId = item.id;
    this.cdr.detectChanges();
    setTimeout(() => {
      if (this.justLoggedId === item.id) {
        this.justLoggedId = null;
        this.cdr.detectChanges();
      }
    }, 1200);
  }

  private async refreshRemaining(): Promise<void> {
    const entries = await this.logService.getForDate(getBucharestToday());
    const totals = computeDayTotals(entries);
    this.caloriesRemaining = Math.max(0, Math.round(this.dailyCalorieGoal - totals.calories));
  }
}
