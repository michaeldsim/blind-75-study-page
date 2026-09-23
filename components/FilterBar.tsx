"use client";

import type { Difficulty } from "@/lib/catalog";
import { Collapse, Expand, Shuffle } from "./icons";

export type StatusFilter = "all" | "todo" | "solved" | "starred" | "due";

interface Props {
  status: StatusFilter;
  onStatusChange: (s: StatusFilter) => void;
  difficulties: Set<Difficulty>;
  onToggleDifficulty: (d: Difficulty) => void;
  statusCounts: Record<StatusFilter, number>;
  visibleCount: number;
  allCollapsed: boolean;
  onToggleCollapseAll: () => void;
  onRandom: () => void;
}

const STATUS: Array<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "todo", label: "Unsolved" },
  { id: "solved", label: "Solved" },
  { id: "starred", label: "Flagged" },
  { id: "due", label: "Due" },
];

const DIFFS: Difficulty[] = ["Easy", "Medium", "Hard"];

export default function FilterBar({
  status, onStatusChange, difficulties, onToggleDifficulty, statusCounts,
  visibleCount, allCollapsed, onToggleCollapseAll, onRandom,
}: Props) {
  return (
    <div className="filters">
      <div className="chip-group" role="group" aria-label="Filter by status">
        {STATUS.map((s) => (
          <button
            key={s.id}
            className="chip"
            aria-pressed={status === s.id}
            onClick={() => onStatusChange(s.id)}
          >
            {s.label}
            <span className="chip-count mono">{statusCounts[s.id]}</span>
          </button>
        ))}
      </div>

      <span className="chip-sep" />

      <div className="chip-group" role="group" aria-label="Filter by difficulty">
        {DIFFS.map((d) => (
          <button
            key={d}
            className="chip"
            aria-pressed={difficulties.has(d)}
            onClick={() => onToggleDifficulty(d)}
          >
            <span className={`difficulty ${d.toLowerCase()}`} style={{ minWidth: 0, gap: 0 }} />
            {d}
          </button>
        ))}
      </div>

      <div className="filter-summary">
        <span>{visibleCount} shown</span>
        <button className="btn btn-ghost" onClick={onToggleCollapseAll}>
          {allCollapsed ? <Expand /> : <Collapse />}
          {allCollapsed ? "Expand all" : "Collapse all"}
        </button>
        <button className="btn" onClick={onRandom} title="Random from filtered (R)">
          <Shuffle /> Random
        </button>
      </div>
    </div>
  );
}
