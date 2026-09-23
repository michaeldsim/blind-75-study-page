"use client";

import type { Problem } from "@/lib/catalog";
import type { ProgressRow, Rating } from "@/lib/types";
import { describeDue } from "@/lib/srs";
import { relativeTime } from "@/lib/stats";
import { RATING_LABELS } from "@/lib/types";
import { External, Flame, Star } from "./icons";
import Timer from "./Timer";

export interface FocusItem {
  problem: Problem;
  reason: string;
}

interface Props {
  focus: FocusItem | null;
  queueLength: number;
  dueCount: number;
  streak: number;
  solvedToday: number;
  dailyGoal: number;
  timerMinutes: number;
  row: ProgressRow | null;
  onSkip: () => void;
  onOpen: (id: string) => void;
  onRate: (rating: Rating) => void;
  onElapsedChange: (seconds: number) => void;
}

const RATING_HINT: Record<Rating, string> = {
  solid: "back in ~2 weeks",
  shaky: "back in 5 days",
  struggled: "back in 2 days",
};

export default function TodayPanel({
  focus, queueLength, dueCount, streak, solvedToday, dailyGoal,
  timerMinutes, row, onSkip, onOpen, onRate, onElapsedChange,
}: Props) {
  return (
    <div className="today">
      <div className="today-head">
        <span className="section-label">Today</span>
        <div className="today-stats">
          {dueCount > 0 && (
            <span className="pill hot">{dueCount} due for review</span>
          )}
          <span className="pill">
            <Flame /> {streak} day{streak === 1 ? "" : "s"}
          </span>
          <span className="pill mono">
            {solvedToday}/{dailyGoal} today
          </span>
        </div>
      </div>

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
              {row?.due_on && <span>{describeDue(row.due_on)}</span>}
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
            <button className="btn btn-ghost" onClick={onSkip} disabled={queueLength <= 1}>
              Skip
            </button>
          </div>

          <div style={{ marginTop: 18 }}>
            <span className="section-label" style={{ display: "block", marginBottom: 9 }}>
              Done? Rate it — that sets the next review
            </span>
            <div className="rating-group">
              {(Object.keys(RATING_LABELS) as Rating[]).map((r) => (
                <button key={r} className={`rating-btn ${r}`} onClick={() => onRate(r)}>
                  <strong>{RATING_LABELS[r]}</strong>
                  <span>{RATING_HINT[r]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="today-empty">
          <strong style={{ color: "var(--text)", fontSize: 15 }}>
            Nothing queued up
          </strong>
          <span>
            Every problem in this list is solved and none are due for review.
            Switch lists or clear a filter to keep going.
          </span>
        </div>
      )}
    </div>
  );
}
