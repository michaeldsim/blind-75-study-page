"use client";

import type { Problem } from "@/lib/catalog";
import type { ProgressRow } from "@/lib/types";
import { RATING_LABELS } from "@/lib/types";
import { describeDue, isDue, type TopicSchedule } from "@/lib/srs";
import { Check, ChevronRight, Lock, Star } from "./icons";

interface Props {
  topic: string;
  problems: Problem[];
  total: number;
  solved: number;
  open: boolean;
  /** null until hydration -- see useMounted. */
  today: string | null;
  /** null until the topic has a rated attempt. */
  schedule: TopicSchedule | null;
  rowFor: (id: string) => ProgressRow;
  onToggleOpen: () => void;
  onOpenProblem: (id: string) => void;
  onToggleSolved: (id: string, solved: boolean) => void;
  onToggleStar: (id: string) => void;
}

export default function TopicSection({
  topic, problems, total, solved, open, today, schedule, rowFor,
  onToggleOpen, onOpenProblem, onToggleSolved, onToggleStar,
}: Props) {
  const pct = total === 0 ? 0 : (solved / total) * 100;
  const due = today !== null && schedule !== null && isDue(schedule.dueOn, today);
  const overdue = due && today !== null && schedule!.dueOn < today;

  return (
    <section className="topic-section" id={`topic-${slug(topic)}`}>
      <button className="topic-header" onClick={onToggleOpen} aria-expanded={open}>
        <ChevronRight className={`chevron${open ? " open" : ""}`} />
        <div className="topic-title">
          <h2>{topic}</h2>
          {schedule && today && (
            <span className={`row-meta${overdue ? " overdue" : due ? " due" : ""}`}>
              review {describeDue(schedule.dueOn, today).replace("due ", "")}
            </span>
          )}
        </div>
        <div className="topic-progress">
          <div className="bar accent">
            <i style={{ width: `${pct}%` }} />
          </div>
          <span className="topic-count mono">{solved}/{total}</span>
        </div>
      </button>

      {open && (
        <div className="topic-body">
          <ul className="rows">
            {problems.map((p) => {
              const row = rowFor(p.id);
              const isSolved = row.status === "solved";

              return (
                <li
                  key={p.id}
                  className={`row${isSolved ? " is-solved" : ""}`}
                >
                  <button
                    className={`status-btn${isSolved ? " solved" : ""}`}
                    onClick={() => onToggleSolved(p.id, !isSolved)}
                    aria-label={isSolved ? `Mark ${p.name} unsolved` : `Mark ${p.name} solved`}
                    title={isSolved ? "Mark unsolved" : "Mark solved"}
                  >
                    <Check />
                  </button>

                  <button className="row-name" onClick={() => onOpenProblem(p.id)}>
                    <span className="row-name-text">{p.name}</span>
                    {p.premium && (
                      <span className="lock" title="Requires LeetCode Premium">
                        <Lock />
                      </span>
                    )}
                    {row.notes.trim() !== "" && (
                      <span className="row-note-dot" title="Has notes" />
                    )}
                  </button>

                  {/* Struggled problems are what topic reviews reach for first. */}
                  <span className={`row-meta${row.last_rating === "struggled" ? " overdue" : ""}`}>
                    {row.last_rating ? RATING_LABELS[row.last_rating].toLowerCase() : ""}
                  </span>

                  <span className={`difficulty ${p.difficulty.toLowerCase()}`}>
                    {p.difficulty}
                  </span>

                  <button
                    className={`star-btn${row.starred ? " on" : ""}`}
                    onClick={() => onToggleStar(p.id)}
                    aria-label={row.starred ? `Unflag ${p.name}` : `Flag ${p.name} for review`}
                    title={row.starred ? "Remove flag" : "Flag for review"}
                  >
                    <Star filled={row.starred} />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}

export function slug(topic: string) {
  return topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
