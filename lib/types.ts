import type { ListId } from "./catalog";

export type Rating = "solid" | "shaky" | "struggled";
export type Status = "todo" | "solved";
export type Theme = "system" | "light" | "dark";

export interface ProgressRow {
  user_id: string;
  problem_id: string;
  status: Status;
  starred: boolean;
  notes: string;
  solid_streak: number;
  due_on: string | null; // YYYY-MM-DD
  last_rating: Rating | null;
  last_attempt_at: string | null;
  solved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttemptRow {
  id: number;
  user_id: string;
  problem_id: string;
  rating: Rating;
  duration_seconds: number | null;
  attempted_at: string;
}

export interface SettingsRow {
  user_id: string;
  active_list: ListId;
  theme: Theme;
  daily_goal: number;
  timer_minutes: number;
  updated_at: string;
}

export const RATING_LABELS: Record<Rating, string> = {
  solid: "Solid",
  shaky: "Shaky",
  struggled: "Struggled",
};
