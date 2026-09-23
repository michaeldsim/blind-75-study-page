"use client";

import { useState } from "react";
import { resolveLegacyName } from "@/lib/catalog";
import type { SettingsRow, Theme } from "@/lib/types";
import { Close } from "./icons";

interface Props {
  settings: SettingsRow;
  onUpdate: (patch: Partial<SettingsRow>) => void;
  onImport: (ids: string[]) => Promise<number>;
  onExport: () => void;
  onReset: () => Promise<void>;
  onClose: () => void;
}

const THEMES: Theme[] = ["system", "light", "dark"];

/**
 * Pulls solved problems out of the pre-2.0 localStorage blob. That data lives
 * on the old github.io origin, so it can't be read directly from here -- the
 * user pastes it across.
 */
function parseLegacy(raw: string): { ids: string[]; unmatched: string[] } {
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Expected a JSON object of topics.");
  }

  const ids: string[] = [];
  const unmatched: string[] = [];

  for (const questions of Object.values(parsed as Record<string, unknown>)) {
    if (typeof questions !== "object" || questions === null) continue;
    for (const [name, selected] of Object.entries(questions as Record<string, unknown>)) {
      // In the old app, deselecting a question was how you marked it done.
      if (selected === false) {
        const id = resolveLegacyName(name);
        if (id) ids.push(id);
        else unmatched.push(name);
      }
    }
  }
  return { ids: [...new Set(ids)], unmatched };
}

export default function SettingsModal({
  settings, onUpdate, onImport, onExport, onReset, onClose,
}: Props) {
  const [raw, setRaw] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  async function runImport() {
    setError(null);
    setResult(null);
    try {
      const { ids, unmatched } = parseLegacy(raw.trim());
      if (ids.length === 0) {
        setError("No completed problems found in that data.");
        return;
      }
      const added = await onImport(ids);
      const skipped = ids.length - added;
      setResult(
        `Imported ${added} solved problem${added === 1 ? "" : "s"}` +
          (skipped > 0 ? `, ${skipped} already marked` : "") +
          (unmatched.length > 0
            ? `. ${unmatched.length} name${unmatched.length === 1 ? "" : "s"} no longer in either list: ${unmatched.join(", ")}`
            : "."),
      );
      setRaw("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't parse that.");
    }
  }

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="modal" role="dialog" aria-modal="true" aria-label="Settings">
        <div className="modal-head">
          <h2>Settings</h2>
          <div style={{ marginLeft: "auto" }}>
            <button className="icon-btn" onClick={onClose} aria-label="Close">
              <Close />
            </button>
          </div>
        </div>

        <div className="modal-body">
          <section className="drawer-section">
            <span className="section-label">Appearance</span>
            <div className="chip-group" style={{ width: "fit-content" }}>
              {THEMES.map((t) => (
                <button
                  key={t}
                  className="chip"
                  aria-pressed={settings.theme === t}
                  onClick={() => onUpdate({ theme: t })}
                  style={{ textTransform: "capitalize" }}
                >
                  {t}
                </button>
              ))}
            </div>
          </section>

          <section className="drawer-section">
            <span className="section-label">Session</span>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 4 }}>
              <label style={{ fontSize: 13 }}>
                <div style={{ color: "var(--text-muted)", marginBottom: 6 }}>
                  Timer budget (minutes)
                </div>
                <input
                  type="number"
                  min={5}
                  max={180}
                  value={settings.timer_minutes}
                  onChange={(e) =>
                    onUpdate({ timer_minutes: clamp(Number(e.target.value), 5, 180) })
                  }
                  style={inputStyle}
                />
              </label>
              <label style={{ fontSize: 13 }}>
                <div style={{ color: "var(--text-muted)", marginBottom: 6 }}>
                  Daily goal (problems)
                </div>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={settings.daily_goal}
                  onChange={(e) =>
                    onUpdate({ daily_goal: clamp(Number(e.target.value), 1, 50) })
                  }
                  style={inputStyle}
                />
              </label>
            </div>
          </section>

          <section className="drawer-section">
            <span className="section-label">Import from the old version</span>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "6px 0 10px" }}>
              Your old progress lives in localStorage on the github.io page, which
              this app can&apos;t read across origins. Open that page, run this in the
              browser console, then paste the result here:
            </p>
            <code
              style={{
                display: "block",
                padding: "9px 11px",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                fontSize: 12,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                overflowX: "auto",
                marginBottom: 10,
              }}
            >
              copy(localStorage.getItem(&apos;questionStates&apos;))
            </code>
            <textarea
              className="notes-area"
              value={raw}
              placeholder='{"Array & Hashing": {"Two Sum": false, …}}'
              onChange={(e) => setRaw(e.target.value)}
              style={{ minHeight: 84 }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 9, alignItems: "center" }}>
              <button className="btn" onClick={runImport} disabled={raw.trim() === ""}>
                Import solved problems
              </button>
              <span style={{ fontSize: 12, color: "var(--text-faint)" }}>
                Deselected problems are treated as solved.
              </span>
            </div>
            {result && (
              <p style={{ marginTop: 9, fontSize: 12.5, color: "var(--easy)" }}>{result}</p>
            )}
            {error && <p className="login-error" style={{ marginTop: 9 }}>{error}</p>}
          </section>

          <section className="drawer-section">
            <span className="section-label">Your data</span>
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              <button className="btn" onClick={onExport}>
                Export as JSON
              </button>
              {confirmReset ? (
                <>
                  <button
                    className="btn"
                    style={{ borderColor: "var(--hard)", color: "var(--hard)" }}
                    onClick={async () => {
                      await onReset();
                      setConfirmReset(false);
                      onClose();
                    }}
                  >
                    Delete everything — I&apos;m sure
                  </button>
                  <button className="btn btn-ghost" onClick={() => setConfirmReset(false)}>
                    Cancel
                  </button>
                </>
              ) : (
                <button className="btn btn-ghost" onClick={() => setConfirmReset(true)}>
                  Reset all progress
                </button>
              )}
            </div>
          </section>
        </div>

        <div className="modal-foot">
          <form action="/auth/signout" method="post">
            <button className="btn btn-ghost" type="submit">Sign out</button>
          </form>
          <button className="btn" onClick={onClose}>Done</button>
        </div>
      </div>
    </>
  );
}

const inputStyle: React.CSSProperties = {
  width: 96,
  height: 32,
  padding: "0 10px",
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  outline: "none",
};

function clamp(n: number, lo: number, hi: number) {
  return Number.isNaN(n) ? lo : Math.min(hi, Math.max(lo, n));
}
