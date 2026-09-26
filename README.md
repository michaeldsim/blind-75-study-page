# Grind

Spaced-repetition trainer for the **Blind 75** and **NeetCode 150** interview
problem sets. Next.js + Supabase; progress syncs across every device you sign
in on.

---

## Setup

### 1. Install and configure

```bash
npm install
cp .env.example .env.local   # then fill in the publishable key
```

`.env.local` needs:

```
NEXT_PUBLIC_SUPABASE_URL=https://wveggcohnbrrvrusrbzp.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Both are safe in the browser bundle — the publishable key only grants what RLS
allows. The secret / `service_role` key must never appear here.

### 2. Register a GitHub OAuth app

This is the one step that can't be automated.

1. **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**
   ([direct link](https://github.com/settings/developers))
   - **Application name:** anything (`Grind`)
   - **Homepage URL:** `http://localhost:3000` (update after deploying)
   - **Authorization callback URL:**
     `https://wveggcohnbrrvrusrbzp.supabase.co/auth/v1/callback`

   That callback is Supabase's, not the app's. Getting this wrong is the most
   common cause of a failed sign-in.

2. Generate a client secret, then in the **Supabase dashboard → Authentication
   → Sign In / Providers → GitHub**: enable it and paste the Client ID and
   Client Secret.

3. **Supabase dashboard → Authentication → URL Configuration**:
   - **Site URL:** `http://localhost:3000` (your Vercel URL once deployed)
   - **Redirect URLs:** add both
     - `http://localhost:3000/auth/callback`
     - `https://<your-vercel-domain>/auth/callback`

### 3. Run

```bash
npm run dev
```

---

## Deploying to Vercel

1. Import the repo at [vercel.com/new](https://vercel.com/new).
2. Add both `NEXT_PUBLIC_*` variables under **Settings → Environment Variables**.
3. After the first deploy, add the production URL to the GitHub OAuth app's
   homepage URL and to Supabase's Site URL + Redirect URLs (step 2 above).

The old GitHub Pages workflow has been removed. The previously deployed static
page stays live at its existing URL until you disable Pages — useful, because
that's where your old progress still lives (see below).

---

## Bringing over progress from the old version

The pre-2.0 app stored progress in `localStorage` on the `github.io` origin,
which a different origin can't read. To move it across:

1. Open the old page.
2. In the browser console: `copy(localStorage.getItem('questionStates'))`
3. In Grind: **Settings → Import from the old version**, paste, import.

Problems you had *deselected* in the old app are treated as solved, matching
how that version worked.

---

## How the review scheduling works

A problem takes ~30 minutes, so scheduling every problem individually builds a
backlog no one can clear. Reviews are scheduled per **topic** instead, and any
problem in the topic counts as reviewing it. Rate a solve and the rating
decides when its topic comes back:

| Rating      | Topic returns | Effect on streak        |
| ----------- | ------------- | ----------------------- |
| Solid       | ~7 days       | Streak +1, interval ×1.8 each consecutive solid day (capped at 90 days) |
| Shaky       | 4 days        | Streak held             |
| Struggled   | 2 days        | Streak reset            |

Several solves in one topic on the same day count once, at the worst rating.
The schedule is replayed from the attempt log, so it's never stored and can't
drift.

The **Today** panel is a fixed plan sized by the daily goal (default 2): one
new problem first — flagged, then weakest topic, then catalog order — then
reviews of the most overdue topics. A review picks a problem you struggled with,
then a flagged one, then an unsolved one, then whichever you've gone longest
without. Due topics past the cap wait for another day; "One more" goes past the
goal on request.

Marking a problem solved without rating it *doesn't* count — that's what the
rating prompt in the toast is for.

---

## Keyboard shortcuts

| Key       | Action                          |
| --------- | ------------------------------- |
| `/`       | Focus search                    |
| `R`       | Random problem from current filters |
| `1` `2` `3` | Rate solid / shaky / struggled |
| `S`       | Statistics                      |
| `T`       | Cycle theme                     |
| `[` `]`   | Blind 75 / NeetCode 150         |
| `Esc`     | Close drawer or modal           |

---

## Layout

```
app/           routes: home, login, OAuth callback, signout
components/    UI
hooks/         useStudy -- optimistic state + Supabase sync
lib/
  catalog.ts   the 150 problems (static; Blind 75 flagged as a subset)
  srs.ts       review scheduling
  stats.ts     streaks, heatmap, per-topic progress -- all derived
  supabase/    browser + server clients
proxy.ts       refreshes the auth session on every navigation
supabase/migrations/   schema, RLS policies, grants
legacy/        the original single-file version
```

## Data model

Three tables, all with RLS restricting rows to their owner and `anon` revoked
entirely:

- **`problem_progress`** — status, flag, notes, and review schedule per problem
- **`attempts`** — append-only log; streaks and the heatmap derive from it
- **`user_settings`** — active list, theme, timer budget, daily goal

The problem catalog is *not* in the database. It's static content that never
changes, so it ships in the bundle instead of costing a round trip.
