// Business-day date math. All phase durations are counted in working days
// (Mon–Fri); weekends are skipped so the timeline reflects real availability.
import {
  addDays,
  differenceInCalendarDays,
  format,
  isWeekend,
  max as maxDate,
  parseISO,
} from 'date-fns';

export { addDays } from 'date-fns';

export const ISO = 'yyyy-MM-dd';

export function toISO(d: Date): string {
  return format(d, ISO);
}

export function fromISO(s: string): Date {
  return parseISO(s);
}

/** "Today" anchored to local midnight so comparisons are stable within a session. */
export function today(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function todayISO(): string {
  return toISO(today());
}

/** Add N business days to a date (N=0 returns the same day). */
export function addBusinessDays(start: Date, businessDays: number): Date {
  let remaining = businessDays;
  let cursor = start;
  while (remaining > 0) {
    cursor = addDays(cursor, 1);
    if (!isWeekend(cursor)) remaining -= 1;
  }
  return cursor;
}

/** Shift a date by a signed number of business days (handles negatives). */
export function shiftBusinessDays(start: Date, businessDays: number): Date {
  if (businessDays === 0) return start;
  const sign = businessDays > 0 ? 1 : -1;
  let remaining = Math.abs(businessDays);
  let cursor = start;
  while (remaining > 0) {
    cursor = addDays(cursor, sign);
    if (!isWeekend(cursor)) remaining -= 1;
  }
  return cursor;
}

/** Count business days from a → b (can be negative). */
export function businessDaysBetween(a: Date, b: Date): number {
  const sign = b >= a ? 1 : -1;
  let count = 0;
  let cursor = a;
  while (sign > 0 ? cursor < b : cursor > b) {
    cursor = addDays(cursor, sign);
    if (!isWeekend(cursor)) count += sign;
  }
  return count;
}

/** Inclusive end date of a phase: start + (duration-1) business days. */
export function phaseEnd(startISO: string, durationDays: number): Date {
  const start = fromISO(startISO);
  return addBusinessDays(start, Math.max(0, durationDays - 1));
}

/** Do two inclusive date ranges overlap at all? */
export function rangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

export function laterOf(dates: Date[]): Date {
  return maxDate(dates);
}

export function calendarDaysBetween(a: Date, b: Date): number {
  return differenceInCalendarDays(b, a);
}

export function fmtShort(d: Date): string {
  return format(d, 'MMM d');
}

export function fmtShortISO(s: string): string {
  return fmtShort(fromISO(s));
}
