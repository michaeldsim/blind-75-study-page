"use client";

import type { Problem } from "@/lib/catalog";
import type { ProgressRow } from "@/lib/types";
import { describeDue, isDue } from "@/lib/srs";
import { Check, ChevronRight, Lock, Star } from "./icons";

interface Props {
  topic: string;
  problems: Problem[];
  total: number;
  solved: number;
  open: boolean;
  /** null until hydration -- see useMounted. */
  today: string | null;
  rowFor: (id: string) => ProgressRow;
  onToggleOpen: () => void;
  onOpenProblem: (id: string) => void;
  onToggleSolved: (id: string, solved: boolean) => void;
  onToggleStar: (id: string) => void;
}

export default function TopicSection({
  topic, problems, total, solved, open, today, rowFor,
  onToggleOpen, onOpenProblem, onToggleSolved, onToggleStar,
}: Props) {
  const pct = total === 0 ? 0 : (solved / total) * 100;

  return (
    <section className="topic-section" id={`topic-${slug(topic)}`}>
      <button className="topic-header" onClick={onToggleOpen} aria-expanded={open}>
        <ChevronRight className={`chevron${open ? " open" : ""}`} />
        <div className="topic-title">
          <h2>{topic}</h2>
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
              const due = today !== null && isDue(row.due_on, today);
              const overdue = due && row.due_on !== null && today !== null && row.due_on < today;

              return (
                <li
                  key={p.id}
                  className={`row${isSolved ? " is-solved" : ""}${due ? " is-due" : ""}`}
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

                  <span className={`row-meta${overdue ? " overdue" : due ? " due" : ""}`}>
                    {row.due_on && today ? describeDue(row.due_on, today) : ""}
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
