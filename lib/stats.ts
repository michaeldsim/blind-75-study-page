/**
 * Everything here is derived from the attempt log rather than stored, so the
 * numbers can't drift out of sync with the underlying history.
 */
import type { AttemptRow, ProgressRow, Rating } from "./types";
import type { Problem } from "./catalog";
import { todayISO, addDays, daysBetween } from "./srs";

export function localDay(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function attemptsByDay(attempts: AttemptRow[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const a of attempts) {
    const day = localDay(a.attempted_at);
    map.set(day, (map.get(day) ?? 0) + 1);
  }
  return map;
}

/**
 * Consecutive days with at least one attempt. Today not yet studied doesn't
 * break the streak -- it's still live until the day actually ends.
 */
export function currentStreak(byDay: Map<string, number>): number {
  const today = todayISO();
  let cursor = byDay.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (byDay.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function longestStreak(byDay: Map<string, number>): number {
  const days = [...byDay.keys()].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of days) {
    run = prev && daysBetween(prev, day) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = day;
  }
  return best;
}

export interface HeatCell {
  day: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

/** Columns of 7 days, oldest first, ending on today. */
export function heatmap(byDay: Map<string, number>, weeks = 18): HeatCell[] {
  const today = todayISO();
  // Pad back to the start of the week so rows line up by weekday.
  const todayDow = new Date(today + "T00:00:00").getDay();
  const start = addDays(today, -(weeks * 7 - 1 + todayDow));
  const cells: HeatCell[] = [];
  const total = weeks * 7 + todayDow;

  for (let i = 0; i < total; i += 1) {
    const day = addDays(start, i);
    if (day > today) break;
    const count = byDay.get(day) ?? 0;
    const level = count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count <= 4 ? 3 : 4;
    cells.push({ day, count, level: level as HeatCell["level"] });
  }
  return cells;
}

export interface TopicStat {
  topic: string;
  total: number;
  solved: number;
  pct: number;
  struggles: number;
}

export function topicStats(
  problems: Problem[],
  progress: Map<string, ProgressRow>,
  attempts: AttemptRow[],
): TopicStat[] {
  const strugglesByProblem = new Map<string, number>();
  for (const a of attempts) {
    if (a.rating === "struggled") {
      strugglesByProblem.set(a.problem_id, (strugglesByProblem.get(a.problem_id) ?? 0) + 1);
    }
  }

  const acc = new Map<string, TopicStat>();
  for (const p of problems) {
    const stat =
      acc.get(p.topic) ??
      { topic: p.topic, total: 0, solved: 0, pct: 0, struggles: 0 };
    stat.total += 1;
    if (progress.get(p.id)?.status === "solved") stat.solved += 1;
    stat.struggles += strugglesByProblem.get(p.id) ?? 0;
    acc.set(p.topic, stat);
  }

  return [...acc.values()].map((s) => ({
    ...s,
    pct: s.total === 0 ? 0 : Math.round((s.solved / s.total) * 100),
  }));
}

/**
 * Topics worth attention: least-complete first, with repeated struggles
 * pulling a topic up even when its completion looks respectable.
 */
export function weakestTopics(stats: TopicStat[], limit = 3): TopicStat[] {
  return [...stats]
    .filter((s) => s.solved < s.total)
    .sort((a, b) => a.pct - b.pct || b.struggles - a.struggles)
    .slice(0, limit);
}

export function ratingCounts(attempts: AttemptRow[]): Record<Rating, number> {
  const counts: Record<Rating, number> = { solid: 0, shaky: 0, struggled: 0 };
  for (const a of attempts) counts[a.rating] += 1;
  return counts;
}

export function totalMinutes(attempts: AttemptRow[]): number {
  return Math.round(
    attempts.reduce((sum, a) => sum + (a.duration_seconds ?? 0), 0) / 60,
  );
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}
