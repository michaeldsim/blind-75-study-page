"use client";

import { useEffect, useRef, useState } from "react";
import type { Problem } from "@/lib/catalog";
import type { AttemptRow, ProgressRow, Rating } from "@/lib/types";
import { RATING_LABELS } from "@/lib/types";
import { describeDue } from "@/lib/srs";
import { formatDuration, relativeTime } from "@/lib/stats";
import { Check, Close, External, Lock, Star } from "./icons";

interface Props {
  problem: Problem;
  row: ProgressRow;
  attempts: AttemptRow[];
  onClose: () => void;
  onToggleSolved: (solved: boolean) => void;
  onToggleStar: () => void;
  onNotesChange: (notes: string) => void;
  onNotesFlush: () => Promise<void>;
  onRate: (rating: Rating) => void;
}

const RATING_HINT: Record<Rating, string> = {
  solid: "~2 weeks",
  shaky: "5 days",
  struggled: "2 days",
};

export default function ProblemDrawer({
  problem, row, attempts, onClose, onToggleSolved, onToggleStar,
  onNotesChange, onNotesFlush, onRate,
}: Props) {
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const timer = useRef<number | null>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panel.current?.focus();
  }, [problem.id]);

  // Flush any pending note edit when switching problems or closing.
  useEffect(() => {
    return () => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
        void onNotesFlush();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem.id]);

  function handleNotes(value: string) {
    onNotesChange(value);
    setSaveState("saving");
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      timer.current = null;
      await onNotesFlush();
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 1800);
    }, 700);
  }

  const isSolved = row.status === "solved";

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label={problem.name}
        ref={panel}
        tabIndex={-1}
      >
        <div className="drawer-head">
          <div className="drawer-title">
            <h2>{problem.name}</h2>
            <div className="drawer-sub">
              <span className={`difficulty ${problem.difficulty.toLowerCase()}`}>
                {problem.difficulty}
              </span>
              <span>{problem.topic}</span>
              {problem.blind75 && <span className="pill">Blind 75</span>}
              {problem.premium && (
                <span className="pill" title="Requires LeetCode Premium">
                  <Lock /> Premium
                </span>
              )}
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <Close />
          </button>
        </div>

        <div className="drawer-body">
          <div className="link-row">
            <a className="btn btn-primary" href={problem.url} target="_blank" rel="noreferrer noopener">
              Open on LeetCode <External />
            </a>
            <a className="btn" href={problem.videoUrl} target="_blank" rel="noreferrer noopener">
              Walkthrough <External />
            </a>
          </div>

          <div className="link-row">
            <button className="btn" onClick={() => onToggleSolved(!isSolved)}>
              <Check /> {isSolved ? "Mark unsolved" : "Mark solved"}
            </button>
            <button className="btn" onClick={onToggleStar}>
              <Star filled={row.starred} /> {row.starred ? "Remove flag" : "Flag for review"}
            </button>
          </div>

          <div className="drawer-section">
            <span className="section-label">How did it go?</span>
            <div className="rating-group">
              {(Object.keys(RATING_LABELS) as Rating[]).map((r) => (
                <button key={r} className={`rating-btn ${r}`} onClick={() => onRate(r)}>
                  <strong>{RATING_LABELS[r]}</strong>
                  <span>{RATING_HINT[r]}</span>
                </button>
              ))}
            </div>
            {row.due_on && (
              <p style={{ marginTop: 9, fontSize: 12, color: "var(--text-muted)" }}>
                Currently {describeDue(row.due_on)}
                {row.solid_streak > 0 && ` · ${row.solid_streak} solid in a row`}
              </p>
            )}
          </div>

          <div className="drawer-section">
            <span className="section-label">Notes</span>
            <textarea
              className="notes-area"
              value={row.notes}
              placeholder="The pattern, the trick you missed, the edge case that broke you…"
              onChange={(e) => handleNotes(e.target.value)}
              onBlur={() => {
                if (timer.current !== null) {
                  window.clearTimeout(timer.current);
                  timer.current = null;
                  void onNotesFlush();
                  setSaveState("saved");
                  window.setTimeout(() => setSaveState("idle"), 1800);
                }
              }}
            />
            <div className="notes-status">
              {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : ""}
            </div>
          </div>

          <div className="drawer-section">
            <span className="section-label">History</span>
            {attempts.length === 0 ? (
              <p className="empty-note">No attempts logged yet.</p>
            ) : (
              <ul className="history">
                {attempts.map((a) => (
                  <li key={a.id}>
                    <span className={`rating-dot ${a.rating}`} />
                    <span>{RATING_LABELS[a.rating]}</span>
                    <span className="history-time">
                      {a.duration_seconds ? `${formatDuration(a.duration_seconds)} · ` : ""}
                      {relativeTime(a.attempted_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
