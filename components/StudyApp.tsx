"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  CloudStore, LocalStore, mergeLocalIntoCloud, type Snapshot,
} from "@/lib/store";
import {
  PROBLEM_BY_ID, TOPICS, problemsInList,
  type Difficulty, type ListId, type Problem,
} from "@/lib/catalog";
import { topicSchedules } from "@/lib/srs";
import { buildPlan, type PlanItem } from "@/lib/plan";
import { attemptsByDay, currentStreak, topicStats } from "@/lib/stats";
import type { AttemptRow, Rating } from "@/lib/types";
import { RATING_LABELS } from "@/lib/types";
import { useStudy } from "@/hooks/useStudy";
import { useMounted } from "@/hooks/useMounted";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import FilterBar, { type StatusFilter } from "./FilterBar";
import TodayPanel, { type FocusItem } from "./TodayPanel";
import TopicSection, { slug } from "./TopicSection";
import { Close } from "./icons";
import ProblemDrawer from "./ProblemDrawer";
import StatsModal from "./StatsModal";
import SettingsModal from "./SettingsModal";

interface Props {
  /** null when signed out -- the app still runs, backed by localStorage. */
  userId: string | null;
  initial: Snapshot;
}

const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];

const topicOf = (problemId: string) => PROBLEM_BY_ID[problemId]?.topic;

export default function StudyApp({ userId, initial }: Props) {
  const store = useMemo(
    () => (userId ? new CloudStore(createClient(), userId) : new LocalStore()),
    [userId],
  );
  const study = useStudy(store, initial);
  const { progress, attempts, settings, today, rowFor } = study;

  // Until hydration completes, nothing counts as due: the server's UTC "today"
  // and the browser's local one can disagree, and every due-derived value
  // (today's plan, the due count, the topic labels) would mismatch.
  const mounted = useMounted();
  const dueDay = mounted ? today : null;
  const [dismissedGuestNote, setDismissedGuestNote] = useState(false);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [difficulties, setDifficulties] = useState<Set<Difficulty>>(new Set());
  const [openProblemId, setOpenProblemId] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [extra, setExtra] = useState(0);
  const [override, setOverride] = useState<FocusItem | null>(null);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  const list = settings.active_list;
  const listProblems = useMemo(() => problemsInList(list), [list]);

  // Topics that are already fully solved start folded away -- the page should
  // open on what's left to do, not on a wall of completed work.
  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    const done = new Set<string>();
    const byTopic = new Map<string, Problem[]>();
    for (const p of problemsInList(initial.settings.active_list)) {
      byTopic.set(p.topic, [...(byTopic.get(p.topic) ?? []), p]);
    }
    const solvedIds = new Set(
      initial.progress.filter((r) => r.status === "solved").map((r) => r.problem_id),
    );
    for (const [topic, ps] of byTopic) {
      if (ps.length > 0 && ps.every((p) => solvedIds.has(p.id))) done.add(topic);
    }
    return done;
  });

  /* ------------------------------------------------- hydrate / merge --- */
  const { replaceAll, pushToast } = study;
  const mergeDone = useRef(false);

  // localStorage can't be read during SSR, so guest state arrives one frame late.
  useEffect(() => {
    if (userId) return;
    let cancelled = false;
    void (async () => {
      const snapshot = await store.load();
      if (!cancelled && snapshot) replaceAll(snapshot);
    })();
    return () => { cancelled = true; };
  }, [userId, store, replaceAll]);

  // First sign-in after using the app as a guest: fold that work into the
  // account rather than silently stranding it on this device.
  useEffect(() => {
    if (!userId || mergeDone.current) return;
    mergeDone.current = true;

    void (async () => {
      const local = new LocalStore();
      const localSnapshot = await local.load();
      if (!localSnapshot) return;
      if (localSnapshot.progress.length === 0 && localSnapshot.attempts.length === 0) {
        await local.clearAll();
        return;
      }

      try {
        const cloudSnapshot = await store.load();
        if (!cloudSnapshot) return;
        const { progress: rows, attempts: newAttempts } = mergeLocalIntoCloud(
          localSnapshot, cloudSnapshot, userId,
        );

        if (rows.length > 0) await store.putProgress(rows);
        for (const attempt of newAttempts) await store.addAttempt(attempt);

        await local.clearAll();
        const fresh = await store.load();
        if (fresh) replaceAll(fresh);

        const moved = rows.length + newAttempts.length;
        if (moved > 0) {
          pushToast(
            { message: `Synced ${rows.length} problem${rows.length === 1 ? "" : "s"} and ${newAttempts.length} attempt${newAttempts.length === 1 ? "" : "s"} from this device.` },
            6000,
          );
        }
      } catch {
        // Leave local data intact so the merge can be retried on next load.
        mergeDone.current = false;
      }
    })();
  }, [userId, store, replaceAll, pushToast]);

  /* ------------------------------------------------------------ theming */
  useEffect(() => {
    const el = document.documentElement;
    if (settings.theme === "system") el.removeAttribute("data-theme");
    else el.setAttribute("data-theme", settings.theme);
    document.cookie = `theme=${settings.theme}; path=/; max-age=31536000; samesite=lax`;
  }, [settings.theme]);

  /* ------------------------------------------------------------ derived */
  const counts = useMemo(() => {
    const tally = (ps: Problem[]) => ({
      solved: ps.filter((p) => progress.get(p.id)?.status === "solved").length,
      total: ps.length,
    });
    return {
      blind75: tally(problemsInList("blind75")),
      neetcode150: tally(problemsInList("neetcode150")),
    } as Record<ListId, { solved: number; total: number }>;
  }, [progress]);

  const byDifficulty = useMemo(() => {
    const acc = Object.fromEntries(
      DIFFICULTIES.map((d) => [d, { solved: 0, total: 0 }]),
    ) as Record<Difficulty, { solved: number; total: number }>;
    for (const p of listProblems) {
      acc[p.difficulty].total += 1;
      if (progress.get(p.id)?.status === "solved") acc[p.difficulty].solved += 1;
    }
    return acc;
  }, [listProblems, progress]);

  const allTopicStats = useMemo(
    () => topicStats(listProblems, progress, attempts),
    [listProblems, progress, attempts],
  );

  const statusCounts = useMemo(() => {
    let todo = 0, solved = 0, starred = 0;
    for (const p of listProblems) {
      const r = progress.get(p.id);
      if (r?.status === "solved") solved += 1;
      else todo += 1;
      if (r?.starred) starred += 1;
    }
    return { all: listProblems.length, todo, solved, starred } as Record<StatusFilter, number>;
  }, [listProblems, progress]);

  const matches = useCallback(
    (p: Problem) => {
      if (difficulties.size > 0 && !difficulties.has(p.difficulty)) return false;
      if (query.trim() !== "") {
        const q = query.trim().toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.topic.toLowerCase().includes(q)) {
          return false;
        }
      }
      const r = progress.get(p.id);
      switch (status) {
        case "todo": return r?.status !== "solved";
        case "solved": return r?.status === "solved";
        case "starred": return r?.starred === true;
        default: return true;
      }
    },
    [difficulties, query, status, progress],
  );

  const visible = useMemo(() => listProblems.filter(matches), [listProblems, matches]);

  const grouped = useMemo(() => {
    const map = new Map<string, Problem[]>();
    for (const p of visible) map.set(p.topic, [...(map.get(p.topic) ?? []), p]);
    return TOPICS.filter((t) => map.has(t)).map((t) => ({
      topic: t,
      problems: map.get(t)!,
    }));
  }, [visible]);

  /* ------------------------------------------------------- today's plan */
  const schedules = useMemo(() => topicSchedules(attempts, topicOf), [attempts]);

  const planFor = useCallback(
    (slotsPastGoal: number) =>
      dueDay
        ? buildPlan({
            problems: listProblems,
            progress,
            attempts,
            schedules,
            topicStats: allTopicStats,
            today: dueDay,
            goal: settings.daily_goal,
            extra: slotsPastGoal,
            skipped,
          })
        : { items: [], dueTopics: [] },
    [dueDay, listProblems, progress, attempts, schedules, allTopicStats, settings.daily_goal, skipped],
  );

  const plan = useMemo(() => planFor(extra), [planFor, extra]);
  const pending = plan.items.filter((i) => !i.done);
  const canExtend = useMemo(
    () => pending.length === 0 && planFor(extra + 1).items.some((i) => !i.done),
    [pending.length, planFor, extra],
  );

  const focus: FocusItem | null =
    override ?? pending.find((i) => i.problem.id === selectedId) ?? pending[0] ?? null;

  /** How many days the problem's topic would wait after this rating. */
  const intervalAfter = useCallback(
    (problemId: string, rating: Rating) => {
      const topic = topicOf(problemId);
      if (!topic) return null;
      const hypothetical: AttemptRow = {
        id: 0,
        user_id: "",
        problem_id: problemId,
        rating,
        duration_seconds: null,
        attempted_at: new Date().toISOString(),
      };
      const inTopic = attempts.filter((a) => topicOf(a.problem_id) === topic);
      return topicSchedules([...inTopic, hypothetical], topicOf).get(topic)?.intervalDays ?? null;
    },
    [attempts],
  );

  const hintsFor = useCallback(
    (problemId: string) =>
      Object.fromEntries(
        (["solid", "shaky", "struggled"] as const).map((r) => {
          const days = intervalAfter(problemId, r);
          return [r, days === null ? "" : `topic back in ${days}d`];
        }),
      ) as Record<Rating, string>,
    [intervalAfter],
  );

  const byDay = useMemo(() => attemptsByDay(attempts), [attempts]);
  const streak = useMemo(() => currentStreak(byDay), [byDay]);

  /* ------------------------------------------------------------ actions */
  const jumpToTopic = useCallback((topic: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.delete(topic);
      return next;
    });
    requestAnimationFrame(() => {
      document.getElementById(`topic-${slug(topic)}`)?.scrollIntoView({ block: "start" });
    });
  }, []);

  const pickRandom = useCallback(() => {
    if (visible.length === 0) {
      study.pushToast({ message: "No problems match the current filters." });
      return;
    }
    const p = visible[Math.floor(Math.random() * visible.length)];
    setOverride({ problem: p, reason: "Random pick" });
    window.scrollTo({ top: 0 });
  }, [visible, study]);

  const handleRate = useCallback(
    async (problemId: string, rating: Rating) => {
      const days = intervalAfter(problemId, rating);
      await study.rate(problemId, rating, elapsed > 0 ? elapsed : null);
      const problem = PROBLEM_BY_ID[problemId];
      study.pushToast({
        message: `${problem?.name ?? "Problem"} — ${RATING_LABELS[rating]}.${
          problem && days !== null ? ` ${problem.topic} back in ${days} days.` : ""
        }`,
      });
      setOverride(null);
      setElapsed(0);
      setSelectedId(null);
    },
    [study, elapsed, intervalAfter],
  );

  const handleToggleSolved = useCallback(
    (problemId: string, solved: boolean) => {
      study.setSolved(problemId, solved);
      if (solved) {
        // Nudge toward a rating without forcing a modal -- an unrated solve
        // doesn't count toward today or the topic's schedule.
        study.pushToast(
          {
            message: `${PROBLEM_BY_ID[problemId]?.name ?? "Solved"} — how did it go?`,
            rateProblemId: problemId,
          },
          9000,
        );
      }
    },
    [study],
  );

  const exportData = useCallback(() => {
    const payload = {
      exportedAt: new Date().toISOString(),
      progress: [...progress.values()],
      attempts,
      settings,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `grind-progress-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [progress, attempts, settings, today]);

  /* -------------------------------------------------------- scroll spy  */
  useEffect(() => {
    const sections = grouped
      .map((g) => document.getElementById(`topic-${slug(g.topic)}`))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActiveTopic(hit.target.id.replace("topic-", ""));
      },
      { rootMargin: "-120px 0px -70% 0px", threshold: 0 },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [grouped]);

  /* ------------------------------------------------------- keyboard ---- */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable === true;

      if (e.key === "Escape") {
        if (openProblemId) setOpenProblemId(null);
        else if (showStats) setShowStats(false);
        else if (showSettings) setShowSettings(false);
        else if (typing) (target as HTMLElement).blur();
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case "/":
          e.preventDefault();
          searchRef.current?.focus();
          break;
        case "r": pickRandom(); break;
        case "t": {
          const order = ["system", "light", "dark"] as const;
          study.setTheme(order[(order.indexOf(settings.theme) + 1) % order.length]);
          break;
        }
        case "s": setShowStats((v) => !v); break;
        case "[": study.setList("blind75"); break;
        case "]": study.setList("neetcode150"); break;
        case "1": case "2": case "3": {
          const target2 = openProblemId ?? focus?.problem.id;
          if (!target2) break;
          const rating = (["solid", "shaky", "struggled"] as const)[Number(e.key) - 1];
          void handleRate(target2, rating);
          break;
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openProblemId, showStats, showSettings, pickRandom, study, settings.theme, focus, handleRate]);

  const searching = query.trim() !== "";
  const openProblem = openProblemId ? PROBLEM_BY_ID[openProblemId] : null;
  const allCollapsed =
    !searching && grouped.length > 0 && grouped.every((g) => collapsed.has(g.topic));

  return (
    <>
      <TopBar
        list={list}
        onListChange={(l) => { study.setList(l); setSelectedId(null); setOverride(null); }}
        counts={counts}
        query={query}
        onQueryChange={setQuery}
        searchRef={searchRef}
        onThemeToggle={() => {
          const order = ["system", "light", "dark"] as const;
          study.setTheme(order[(order.indexOf(settings.theme) + 1) % order.length]);
        }}
        onOpenStats={() => setShowStats(true)}
        onOpenSettings={() => setShowSettings(true)}
        signedIn={userId !== null}
      />

      <div className="shell">
        <Sidebar
          solved={counts[list].solved}
          total={counts[list].total}
          byDifficulty={byDifficulty}
          topics={allTopicStats}
          activeTopic={activeTopic ? TOPICS.find((t) => slug(t) === activeTopic) ?? null : null}
          onJump={jumpToTopic}
        />

        <main className="main">
          {!userId && !dismissedGuestNote && (
            <div className="banner">
              <span>
                <strong>Saving to this device.</strong> Sign in to sync across
                devices — your progress here comes with you.
              </span>
              <Link className="btn" href="/login">Sign in</Link>
              <button
                className="icon-btn"
                onClick={() => setDismissedGuestNote(true)}
                aria-label="Dismiss"
              >
                <Close size={14} />
              </button>
            </div>
          )}

          <TodayPanel
            plan={plan.items}
            focus={focus}
            dueTopicCount={plan.dueTopics.length}
            streak={streak}
            dailyGoal={settings.daily_goal}
            timerMinutes={settings.timer_minutes}
            row={focus ? rowFor(focus.problem.id) : null}
            hints={focus ? hintsFor(focus.problem.id) : null}
            canExtend={canExtend}
            onSelect={(item: PlanItem) => { setOverride(null); setSelectedId(item.problem.id); }}
            onSkip={() => {
              if (override) { setOverride(null); return; }
              if (!focus) return;
              const id = focus.problem.id;
              setSkipped((prev) => new Set(prev).add(id));
              setSelectedId(null);
            }}
            onMore={() => setExtra((n) => n + 1)}
            onOpen={setOpenProblemId}
            onRate={(rating) => focus && void handleRate(focus.problem.id, rating)}
            onElapsedChange={setElapsed}
          />

          <FilterBar
            status={status}
            onStatusChange={setStatus}
            difficulties={difficulties}
            onToggleDifficulty={(d) =>
              setDifficulties((prev) => {
                const next = new Set(prev);
                if (next.has(d)) next.delete(d); else next.add(d);
                return next;
              })
            }
            statusCounts={statusCounts}
            visibleCount={visible.length}
            allCollapsed={allCollapsed}
            onToggleCollapseAll={() =>
              setCollapsed(allCollapsed ? new Set() : new Set(grouped.map((g) => g.topic)))
            }
            onRandom={pickRandom}
          />

          {grouped.length === 0 ? (
            <div className="card empty-state">
              <strong>No problems match</strong>
              <span>Try clearing the search or a filter.</span>
              <button
                className="btn"
                onClick={() => { setQuery(""); setStatus("all"); setDifficulties(new Set()); }}
                style={{ marginTop: 8 }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div>
              {grouped.map(({ topic, problems }) => {
                const stat = allTopicStats.find((t) => t.topic === topic);
                return (
                  <TopicSection
                    key={topic}
                    topic={topic}
                    problems={problems}
                    total={stat?.total ?? problems.length}
                    solved={stat?.solved ?? 0}
                    open={searching || !collapsed.has(topic)}
                    today={dueDay}
                    schedule={schedules.get(topic) ?? null}
                    rowFor={rowFor}
                    onToggleOpen={() =>
                      setCollapsed((prev) => {
                        const next = new Set(prev);
                        if (next.has(topic)) next.delete(topic); else next.add(topic);
                        return next;
                      })
                    }
                    onOpenProblem={setOpenProblemId}
                    onToggleSolved={handleToggleSolved}
                    onToggleStar={study.toggleStar}
                  />
                );
              })}
            </div>
          )}
        </main>
      </div>

      {openProblem && (
        <ProblemDrawer
          problem={openProblem}
          row={rowFor(openProblem.id)}
          hints={hintsFor(openProblem.id)}
          topicSchedule={schedules.get(openProblem.topic) ?? null}
          attempts={attempts.filter((a) => a.problem_id === openProblem.id)}
          onClose={() => setOpenProblemId(null)}
          onToggleSolved={(s) => handleToggleSolved(openProblem.id, s)}
          onToggleStar={() => study.toggleStar(openProblem.id)}
          onNotesChange={(n) => study.setNotes(openProblem.id, n)}
          onNotesFlush={() => study.flushNotes(openProblem.id)}
          onRate={(r) => void handleRate(openProblem.id, r)}
        />
      )}

      {showStats && (
        <StatsModal
          attempts={attempts}
          byDay={byDay}
          topics={allTopicStats}
          solved={counts[list].solved}
          total={counts[list].total}
          onClose={() => setShowStats(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdate={(patch) => study.updateSettings(patch)}
          onImport={study.importSolved}
          onExport={exportData}
          onReset={study.resetAll}
          onClose={() => setShowSettings(false)}
        />
      )}

      <div className="toast-wrap">
        {study.toasts.map((t) => (
          <div className="toast" key={t.id}>
            <span>{t.message}</span>
            {t.rateProblemId && (
              <>
                {(["solid", "shaky", "struggled"] as const).map((r) => (
                  <button
                    key={r}
                    className="btn"
                    onClick={() => {
                      void handleRate(t.rateProblemId!, r);
                      study.dismissToast(t.id);
                    }}
                  >
                    {RATING_LABELS[r]}
                  </button>
                ))}
              </>
            )}
            {t.action && (
              <button className="btn" onClick={() => { t.action!.run(); study.dismissToast(t.id); }}>
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
