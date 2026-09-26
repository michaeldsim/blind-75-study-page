/**
 * Today's plan: a short, finishable list rather than an ever-growing queue.
 *
 * One new problem first, then reviews of whichever topics are due, capped at
 * the daily goal. Due topics beyond the cap simply wait -- nothing piles up as
 * "overdue". Anything past the goal is opt-in via `extra`.
 */
import { PROBLEM_BY_ID, type Problem } from "./catalog";
import { describeDue, isDue, type TopicSchedule } from "./srs";
import { localDay, weakestTopics, type TopicStat } from "./stats";
import type { AttemptRow, ProgressRow, Rating } from "./types";

export type PlanKind = "new" | "review";

export interface PlanItem {
  kind: PlanKind;
  problem: Problem;
  reason: string;
  done: boolean;
}

export interface PlanInput {
  /** The active list. */
  problems: Problem[];
  progress: Map<string, ProgressRow>;
  attempts: AttemptRow[];
  schedules: Map<string, TopicSchedule>;
  topicStats: TopicStat[];
  today: string;
  goal: number;
  /** Slots added past the goal with "one more". */
  extra: number;
  /** Problems passed over this session; the slot picks another. */
  skipped: Set<string>;
}

export interface Plan {
  items: PlanItem[];
  /** Due topics in the active list, most overdue first. */
  dueTopics: TopicSchedule[];
}

const SEVERITY: Record<Rating, number> = { solid: 0, shaky: 1, struggled: 2 };

export function buildPlan(input: PlanInput): Plan {
  const { problems, progress, attempts, schedules, today, goal, extra, skipped } = input;

  // ------------------------------------------------ already done today
  const firstDay = new Map<string, string>();
  for (const a of attempts) {
    const day = localDay(a.attempted_at);
    const prev = firstDay.get(a.problem_id);
    if (!prev || day < prev) firstDay.set(a.problem_id, day);
  }

  const done: PlanItem[] = [];
  const seen = new Set<string>();
  const todays = attempts
    .filter((a) => localDay(a.attempted_at) === today)
    .sort((a, b) => a.attempted_at.localeCompare(b.attempted_at));
  for (const a of todays) {
    const problem = PROBLEM_BY_ID[a.problem_id];
    if (!problem || seen.has(a.problem_id)) continue;
    seen.add(a.problem_id);
    // Solved before today without a rating (e.g. imported) still isn't new.
    const solvedAt = progress.get(a.problem_id)?.solved_at;
    const isNew = firstDay.get(a.problem_id) === today &&
      !(solvedAt && localDay(solvedAt) < today);
    done.push({
      kind: isNew ? "new" : "review",
      problem,
      reason: isNew ? "New" : `Review · ${problem.topic}`,
      done: true,
    });
  }

  // ------------------------------------------------------- candidates
  const available = (p: Problem) => !seen.has(p.id) && !skipped.has(p.id);

  const dueTopics = [...schedules.values()]
    .filter((s) => isDue(s.dueOn, today) && problems.some((p) => p.topic === s.topic))
    .sort((a, b) =>
      a.dueOn.localeCompare(b.dueOn) || SEVERITY[b.lastRating] - SEVERITY[a.lastRating],
    );

  const weak = new Set(weakestTopics(input.topicStats, 3).map((t) => t.topic));
  const newQueue: PlanItem[] = [];
  const flagged: PlanItem[] = [];
  const weakest: PlanItem[] = [];
  for (const p of problems) {
    if (progress.get(p.id)?.status === "solved" || !available(p)) continue;
    if (progress.get(p.id)?.starred) {
      flagged.push({ kind: "new", problem: p, reason: "New · flagged", done: false });
    } else if (weak.has(p.topic)) {
      weakest.push({ kind: "new", problem: p, reason: "New · weakest topic", done: false });
    } else {
      newQueue.push({ kind: "new", problem: p, reason: "New", done: false });
    }
  }
  const newCandidates = [...flagged, ...weakest, ...newQueue];

  // -------------------------------------------------------- fill slots
  const left = Math.max(0, goal + extra - done.length);
  const pending: PlanItem[] = [];
  const taken = new Set<string>();
  const takenTopics = new Set<string>();
  const push = (item: PlanItem) => {
    pending.push(item);
    taken.add(item.problem.id);
    takenTopics.add(item.problem.topic);
  };

  const hasNewDone = done.some((d) => d.kind === "new");
  if (!hasNewDone && left > 0 && newCandidates[0]) push(newCandidates[0]);

  for (const s of dueTopics) {
    if (pending.length >= left) break;
    // A new problem in a due topic already exercises it.
    if (takenTopics.has(s.topic)) continue;
    const pick = pickReview(s.topic, problems, progress, (p) => available(p) && !taken.has(p.id));
    if (pick) {
      push({
        kind: "review",
        problem: pick,
        reason: `Review · ${s.topic} · ${describeDue(s.dueOn, today).replace("due ", "")}`,
        done: false,
      });
    }
  }

  // Past the goal the user asked for more: keep going through new problems.
  if (extra > 0) {
    for (const c of newCandidates) {
      if (pending.length >= left) break;
      if (!taken.has(c.problem.id)) push(c);
    }
  }

  return { items: [...done, ...pending], dueTopics };
}

/**
 * Which problem to use for a topic review: one you struggled with, then one
 * you flagged, then something unsolved (fresh practice of the same pattern),
 * then whatever you've gone longest without seeing.
 */
function pickReview(
  topic: string,
  problems: Problem[],
  progress: Map<string, ProgressRow>,
  ok: (p: Problem) => boolean,
): Problem | null {
  const rank = (p: Problem) => {
    const r = progress.get(p.id);
    if (r?.last_rating === "struggled") return 0;
    if (r?.starred) return 1;
    if (r?.status !== "solved") return 2;
    return 3;
  };
  const lastSeen = (p: Problem) => progress.get(p.id)?.last_attempt_at ?? "";

  const candidates = problems.filter((p) => p.topic === topic && ok(p));
  candidates.sort((a, b) => rank(a) - rank(b) || lastSeen(a).localeCompare(lastSeen(b)));
  return candidates[0] ?? null;
}
