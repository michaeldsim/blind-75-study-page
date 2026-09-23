import { createClient } from "@/lib/supabase/server";
import StudyApp from "@/components/StudyApp";
import { defaultSettings, LOCAL_USER_ID, type Snapshot } from "@/lib/store";
import type { AttemptRow, ProgressRow, SettingsRow } from "@/lib/types";

// Progress is per-request user data; never cache it.
export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub ?? null;

  // Signed out is a supported state, not a redirect: the client hydrates from
  // localStorage and the app works exactly the same.
  if (!userId) {
    const empty: Snapshot = {
      progress: [],
      attempts: [],
      settings: defaultSettings(LOCAL_USER_ID),
    };
    return <StudyApp userId={null} initial={empty} />;
  }

  const [progressRes, attemptsRes, settingsRes] = await Promise.all([
    supabase.from("problem_progress").select("*"),
    supabase
      .from("attempts")
      .select("*")
      .order("attempted_at", { ascending: false })
      .limit(1000),
    supabase.from("user_settings").select("*").maybeSingle(),
  ]);

  const initial: Snapshot = {
    progress: (progressRes.data ?? []) as ProgressRow[],
    attempts: (attemptsRes.data ?? []) as AttemptRow[],
    settings: (settingsRes.data as SettingsRow | null) ?? defaultSettings(userId),
  };

  return <StudyApp userId={userId} initial={initial} />;
}
