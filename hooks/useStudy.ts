"use client";

import { useCallback, useRef, useState } from "react";
import { todayISO } from "@/lib/srs";
import type { ListId } from "@/lib/catalog";
import type { Snapshot, StudyStore } from "@/lib/store";
import type {
  AttemptRow, ProgressRow, Rating, SettingsRow, Theme,
} from "@/lib/types";

export interface Toast {
  id: number;
  message: string;
  action?: { label: string; run: () => void };
  /** Renders the three rating buttons inline. */
  rateProblemId?: string;
}

function blankRow(userId: string, problemId: string): ProgressRow {
  const now = new Date().toISOString();
  return {
    user_id: userId,
    problem_id: problemId,
    status: "todo",
    starred: false,
    notes: "",
    solid_streak: 0,
    due_on: null,
    last_rating: null,
    last_attempt_at: null,
    solved_at: null,
    created_at: now,
    updated_at: now,
  };
}

export function useStudy(store: StudyStore, initial: Snapshot) {
  const [progress, setProgress] = useState<Map<string, ProgressRow>>(
    () => new Map(initial.progress.map((r) => [r.problem_id, r])),
  );
  const [attempts, setAttempts] = useState<AttemptRow[]>(initial.attempts);
  const [settings, setSettings] = useState<SettingsRow>(initial.settings);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  const dismissToast = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast: Omit<Toast, "id">, ttl = 4200) => {
      const id = (toastId.current += 1);
      setToasts((t) => [...t, { ...toast, id }]);
      if (ttl > 0) window.setTimeout(() => dismissToast(id), ttl);
      return id;
    },
    [dismissToast],
  );

  /** Local state has already moved; this only surfaces a failed write. */
  const guard = useCallback(
    async (what: string, run: () => Promise<unknown>) => {
      try {
        await run();
      } catch (e) {
        pushToast(
          { message: `Couldn't save ${what}: ${e instanceof Error ? e.message : "unknown error"}` },
          7000,
        );
      }
    },
    [pushToast],
  );

  const rowFor = useCallback(
    (problemId: string) => progress.get(problemId) ?? blankRow(store.userId, problemId),
    [progress, store.userId],
  );

  const applyRow = useCallback((row: ProgressRow) => {
    setProgress((prev) => new Map(prev).set(row.problem_id, row));
  }, []);

  const commit = useCallback(
    (row: ProgressRow, label: string) => {
      const stamped = { ...row, updated_at: new Date().toISOString() };
      applyRow(stamped);
      void guard(label, () => store.putProgress([stamped]));
    },
    [applyRow, guard, store],
  );

  /** Replaces the whole dataset, e.g. after hydrating or merging. */
  const replaceAll = useCallback((snapshot: Snapshot) => {
    setProgress(new Map(snapshot.progress.map((r) => [r.problem_id, r])));
    setAttempts(snapshot.attempts);
    setSettings(snapshot.settings);
  }, []);

  // ------------------------------------------------------------ mutations

  const setSolved = useCallback(
    (problemId: string, solved: boolean) => {
      const current = rowFor(problemId);
      commit(
        solved
          ? { ...current, status: "solved", solved_at: current.solved_at ?? new Date().toISOString() }
          : // Un-solving clears the review schedule too -- an unsolved problem
            // shouldn't keep surfacing in the due queue.
            { ...current, status: "todo", solved_at: null, due_on: null, solid_streak: 0 },
        "progress",
      );
    },
    [rowFor, commit],
  );

  const toggleStar = useCallback(
    (problemId: string) => {
      const current = rowFor(problemId);
      commit({ ...current, starred: !current.starred }, "flag");
    },
    [rowFor, commit],
  );

  const setNotes = useCallback(
    (problemId: string, notes: string) => applyRow({ ...rowFor(problemId), notes }),
    [rowFor, applyRow],
  );

  const flushNotes = useCallback(
    async (problemId: string) => {
      const row = { ...rowFor(problemId), updated_at: new Date().toISOString() };
      applyRow(row);
      await guard("notes", () => store.putProgress([row]));
    },
    [rowFor, applyRow, guard, store],
  );

  /**
   * The heart of the study loop. The attempt log is what schedules topics
   * (see topicSchedules), so rating just records it -- no per-problem date.
   */
  const rate = useCallback(
    async (problemId: string, rating: Rating, durationSeconds: number | null) => {
      const current = rowFor(problemId);
      const now = new Date().toISOString();

      commit(
        {
          ...current,
          status: "solved",
          solved_at: current.solved_at ?? now,
          last_rating: rating,
          last_attempt_at: now,
          due_on: null,
        },
        "progress",
      );

      const optimistic: AttemptRow = {
        id: -Date.now(),
        user_id: store.userId,
        problem_id: problemId,
        rating,
        duration_seconds: durationSeconds,
        attempted_at: now,
      };
      setAttempts((prev) => [optimistic, ...prev]);

      try {
        const saved = await store.addAttempt({
          problem_id: problemId,
          rating,
          duration_seconds: durationSeconds,
          attempted_at: now,
        });
        setAttempts((prev) => prev.map((a) => (a.id === optimistic.id ? saved : a)));
      } catch (e) {
        setAttempts((prev) => prev.filter((a) => a.id !== optimistic.id));
        pushToast(
          { message: `Couldn't save attempt: ${e instanceof Error ? e.message : "unknown error"}` },
          7000,
        );
      }
    },
    [rowFor, commit, store, pushToast],
  );

  const updateSettings = useCallback(
    (patch: Partial<Pick<SettingsRow, "active_list" | "theme" | "daily_goal" | "timer_minutes">>) => {
      const next = { ...settings, ...patch, updated_at: new Date().toISOString() };
      setSettings(next);
      void guard("settings", () => store.putSettings(next));
    },
    [settings, guard, store],
  );

  const setList = useCallback(
    (list: ListId) => updateSettings({ active_list: list }),
    [updateSettings],
  );

  const setTheme = useCallback(
    (theme: Theme) => updateSettings({ theme }),
    [updateSettings],
  );

  /** Bulk-marks problems solved. Used by the legacy localStorage import. */
  const importSolved = useCallback(
    async (problemIds: string[]) => {
      const now = new Date().toISOString();
      const fresh = problemIds.filter((id) => progress.get(id)?.status !== "solved");
      if (fresh.length === 0) return 0;

      const rows: ProgressRow[] = fresh.map((id) => ({
        ...rowFor(id),
        status: "solved" as const,
        solved_at: now,
        updated_at: now,
      }));

      setProgress((prev) => {
        const next = new Map(prev);
        rows.forEach((r) => next.set(r.problem_id, r));
        return next;
      });
      await guard("imported progress", () => store.putProgress(rows));
      return fresh.length;
    },
    [progress, rowFor, guard, store],
  );

  const resetAll = useCallback(async () => {
    setProgress(new Map());
    setAttempts([]);
    await guard("reset", () => store.clearAll());
  }, [guard, store]);

  return {
    progress,
    attempts,
    settings,
    toasts,
    rowFor,
    pushToast,
    dismissToast,
    replaceAll,
    setSolved,
    toggleStar,
    setNotes,
    flushNotes,
    rate,
    setList,
    setTheme,
    updateSettings,
    importSolved,
    resetAll,
    today: todayISO(),
  };
}

export type Study = ReturnType<typeof useStudy>;
