/**
 * Storage layer.
 *
 * The app is local-first: signed out, everything lives in localStorage and
 * works fully. Signing in swaps the store for Postgres and merges whatever
 * was accumulated locally. Both implementations satisfy the same interface,
 * so nothing above this file knows which one it's talking to.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AttemptRow, ProgressRow, Rating, SettingsRow } from "./types";

export const LOCAL_USER_ID = "local";
export const LOCAL_KEY = "grind:v2";

export interface Snapshot {
  progress: ProgressRow[];
  attempts: AttemptRow[];
  settings: SettingsRow;
}

export interface NewAttempt {
  problem_id: string;
  rating: Rating;
  duration_seconds: number | null;
  attempted_at: string;
}

export interface StudyStore {
  readonly mode: "local" | "cloud";
  readonly userId: string;
  load(): Promise<Snapshot | null>;
  putProgress(rows: ProgressRow[]): Promise<void>;
  addAttempt(attempt: NewAttempt): Promise<AttemptRow>;
  putSettings(settings: SettingsRow): Promise<void>;
  clearAll(): Promise<void>;
}

export function defaultSettings(userId: string): SettingsRow {
  return {
    user_id: userId,
    active_list: "blind75",
    theme: "system",
    daily_goal: 2,
    timer_minutes: 35,
    updated_at: new Date().toISOString(),
  };
}

/* ------------------------------------------------------------------ local */

function readBlob(): Snapshot | null {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Snapshot>;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      progress: Array.isArray(parsed.progress) ? parsed.progress : [],
      attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
      settings: parsed.settings ?? defaultSettings(LOCAL_USER_ID),
    };
  } catch {
    // Private mode, cleared storage, or corrupt JSON -- start fresh rather
    // than taking the whole app down.
    return null;
  }
}

function writeBlob(snapshot: Snapshot): void {
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(snapshot));
  } catch {
    // Quota or private mode. The in-memory state still works for this session.
  }
}

export class LocalStore implements StudyStore {
  readonly mode = "local" as const;
  readonly userId = LOCAL_USER_ID;

  async load(): Promise<Snapshot | null> {
    return readBlob();
  }

  private current(): Snapshot {
    return readBlob() ?? { progress: [], attempts: [], settings: defaultSettings(LOCAL_USER_ID) };
  }

  async putProgress(rows: ProgressRow[]): Promise<void> {
    const snap = this.current();
    const byId = new Map(snap.progress.map((r) => [r.problem_id, r]));
    rows.forEach((r) => byId.set(r.problem_id, r));
    writeBlob({ ...snap, progress: [...byId.values()] });
  }

  async addAttempt(attempt: NewAttempt): Promise<AttemptRow> {
    const snap = this.current();
    const nextId = snap.attempts.reduce((max, a) => Math.max(max, a.id), 0) + 1;
    const row: AttemptRow = { id: nextId, user_id: LOCAL_USER_ID, ...attempt };
    writeBlob({ ...snap, attempts: [row, ...snap.attempts] });
    return row;
  }

  async putSettings(settings: SettingsRow): Promise<void> {
    const snap = this.current();
    writeBlob({ ...snap, settings });
  }

  async clearAll(): Promise<void> {
    try {
      window.localStorage.removeItem(LOCAL_KEY);
    } catch {
      /* nothing to do */
    }
  }
}

/* ------------------------------------------------------------------ cloud */

const PROGRESS_COLUMNS = [
  "user_id", "problem_id", "status", "starred", "notes", "solid_streak",
  "due_on", "last_rating", "last_attempt_at", "solved_at",
] as const;

function progressPayload(row: ProgressRow) {
  return Object.fromEntries(
    PROGRESS_COLUMNS.map((c) => [c, row[c]]),
  ) as Pick<ProgressRow, (typeof PROGRESS_COLUMNS)[number]>;
}

export class CloudStore implements StudyStore {
  readonly mode = "cloud" as const;

  constructor(
    private readonly supabase: SupabaseClient,
    readonly userId: string,
  ) {}

  async load(): Promise<Snapshot> {
    const [progress, attempts, settings] = await Promise.all([
      this.supabase.from("problem_progress").select("*"),
      this.supabase
        .from("attempts")
        .select("*")
        .order("attempted_at", { ascending: false })
        .limit(1000),
      this.supabase.from("user_settings").select("*").maybeSingle(),
    ]);

    return {
      progress: (progress.data ?? []) as ProgressRow[],
      attempts: (attempts.data ?? []) as AttemptRow[],
      settings: (settings.data as SettingsRow | null) ?? defaultSettings(this.userId),
    };
  }

  async putProgress(rows: ProgressRow[]): Promise<void> {
    if (rows.length === 0) return;
    const { error } = await this.supabase
      .from("problem_progress")
      .upsert(rows.map(progressPayload), { onConflict: "user_id,problem_id" });
    if (error) throw new Error(error.message);
  }

  async addAttempt(attempt: NewAttempt): Promise<AttemptRow> {
    const { data, error } = await this.supabase
      .from("attempts")
      .insert({ user_id: this.userId, ...attempt })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as AttemptRow;
  }

  async putSettings(settings: SettingsRow): Promise<void> {
    const { error } = await this.supabase.from("user_settings").upsert(
      {
        user_id: this.userId,
        active_list: settings.active_list,
        theme: settings.theme,
        daily_goal: settings.daily_goal,
        timer_minutes: settings.timer_minutes,
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
  }

  async clearAll(): Promise<void> {
    const a = await this.supabase.from("attempts").delete().eq("user_id", this.userId);
    const b = await this.supabase.from("problem_progress").delete().eq("user_id", this.userId);
    const error = a.error ?? b.error;
    if (error) throw new Error(error.message);
  }
}

/* ------------------------------------------------------------------ merge */

export interface MergeResult {
  progress: ProgressRow[];
  attempts: NewAttempt[];
}

/**
 * Folds guest progress into an account on first sign-in.
 *
 * Union rather than overwrite, because either side may hold work the other
 * doesn't: solved beats unsolved, a flag on either side survives, and for
 * everything else the more recently touched row wins.
 */
export function mergeLocalIntoCloud(
  local: Snapshot,
  cloud: Snapshot,
  userId: string,
): MergeResult {
  const cloudById = new Map(cloud.progress.map((r) => [r.problem_id, r]));
  const merged: ProgressRow[] = [];

  for (const localRow of local.progress) {
    const cloudRow = cloudById.get(localRow.problem_id);
    const claimed = { ...localRow, user_id: userId };

    if (!cloudRow) {
      merged.push(claimed);
      continue;
    }

    const newer =
      localRow.updated_at > cloudRow.updated_at ? claimed : cloudRow;
    const solved = localRow.status === "solved" || cloudRow.status === "solved";

    const candidate: ProgressRow = {
      ...newer,
      user_id: userId,
      status: solved ? "solved" : "todo",
      starred: localRow.starred || cloudRow.starred,
      notes: newer.notes.trim() !== "" ? newer.notes : (cloudRow.notes || localRow.notes),
      solved_at: cloudRow.solved_at ?? localRow.solved_at,
      solid_streak: Math.max(localRow.solid_streak, cloudRow.solid_streak),
    };

    // Only write rows the merge actually changed.
    if (JSON.stringify(progressPayload(candidate)) !== JSON.stringify(progressPayload(cloudRow))) {
      merged.push(candidate);
    }
  }

  // Attempts are an append-only log, so local ones are simply added. Dedupe on
  // (problem, timestamp) in case a merge is retried.
  const seen = new Set(
    cloud.attempts.map((a) => `${a.problem_id}@${a.attempted_at}`),
  );
  const attempts: NewAttempt[] = local.attempts
    .filter((a) => !seen.has(`${a.problem_id}@${a.attempted_at}`))
    .map((a) => ({
      problem_id: a.problem_id,
      rating: a.rating,
      duration_seconds: a.duration_seconds,
      attempted_at: a.attempted_at,
    }));

  return { progress: merged, attempts };
}
