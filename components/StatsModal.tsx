"use client";

import type { AttemptRow } from "@/lib/types";
import type { TopicStat } from "@/lib/stats";
import {
  currentStreak, heatmap, longestStreak, ratingCounts, totalMinutes, weakestTopics,
} from "@/lib/stats";
import { Close } from "./icons";

interface Props {
  attempts: AttemptRow[];
  byDay: Map<string, number>;
  topics: TopicStat[];
  solved: number;
  total: number;
  onClose: () => void;
}

export default function StatsModal({
  attempts, byDay, topics, solved, total, onClose,
}: Props) {
  const cells = heatmap(byDay);
  const ratings = ratingCounts(attempts);
  const weak = weakestTopics(topics);
  const minutes = totalMinutes(attempts);
  const hours = Math.floor(minutes / 60);

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="modal" role="dialog" aria-modal="true" aria-label="Statistics">
        <div className="modal-head">
          <h2>Statistics</h2>
          <div style={{ marginLeft: "auto" }}>
            <button className="icon-btn" onClick={onClose} aria-label="Close">
              <Close />
            </button>
          </div>
        </div>

        <div className="modal-body">
          <div className="stat-grid">
            <Tile value={`${solved}/${total}`} label="solved in this list" />
            <Tile value={currentStreak(byDay)} label="day streak" />
            <Tile value={longestStreak(byDay)} label="longest streak" />
            <Tile value={attempts.length} label="attempts logged" />
            <Tile
              value={hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`}
              label="time tracked"
            />
          </div>

          <section>
            <span className="section-label" style={{ display: "block", marginBottom: 10 }}>
              Activity
            </span>
            <div className="heatmap">
              {cells.map((c) => (
                <div
                  key={c.day}
                  className={`heat-cell${c.level > 0 ? ` l${c.level}` : ""}`}
                  title={`${c.day}: ${c.count} attempt${c.count === 1 ? "" : "s"}`}
                />
              ))}
            </div>
            <div className="heat-legend">
              <span>Less</span>
              <span className="heat-cell" />
              <span className="heat-cell l1" />
              <span className="heat-cell l2" />
              <span className="heat-cell l3" />
              <span className="heat-cell l4" />
              <span>More</span>
            </div>
          </section>

          <section>
            <span className="section-label" style={{ display: "block", marginBottom: 10 }}>
              How attempts felt
            </span>
            <div className="diff-bars" style={{ padding: 0 }}>
              {(["solid", "shaky", "struggled"] as const).map((r) => {
                const n = ratings[r];
                const pct = attempts.length === 0 ? 0 : (n / attempts.length) * 100;
                const cls = r === "solid" ? "easy" : r === "shaky" ? "medium" : "hard";
                return (
                  <div className="diff-row" key={r}>
                    <span style={{ textTransform: "capitalize" }}>{r}</span>
                    <div className={`bar ${cls}`}>
                      <i style={{ width: `${pct}%` }} />
                    </div>
                    <span className="count">{n}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {weak.length > 0 && (
            <section>
              <span className="section-label" style={{ display: "block", marginBottom: 4 }}>
                Focus areas
              </span>
              <p style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 10 }}>
                Least complete first, with repeated struggles weighted in.
              </p>
              <div className="topic-stat-list">
                {weak.map((t) => (
                  <div className="topic-stat" key={t.topic}>
                    <span className="topic-stat-name">{t.topic}</span>
                    <div className="bar accent">
                      <i style={{ width: `${t.pct}%` }} />
                    </div>
                    <span className="count">{t.solved}/{t.total}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <span className="section-label" style={{ display: "block", marginBottom: 10 }}>
              All topics
            </span>
            <div className="topic-stat-list">
              {topics.map((t) => (
                <div className="topic-stat" key={t.topic}>
                  <span className="topic-stat-name">{t.topic}</span>
                  <div className="bar accent">
                    <i style={{ width: `${t.pct}%` }} />
                  </div>
                  <span className="count">{t.solved}/{t.total}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function Tile({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="stat-tile">
      <div className="stat-value mono">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
