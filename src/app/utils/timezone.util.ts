const BUCHAREST_TIME_ZONE = 'Europe/Bucharest';

const dateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: BUCHAREST_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Returns today's calendar date (yyyy-MM-dd) as observed in the Europe/Bucharest timezone. */
export function getBucharestToday(): string {
  return dateKeyFormatter.format(new Date());
}

/** Returns the calendar date (yyyy-MM-dd) that the given timestamp falls on in Europe/Bucharest. */
export function getBucharestDateForTimestamp(timestamp: string | number | Date): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return dateKeyFormatter.format(date);
}
