"use client";

import type { Problem } from "@/lib/catalog";
import type { PlanItem } from "@/lib/plan";
import type { ProgressRow, Rating } from "@/lib/types";
import { relativeTime } from "@/lib/stats";
import { RATING_LABELS } from "@/lib/types";
import { Check, External, Flame, Star } from "./icons";
import Timer from "./Timer";

export interface FocusItem {
  problem: Problem;
  reason: string;
}

interface Props {
  plan: PlanItem[];
  focus: FocusItem | null;
  dueTopicCount: number;
  streak: number;
  dailyGoal: number;
  timerMinutes: number;
  row: ProgressRow | null;
  /** Rating -> "topic back in N days", for the focused problem. */
  hints: Record<Rating, string> | null;
  /** Whether "one more" has anything left to offer. */
  canExtend: boolean;
  onSelect: (item: PlanItem) => void;
  onSkip: () => void;
  onMore: () => void;
  onOpen: (id: string) => void;
  onRate: (rating: Rating) => void;
  onElapsedChange: (seconds: number) => void;
}

export default function TodayPanel({
  plan, focus, dueTopicCount, streak, dailyGoal, timerMinutes, row, hints,
  canExtend, onSelect, onSkip, onMore, onOpen, onRate, onElapsedChange,
}: Props) {
  const doneCount = plan.filter((i) => i.done).length;

  return (
    <div className="today">
      <div className="today-head">
        <span className="section-label">Today</span>
        <div className="today-stats">
          {dueTopicCount > 0 && (
            <span className="pill hot">
              {dueTopicCount} topic{dueTopicCount === 1 ? "" : "s"} due
            </span>
          )}
          <span className="pill">
            <Flame /> {streak} day{streak === 1 ? "" : "s"}
          </span>
          <span className="pill mono">
            {doneCount}/{dailyGoal} today
          </span>
        </div>
      </div>

      {plan.length > 0 && (
        <ol className="plan">
          {plan.map((item) => {
            const active = !item.done && focus?.problem.id === item.problem.id;
            return (
              <li key={item.problem.id}>
                <button
                  className={`plan-item${item.done ? " done" : ""}${active ? " active" : ""}`}
                  onClick={() => (item.done ? onOpen(item.problem.id) : onSelect(item))}
                >
                  <span className={`plan-check${item.done ? " on" : ""}`}>
                    {item.done && <Check />}
                  </span>
                  <span className={`plan-kind ${item.kind}`}>
                    {item.kind === "new" ? "New" : "Review"}
                  </span>
                  <span className="plan-name">{item.problem.name}</span>
                  <span className="plan-topic">{item.problem.topic}</span>
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {focus ? (
        <div className="today-body">
          <div className="focus-problem">
            <span className="focus-reason">{focus.reason}</span>
            <span className="focus-name">{focus.problem.name}</span>
            <div className="focus-meta">
              <span className={`difficulty ${focus.problem.difficulty.toLowerCase()}`}>
                {focus.problem.difficulty}
              </span>
              <span>{focus.problem.topic}</span>
              {row?.last_rating && row.last_attempt_at && (
                <span>
                  last: {RATING_LABELS[row.last_rating].toLowerCase()},{" "}
                  {relativeTime(row.last_attempt_at)}
                </span>
              )}
              {row?.starred && <span title="Flagged"><Star size={12} filled /></span>}
            </div>
          </div>

          <div className="focus-actions">
            <a
              className="btn btn-primary btn-lg"
              href={focus.problem.url}
              target="_blank"
              rel="noreferrer noopener"
            >
              Solve on LeetCode <External />
            </a>
            <Timer
              key={focus.problem.id}
              minutes={timerMinutes}
              onElapsedChange={onElapsedChange}
            />
            <button className="btn" onClick={() => onOpen(focus.problem.id)}>
              Notes
            </button>
            <button className="btn btn-ghost" onClick={onSkip} title="Pick a different problem">
              Skip
            </button>
          </div>

          <div style={{ marginTop: 18 }}>
            <span className="section-label" style={{ display: "block", marginBottom: 9 }}>
              Done? Rate it — that sets when the topic comes back
            </span>
            <div className="rating-group">
              {(Object.keys(RATING_LABELS) as Rating[]).map((r) => (
                <button key={r} className={`rating-btn ${r}`} onClick={() => onRate(r)}>
                  <strong>{RATING_LABELS[r]}</strong>
                  {hints && <span>{hints[r]}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="today-empty">
          <strong style={{ color: "var(--text)", fontSize: 15 }}>
            {doneCount > 0 ? "Done for today" : "Nothing queued up"}
          </strong>
          <span>
            {canExtend
              ? "That's the plan finished. Stop here, or take one more."
              : "Every problem in this list is solved and no topics are due."}
          </span>
          {canExtend && (
            <button className="btn" onClick={onMore} style={{ marginTop: 8 }}>
              One more
            </button>
          )}
        </div>
      )}
    </div>
  );
}
