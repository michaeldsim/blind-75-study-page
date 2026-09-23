/**
 * A static render of the real thing, using the app's own classes so it can't
 * drift into being a flattering lie about what you get.
 */
import { Flame, Lock, Star } from "./icons";

const ROWS: Array<{
  name: string;
  difficulty: "Easy" | "Medium" | "Hard";
  solved?: boolean;
  due?: string;
  premium?: boolean;
  starred?: boolean;
}> = [
  { name: "Number of Islands", difficulty: "Medium", solved: true },
  { name: "Clone Graph", difficulty: "Medium", due: "due today" },
  { name: "Pacific Atlantic Water Flow", difficulty: "Medium", starred: true },
  { name: "Course Schedule", difficulty: "Medium", solved: true },
  { name: "Graph Valid Tree", difficulty: "Medium", premium: true },
  { name: "Word Ladder", difficulty: "Hard" },
];

export default function AuthPreview() {
  return (
    <aside className="auth-preview" aria-hidden="true">
      <div className="auth-preview-frame">
        <div className="today">
          <div className="today-head">
            <span className="section-label">Today</span>
            <div className="today-stats">
              <span className="pill hot">4 due for review</span>
              <span className="pill">
                <Flame /> 12 days
              </span>
            </div>
          </div>
          <div className="today-body">
            <div className="focus-problem">
              <span className="focus-reason">Due for review</span>
              <span className="focus-name">Course Schedule</span>
              <div className="focus-meta">
                <span className="difficulty medium">Medium</span>
                <span>Graphs</span>
                <span>last: struggled, 6 days ago</span>
              </div>
            </div>
            <div className="focus-actions">
              <span className="btn btn-primary btn-lg">Solve on LeetCode</span>
              <span className="timer">
                <span className="timer-display mono">35:00</span>
              </span>
            </div>
          </div>
        </div>

        <div className="topic-section" style={{ marginTop: 14 }}>
          <div className="topic-header">
            <span />
            <div className="topic-title">
              <h2>Graphs</h2>
            </div>
            <div className="topic-progress">
              <div className="bar accent">
                <i style={{ width: "33%" }} />
              </div>
              <span className="topic-count mono">2/6</span>
            </div>
          </div>
          <div className="topic-body">
            <ul className="rows">
              {ROWS.map((r) => (
                <li
                  key={r.name}
                  className={`row${r.solved ? " is-solved" : ""}${r.due ? " is-due" : ""}`}
                >
                  <span className={`status-btn${r.solved ? " solved" : ""}`} />
                  <span className="row-name">
                    <span className="row-name-text">{r.name}</span>
                    {r.premium && (
                      <span className="lock">
                        <Lock />
                      </span>
                    )}
                  </span>
                  <span className={`row-meta${r.due ? " due" : ""}`}>{r.due ?? ""}</span>
                  <span className={`difficulty ${r.difficulty.toLowerCase()}`}>
                    {r.difficulty}
                  </span>
                  <span className={`star-btn${r.starred ? " on" : ""}`}>
                    {r.starred ? <Star filled /> : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </aside>
  );
}
