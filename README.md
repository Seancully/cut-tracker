# Sean's Cut 🏋️

A private cut tracker — daily checklist, freeform workout log, and a weight-trend graph with a 7-day rolling average. React + Vite, data synced to Supabase, hosted on GitHub Pages.

## 1. Run it locally

```bash
npm install
cp .env.example .env      # then paste your Supabase keys into .env
npm run dev
```

Open the printed URL (usually http://localhost:5173).

## 2. Set up Supabase (one-time, ~5 min)

1. Create a free project at https://supabase.com.
2. **SQL Editor → New query** → paste everything from `supabase/schema.sql` → **Run**. This creates the tables and locks every row to its owner (Row Level Security).
3. **Project Settings → API** → copy the **Project URL** and the **anon public** key into your `.env`.
4. **Authentication → Providers → Email**: make sure Email is enabled. (Magic links work out of the box.)
5. Restart `npm run dev`, enter your email, click the link it sends you. You're in.

> The anon key is safe to expose publicly *because* RLS is on — it can only ever touch the logged-in user's own rows.

## 3. Deploy to GitHub Pages

1. Push this folder to a new GitHub repo (e.g. `cut-tracker`).
2. Repo **Settings → Secrets and variables → Actions** → add two secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Repo **Settings → Pages → Source: GitHub Actions**.
4. Push to `main`. The workflow builds and deploys to
   `https://<your-username>.github.io/<repo>/`.
5. In Supabase **Authentication → URL Configuration**, add that Pages URL to
   **Redirect URLs** so the magic link returns you to the live site.

## Tabs

- **Dashboard** — morning weigh-in, daily checklist, phase, targets, notes.
- **Workout** — freeform set log with "last time / PR" hints and recent sessions.
- **Progress** — weight graph (daily dots + 7-day average line) and a projected goal date.
