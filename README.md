# World Cup Predictor League

A social prediction platform for FIFA World Cup 2026. Create private leagues, invite friends with a code, predict match results, and compete on the leaderboard.

## Tech stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, React Hook Form
- **Backend:** Supabase (Auth, PostgreSQL, Row Level Security)
- **Deployment:** Vercel

## Getting started

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In **Authentication → Providers**, enable **Google** and add your OAuth credentials.
3. Add redirect URL: `http://localhost:3000/auth/callback` (and your production URL later).

### 2. Run the database schema

In the Supabase SQL editor, run:

1. `supabase/schema.sql` — tables, RLS policies, scoring triggers
2. `supabase/migrations/add-api-football.sql` — if upgrading an existing database
3. `supabase/seed.sql` — optional sample fixtures (skip if using API-Football sync)

### 3. Configure environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your Supabase project URL and anon key from **Project Settings → API**.

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Match sync (server-only)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
API_FOOTBALL_KEY=your-api-football-key
CRON_SECRET=some-random-secret
```

Get your API-Football key at [api-football.com](https://www.api-football.com/). The service role key is in Supabase **Project Settings → API** (never expose it to the browser).

### 4. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push the repo to GitHub.
2. Import the project in Vercel.
3. Add the same environment variables in Vercel project settings.
4. Set `NEXT_PUBLIC_SITE_URL` to your production domain.
5. Add the production callback URL in Supabase Auth settings: `https://your-domain.vercel.app/auth/callback`.

## Features

| Feature | Route |
|---------|-------|
| Google OAuth login | `/login` |
| League dashboard | `/dashboard` |
| League overview | `/league/[id]` |
| Match predictions | `/league/[id]/predictions` |
| Leaderboard | `/league/[id]/leaderboard` |
| Tournament picks | `/league/[id]/tournament` |

## Scoring

| Result | Points |
|--------|--------|
| Exact score | 5 |
| Correct winner or draw | 2 |
| Wrong prediction | 0 |

Points are recalculated automatically via a Postgres trigger when match results are updated.

## Project structure

```
src/
├── app/                  # App Router pages and server actions
├── components/           # UI components (shadcn + feature components)
├── lib/                  # Supabase clients, auth, scoring, league helpers
└── types/                # TypeScript types
supabase/
├── schema.sql            # Database schema + RLS
└── seed.sql              # Match fixture seed data
```

## Match data: built-in seed (free plan) or API-Football (paid)

> **Important:** API-Football's **free plan only covers seasons 2022–2024**. World Cup 2026 requires a **paid plan**. On the free plan, the app automatically seeds matches from built-in data when users log in.

## Match data: widgets + database (hybrid)

This app uses two complementary approaches:

| Layer | Source | Purpose |
|-------|--------|---------|
| **Display** | [API-SPORTS widgets](https://www.api-football.com/widgets) | Live scores, fixtures, stats — auto-refresh in the browser |
| **Database** | One-time import + optional manual sync | Predictions, kickoff lock, scoring, leaderboard |

Widgets handle all **live display** without server API calls. Your database still needs match rows for users to submit predictions and earn points.

### 1. Widget setup (live fixtures & scores)

Add to `.env.local`:

```env
NEXT_PUBLIC_API_FOOTBALL_KEY=your-api-football-key
```

In the [API-Football dashboard](https://www.api-football.com/), **restrict the key to your domain** (e.g. `localhost`, `your-app.vercel.app`) since widgets load the key client-side.

Widgets appear on the **Predictions** page and refresh every 60 seconds.

### 2. Sync on login (1 request per login)

Every time a user logs in and hits the dashboard, the app syncs matches:

| Login # | API calls | What happens |
|---------|-----------|--------------|
| 1st (empty DB) | 1 | Full import of all WC fixtures |
| Each login after | 1 | Updates scores & status (yesterday → tomorrow) |
| 100+ logins/day | 0 | Skips API, uses existing DB data |

With fewer than 100 logins per day you stay within the free API budget.

- **Free plan (2022–2024 only)** → auto-falls back to 24 built-in WC 2026 fixtures
- **Paid plan** → live API sync on every login

Requires `SUPABASE_SERVICE_ROLE_KEY` and `API_FOOTBALL_KEY` in `.env.local`.

To update scores on the free plan, edit matches directly in Supabase:

```sql
update public.matches
set home_score = 2, away_score = 1, status = 'finished'
where home_team = 'Mexico' and away_team = 'South Africa';
```

### 3. Manual sync (optional)

```bash
curl -X POST "http://localhost:3000/api/admin/sync-matches?mode=today" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Request budget (free plan: 100/day)

| Action | Requests | Frequency |
|--------|----------|-----------|
| Widget display | Handled by API-SPORTS widget | Automatic |
| Login sync (empty DB) | 1 | First login |
| Login sync (ongoing) | 1 per login | Each dashboard visit after login |
| Manual admin sync | 1 | Optional |
