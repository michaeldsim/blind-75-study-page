/**
 * Spaced repetition.
 *
 * Deliberately simple: one rating after each solve decides when the problem
 * comes back. Repeated successes stretch the interval, a struggle collapses
 * it. No half-life math to tune, and the next date is always explainable in
 * a sentence -- which matters, because an opaque schedule is one you stop
 * trusting and then stop using.
 */
import type { Rating } from "./types";

const BASE_DAYS: Record<Rating, number> = {
  struggled: 2,
  shaky: 5,
  solid: 14,
};

const GROWTH = 1.8; // applied per consecutive 'solid'
const MAX_DAYS = 180;

export function todayISO(now: Date = new Date()): string {
  // Local date, not UTC -- "due today" should mean the user's today.
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return todayISO(dt);
}

export function daysBetween(fromISO: string, toISO: string): number {
  const [fy, fm, fd] = fromISO.split("-").map(Number);
  const [ty, tm, td] = toISO.split("-").map(Number);
  const a = Date.UTC(fy, fm - 1, fd);
  const b = Date.UTC(ty, tm - 1, td);
  return Math.round((b - a) / 86_400_000);
}

export interface Schedule {
  dueOn: string;
  solidStreak: number;
  intervalDays: number;
}

/**
 * @param rating       how the attempt went
 * @param solidStreak  consecutive 'solid' ratings before this attempt
 */
export function nextSchedule(
  rating: Rating,
  solidStreak: number,
  from: string = todayISO(),
): Schedule {
  let streak: number;
  let interval: number;

  if (rating === "solid") {
    streak = solidStreak + 1;
    interval = Math.min(
      MAX_DAYS,
      Math.round(BASE_DAYS.solid * Math.pow(GROWTH, streak - 1)),
    );
  } else if (rating === "shaky") {
    // Hold position: you didn't lose the pattern, but you didn't own it.
    streak = solidStreak;
    interval = BASE_DAYS.shaky;
  } else {
    streak = 0;
    interval = BASE_DAYS.struggled;
  }

  return { dueOn: addDays(from, interval), solidStreak: streak, intervalDays: interval };
}

export function isDue(dueOn: string | null, today: string = todayISO()): boolean {
  return dueOn !== null && dueOn <= today;
}

/** "in 5 days" / "today" / "6 days overdue" */
export function describeDue(dueOn: string | null, today: string = todayISO()): string {
  if (!dueOn) return "not scheduled";
  const delta = daysBetween(today, dueOn);
  if (delta === 0) return "due today";
  if (delta === 1) return "due tomorrow";
  if (delta > 1) return `due in ${delta} days`;
  if (delta === -1) return "1 day overdue";
  return `${Math.abs(delta)} days overdue`;
}
