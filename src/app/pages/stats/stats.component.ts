import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { BarChartComponent, ChartBar } from '../../components/bar-chart/bar-chart.component';
import { CountUpDirective } from '../../components/count-up.directive';
import { DailyLogEntry } from '../../models';
import { LogService } from '../../services/log.service';
import { ProfilesService } from '../../services/profiles.service';
import {
  computeDayStats,
  computeStreaks,
  computeWeekAverage,
  DayStat,
  getMonthGrid,
  getWeekDates,
  StreakResult,
  WeekAverage,
} from '../../utils/stats.util';
import { getBucharestToday, shiftDateKey } from '../../utils/timezone.util';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TREND_DAYS = 28;

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, BarChartComponent, CountUpDirective],
  template: `
    <h2>Stats</h2>

    <div class="stats-row">
      <div class="stat">
        <div class="stat-value numeric" [appCountUp]="streaks.current">0</div>
        <div class="stat-label">day streak</div>
      </div>
      <div class="stat">
        <div class="stat-value numeric" [appCountUp]="streaks.best">0</div>
        <div class="stat-label">best streak</div>
      </div>
    </div>

    <div class="card">
      <div class="day-nav">
        <button class="btn btn-small" (click)="prevWeek()">←</button>
        <strong>{{ weekLabel }}</strong>
        <button class="btn btn-small" (click)="nextWeek()" [disabled]="isCurrentWeek">→</button>
      </div>
      <div class="stats-row">
        <div class="stat">
          <div class="stat-value numeric" [appCountUp]="weekAverage.avgCalories">0</div>
          <div class="stat-label">avg kcal/day</div>
        </div>
        <div class="stat">
          <div class="stat-value numeric" [appCountUp]="weekAverage.avgProtein" [countUpDecimals]="1">0</div>
          <div class="stat-label">avg protein/day</div>
        </div>
      </div>
      <p class="muted" *ngIf="weekAverage.daysLogged === 0">No days logged yet this week.</p>
    </div>

    <div class="card">
      <div class="day-nav">
        <button class="btn btn-small" (click)="prevMonth()">←</button>
        <strong>{{ monthLabel }}</strong>
        <button class="btn btn-small" (click)="nextMonth()" [disabled]="isCurrentMonth">→</button>
      </div>

      <div class="calendar-grid">
        <div class="calendar-weekday" *ngFor="let label of weekdayLabels">{{ label }}</div>
        <ng-container *ngFor="let week of monthGrid">
          <div
            class="calendar-day"
            *ngFor="let date of week"
            [class.calendar-day-outside]="!isInMonth(date)"
            [class.calendar-day-good]="statusFor(date).hasData && !statusFor(date).isOverGoal"
            [class.calendar-day-over]="statusFor(date).isOverGoal"
            [class.calendar-day-none]="!statusFor(date).hasData"
            [title]="dayTooltip(date)"
          >
            {{ dayOfMonth(date) }}
          </div>
        </ng-container>
      </div>

      <div class="legend-row">
        <span class="legend-dot legend-good"></span>Under goal
        <span class="legend-dot legend-over"></span>Over goal
        <span class="legend-dot legend-none"></span>No data
      </div>
    </div>

    <div class="card">
      <h3>Calories · last {{ trendDays }} days</h3>
      <app-bar-chart [bars]="trendCalorieBars" [goalLine]="dailyCalorieGoal" />
    </div>

    <div class="card">
      <h3>Protein · last {{ trendDays }} days</h3>
      <app-bar-chart [bars]="trendProteinBars" [goalLine]="dailyProteinGoal" />
    </div>
  `,
})
export class StatsComponent implements OnInit {
  weekdayLabels = WEEKDAY_LABELS;
  trendDays = TREND_DAYS;

  today = getBucharestToday();
  weekAnchor = this.today;
  weekAverage: WeekAverage = { weekDates: [], avgCalories: 0, avgProtein: 0, daysLogged: 0 };

  monthYear = 0;
  monthMonth = 0;
  monthGrid: string[][] = [];

  streaks: StreakResult = { current: 0, best: 0 };
  trendCalorieBars: ChartBar[] = [];
  trendProteinBars: ChartBar[] = [];

  dailyCalorieGoal = 0;
  dailyProteinGoal = 0;

  private allEntries: DailyLogEntry[] = [];
  private dayStatusCache = new Map<string, DayStat>();

  constructor(
    private profilesService: ProfilesService,
    private logService: LogService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    const [profile, entries] = await Promise.all([this.profilesService.getMine(), this.logService.getAll()]);
    this.dailyCalorieGoal = profile.dailyCalorieGoal;
    this.dailyProteinGoal = profile.dailyProteinGoal;
    this.allEntries = entries;

    const [year, month] = this.today.split('-').map(Number);
    this.monthYear = year;
    this.monthMonth = month;

    this.refreshWeek();
    this.refreshMonth();
    this.streaks = computeStreaks(this.allEntries, this.dailyCalorieGoal, this.today);
    this.buildTrendBars();
    this.cdr.detectChanges();
  }

  get isCurrentWeek(): boolean {
    return getWeekDates(this.weekAnchor)[0] === getWeekDates(this.today)[0];
  }

  get isCurrentMonth(): boolean {
    const [year, month] = this.today.split('-').map(Number);
    return this.monthYear === year && this.monthMonth === month;
  }

  get weekLabel(): string {
    const dates = this.weekAverage.weekDates;
    if (!dates.length) {
      return '';
    }
    const range = `${this.formatShortDate(dates[0])} – ${this.formatShortDate(dates[6])}`;
    return this.isCurrentWeek ? `This week (${range})` : range;
  }

  get monthLabel(): string {
    return new Date(Date.UTC(this.monthYear, this.monthMonth - 1, 1)).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }

  prevWeek(): void {
    this.weekAnchor = shiftDateKey(this.weekAnchor, -7);
    this.refreshWeek();
  }

  nextWeek(): void {
    if (this.isCurrentWeek) {
      return;
    }
    this.weekAnchor = shiftDateKey(this.weekAnchor, 7);
    this.refreshWeek();
  }

  prevMonth(): void {
    this.monthMonth--;
    if (this.monthMonth < 1) {
      this.monthMonth = 12;
      this.monthYear--;
    }
    this.refreshMonth();
  }

  nextMonth(): void {
    if (this.isCurrentMonth) {
      return;
    }
    this.monthMonth++;
    if (this.monthMonth > 12) {
      this.monthMonth = 1;
      this.monthYear++;
    }
    this.refreshMonth();
  }

  isInMonth(date: string): boolean {
    const [year, month] = date.split('-').map(Number);
    return year === this.monthYear && month === this.monthMonth;
  }

  dayOfMonth(date: string): number {
    return Number(date.split('-')[2]);
  }

  statusFor(date: string): DayStat {
    let status = this.dayStatusCache.get(date);
    if (!status) {
      status = computeDayStats(this.allEntries, date, this.dailyCalorieGoal);
      this.dayStatusCache.set(date, status);
    }
    return status;
  }

  dayTooltip(date: string): string {
    const status = this.statusFor(date);
    if (!status.hasData) {
      return `${date}: no data`;
    }
    return `${date}: ${Math.round(status.calories)} kcal (${status.isOverGoal ? 'over' : 'under'} goal)`;
  }

  private refreshWeek(): void {
    this.weekAverage = computeWeekAverage(this.allEntries, getWeekDates(this.weekAnchor), this.today);
  }

  private refreshMonth(): void {
    this.monthGrid = getMonthGrid(this.monthYear, this.monthMonth);
  }

  private buildTrendBars(): void {
    const dates = Array.from({ length: this.trendDays }, (_, i) => shiftDateKey(this.today, i - (this.trendDays - 1)));
    this.trendCalorieBars = dates.map((date) => {
      const status = this.statusFor(date);
      const color = !status.hasData ? 'var(--status-none)' : status.isOverGoal ? 'var(--status-over)' : 'var(--status-good)';
      return { value: status.calories, color, label: this.formatShortDate(date) };
    });
    this.trendProteinBars = dates.map((date) => {
      const status = this.statusFor(date);
      return { value: status.protein, color: 'var(--accent)', label: this.formatShortDate(date) };
    });
  }

  private formatShortDate(dateKey: string): string {
    const [year, month, day] = dateKey.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
  }
}
