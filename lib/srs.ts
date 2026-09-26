/**
 * Spaced repetition, scheduled per topic rather than per problem.
 *
 * A LeetCode problem costs ~30 minutes, so a per-problem queue outgrows any
 * realistic day. What interviews test is recognising the pattern, and any
 * problem in a topic exercises that -- so the topic is what gets scheduled,
 * and the planner picks which problem to use for the review.
 *
 * The schedule is replayed from the attempt log rather than stored, so it
 * can't drift and it applies retroactively to existing history.
 */
import type { AttemptRow, Rating } from "./types";

const BASE_DAYS: Record<Rating, number> = {
  struggled: 2,
  shaky: 4,
  solid: 7,
};

const GROWTH = 1.8; // applied per consecutive 'solid' day
const MAX_DAYS = 90;

const SEVERITY: Record<Rating, number> = { solid: 0, shaky: 1, struggled: 2 };

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

export interface TopicSchedule extends Schedule {
  topic: string;
  lastDay: string;
  lastRating: Rating;
}

/**
 * Replays the attempt log into one schedule per topic. Several solves in the
 * same topic on the same day count once, at the worst rating -- otherwise two
 * easy wins in an afternoon would compound the interval twice.
 */
export function topicSchedules(
  attempts: AttemptRow[],
  topicOf: (problemId: string) => string | undefined,
): Map<string, TopicSchedule> {
  // topic -> day -> worst rating that day
  const days = new Map<string, Map<string, Rating>>();
  for (const a of attempts) {
    const topic = topicOf(a.problem_id);
    if (!topic) continue;
    const day = todayISO(new Date(a.attempted_at));
    const byDay = days.get(topic) ?? new Map<string, Rating>();
    const prev = byDay.get(day);
    if (!prev || SEVERITY[a.rating] > SEVERITY[prev]) byDay.set(day, a.rating);
    days.set(topic, byDay);
  }

  const out = new Map<string, TopicSchedule>();
  for (const [topic, byDay] of days) {
    let streak = 0;
    let last: TopicSchedule | null = null;
    for (const day of [...byDay.keys()].sort()) {
      const rating = byDay.get(day)!;
      const s = nextSchedule(rating, streak, day);
      streak = s.solidStreak;
      last = { ...s, topic, lastDay: day, lastRating: rating };
    }
    if (last) out.set(topic, last);
  }
  return out;
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
