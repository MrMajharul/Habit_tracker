# Istiqamah — Muslim Habit & Productivity App

Plan your day around Salah, build better habits, and make time for what matters.

## Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4 + shadcn/ui
- Supabase (Auth, PostgreSQL, RLS)
- TanStack Query, React Hook Form, Zod, date-fns

## Getting started

```bash
npm install
cp .env.example .env.local
```

For local UI development without Supabase:

```env
NEXT_PUBLIC_DEV_AUTH_BYPASS=true
```

With Supabase configured, set your project URL and anon key in `.env.local`, then run the migration in `supabase/migrations/001_initial_schema.sql`.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript

## Current phase

**Phase 1 complete:** Foundation + Dashboard MVP

- Responsive app shell (sidebar + bottom nav)
- Dark mode
- Authentication architecture (email/password + Google-ready OAuth)
- Dashboard with mock prayer, habits, tasks, progress, and verified Hadith seed
- Supabase schema + RLS migration

**Next: Phase 2** — Prayer system, prayer settings, habit system, habit logging, daily dashboard integration
