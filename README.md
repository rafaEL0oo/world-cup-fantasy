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
2. `supabase/seed.sql` — sample World Cup 2026 fixtures

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
```

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

## Updating match results (admin)

To test scoring, update a finished match in Supabase:

```sql
update public.matches
set home_score = 2, away_score = 1, status = 'finished'
where home_team = 'Poland' and away_team = 'Brazil';
```

Prediction points will recalculate automatically for all leagues.
