import { DailyLogEntry } from '../models/daily-log-entry.model';
import { computeDayTotals, MacroTotals } from './macro-calc.util';
import { shiftDateKey } from './timezone.util';

export interface DayStat {
  date: string;
  hasData: boolean;
  calories: number;
  protein: number;
  /** Strictly more than the goal — no tolerance band. False for no-data days. */
  isOverGoal: boolean;
}

export function computeDayStats(entries: DailyLogEntry[], date: string, calorieGoal: number): DayStat {
  const dayEntries = entries.filter((entry) => entry.date === date);
  const hasData = dayEntries.length > 0;
  const totals: MacroTotals = computeDayTotals(dayEntries);
  return {
    date,
    hasData,
    calories: totals.calories,
    protein: totals.protein,
    isOverGoal: hasData && totals.calories > calorieGoal,
  };
}

/** The Monday-start week containing `date`, as 7 yyyy-MM-dd keys (Mon..Sun). */
export function getWeekDates(date: string): string[] {
  const [year, month, day] = date.split('-').map(Number);
  const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay(); // 0=Sun..6=Sat
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = shiftDateKey(date, mondayOffset);
  return Array.from({ length: 7 }, (_, i) => shiftDateKey(monday, i));
}

export interface WeekAverage {
  weekDates: string[];
  avgCalories: number;
  avgProtein: number;
  /** How many days in the week actually have logged data — the average's denominator. */
  daysLogged: number;
}

/**
 * Averages only over days that were actually logged, among those already elapsed (date <= today).
 * A day with no data — whether it's before the user started tracking or just a day they forgot to
 * log — must not silently count as a zero-calorie day and drag the average down; same principle as
 * the calendar's no-data state.
 */
export function computeWeekAverage(entries: DailyLogEntry[], weekDates: string[], today: string): WeekAverage {
  const elapsedDates = weekDates.filter((date) => date <= today);
  const loggedDates = elapsedDates.filter((date) => entries.some((entry) => entry.date === date));
  const totals = loggedDates.map((date) => computeDayTotals(entries.filter((entry) => entry.date === date)));
  const sum = totals.reduce((acc, t) => ({ calories: acc.calories + t.calories, protein: acc.protein + t.protein }), {
    calories: 0,
    protein: 0,
  });
  const daysLogged = loggedDates.length;
  return {
    weekDates,
    avgCalories: daysLogged ? sum.calories / daysLogged : 0,
    avgProtein: daysLogged ? sum.protein / daysLogged : 0,
    daysLogged,
  };
}

/** Mon..Sun weeks (rows) covering the full calendar month, for a month-style calendar grid. */
export function getMonthGrid(year: number, month: number): string[][] {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastOfMonth = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  const weeks: string[][] = [];
  let cursor = getWeekDates(firstOfMonth)[0];
  const lastWeekEnd = getWeekDates(lastOfMonth)[6];
  while (true) {
    const week = getWeekDates(cursor);
    weeks.push(week);
    if (week[6] >= lastWeekEnd) {
      break;
    }
    cursor = shiftDateKey(cursor, 7);
  }
  return weeks;
}

export interface StreakResult {
  current: number;
  best: number;
}

/**
 * Consecutive days at-or-under the calorie goal. A day with no logged data breaks the streak —
 * it must never silently count as a win just because 0 calories isn't "over."
 */
export function computeStreaks(entries: DailyLogEntry[], calorieGoal: number, today: string): StreakResult {
  const entriesByDate = new Map<string, DailyLogEntry[]>();
  for (const entry of entries) {
    const list = entriesByDate.get(entry.date);
    if (list) {
      list.push(entry);
    } else {
      entriesByDate.set(entry.date, [entry]);
    }
  }

  if (entriesByDate.size === 0) {
    return { current: 0, best: 0 };
  }

  const hitGoal = (date: string): boolean => {
    const dayEntries = entriesByDate.get(date);
    if (!dayEntries || dayEntries.length === 0) {
      return false;
    }
    return computeDayTotals(dayEntries).calories <= calorieGoal;
  };

  const earliestDate = [...entriesByDate.keys()].sort()[0];

  let current = 0;
  let cursor = today;
  while (cursor >= earliestDate && hitGoal(cursor)) {
    current++;
    cursor = shiftDateKey(cursor, -1);
  }

  let best = 0;
  let running = 0;
  for (let date = earliestDate; date <= today; date = shiftDateKey(date, 1)) {
    if (hitGoal(date)) {
      running++;
      best = Math.max(best, running);
    } else {
      running = 0;
    }
  }

  return { current, best };
}
