"use client";

import type { Difficulty } from "@/lib/catalog";
import type { TopicStat } from "@/lib/stats";

interface Props {
  solved: number;
  total: number;
  byDifficulty: Record<Difficulty, { solved: number; total: number }>;
  topics: TopicStat[];
  activeTopic: string | null;
  onJump: (topic: string) => void;
}

const DIFF_ORDER: Difficulty[] = ["Easy", "Medium", "Hard"];

export default function Sidebar({
  solved, total, byDifficulty, topics, activeTopic, onJump,
}: Props) {
  const pct = total === 0 ? 0 : Math.round((solved / total) * 100);

  return (
    <aside className="sidebar">
      <div className="card">
        <div className="progress-card">
          <div className="ring" style={{ ["--pct" as string]: pct }}>
            <span className="ring-label mono">{pct}%</span>
          </div>
          <div className="progress-meta">
            <div className="progress-count">
              {solved}<span style={{ color: "var(--text-faint)", fontWeight: 400 }}> / {total}</span>
            </div>
            <div className="progress-sub">problems solved</div>
          </div>
        </div>

        <div className="diff-bars">
          {DIFF_ORDER.map((d) => {
            const { solved: s, total: t } = byDifficulty[d];
            return (
              <div className="diff-row" key={d}>
                <span>{d}</span>
                <div className={`bar ${d.toLowerCase()}`}>
                  <i style={{ width: `${t === 0 ? 0 : (s / t) * 100}%` }} />
                </div>
                <span className="count">{s}/{t}</span>
              </div>
            );
          })}
        </div>
      </div>

      <nav className="topic-nav" aria-label="Topics">
        <div className="topic-nav-head">
          <span className="section-label">Topics</span>
        </div>
        <ul className="topic-nav-list">
          {topics.map((t) => {
            const done = t.solved === t.total;
            return (
              <li key={t.topic}>
                <button
                  className={`topic-link${done ? " is-complete" : ""}`}
                  aria-current={activeTopic === t.topic}
                  onClick={() => onJump(t.topic)}
                >
                  <span className="topic-link-name">{t.topic}</span>
                  <span className="topic-link-count mono">
                    <span
                      className={`topic-dot${done ? " done" : t.solved > 0 ? " partial" : ""}`}
                    />
                    {t.solved}/{t.total}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
