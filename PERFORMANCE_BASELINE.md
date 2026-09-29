# ⏱️ Performance Baseline Report — Istiqamah

**Date**: 2026-09-30  
**Environment**: Production mode (`next build` + `next start` on Node.js v23.11.0, Turbopack, Next.js 16.3.6)  
**Database**: Supabase PostgreSQL (`aws-0-us-east-1`)  
**Network Condition**: Real remote cloud roundtrips (US-East-1 from local client)

---

## 1. Measured Baseline Timings (Authenticated User)

| Route / Interaction | HTTP Status | TTFB | Total Server Time | Transfer Size | Perceived UX |
|:---|:---:|:---:|:---:|:---:|:---|
| **Landing (`/`)** | 200 (Static) | 3.96 ms | 4.23 ms | 67.2 KB | Instant |
| **Hard Refresh `/dashboard`** | 200 (Dynamic) | **562.7 ms** | **3,419.9 ms (3.42s)** | 119.1 KB | **Critically Slow (Blank freeze)** |
| **`/prayer` Hard Refresh** | 200 (Static) | 297.8 ms | 298.4 ms | 68.4 KB | Noticeable delay |
| **`/tasks` Hard Refresh** | 200 (Static) | 294.2 ms | 294.5 ms | 46.5 KB | Noticeable delay |
| **`/focus` Hard Refresh** | 200 (Static) | 300.8 ms | 301.0 ms | 37.5 KB | Fullscreen spinner flashes |
| **`/quran` Hard Refresh** | 200 (Static) | **799.4 ms** | **799.9 ms** | 37.4 KB | Fullscreen spinner flashes |
| **`/analytics` Hard Refresh** | 200 (Static) | 294.5 ms | 294.8 ms | 57.9 KB | Fullscreen spinner flashes |
| **`/settings` Hard Refresh** | 200 (Static) | 296.4 ms | 296.6 ms | 81.9 KB | Noticeable delay |

---

## 2. Route Navigation & Transitions (Sidebar Clicks)

| Route Transition | Measured Transition Time | Visual Feedback on Click | Loading State Displayed |
|:---|:---:|:---|:---|
| `/dashboard` → `/prayer` | ~300 ms | ❌ None (No visual response on click) | ❌ None (Appears frozen until rendered) |
| `/dashboard` → `/tasks` | ~295 ms | ❌ None (No visual response on click) | ❌ None (No loading skeleton) |
| `/tasks` → `/focus` | ~300 ms | ❌ None | ⚠️ Fullscreen spinner (`animate-spin`) |
| `/focus` → `/quran` | ~800 ms | ❌ None | ⚠️ Fullscreen spinner (`animate-spin`) |
| `/quran` → `/analytics` | ~295 ms | ❌ None | ⚠️ Fullscreen spinner (`animate-spin`) |
| `/analytics` → `/settings`| ~300 ms | ❌ None | ❌ None |

---

## 3. JavaScript Bundles & Asset Footprint

- **Total Static JS Size**: **3,137.73 KB (3.14 MB)**
- **Top JS Chunk Sizes**:
  1. `2i94yk4t6r222.js`: **415.5 KB**
  2. `2telnrowzzwav.js`: **251.0 KB**
  3. `1vs0mz5iywj6y.js`: **223.6 KB**
  4. `0vjpld0tahd7i.js`: **152.3 KB**
  5. `0cz1d0mv5g_q7.js`: **110.0 KB**
  6. `0wvgxdf0s_tsz.js`: **103.4 KB**
  7. `03lyv0-pfba3c.js`: **89.9 KB**

---

## 4. Root Causes Identified

### A. Sequential Database & Auth Waterfalls in `getDashboardData()`
On every `/dashboard` load, the server performs **7 sequential await calls**:
1. `auth.getUser()` (~280ms)
2. `profiles.select("*")` (~280ms)
3. `habits.select("*")` (~280ms)
4. `habit_logs.select("habit_id")` (~280ms)
5. `tasks.select("*")` (~280ms)
6. `prayer_logs.select("prayer")` (~280ms)
7. `focus_sessions.select("actual_minutes")` (~280ms)
*Total waterfall latency: **~2,000–3,000 ms**!*

### B. Middleware Calling Remote Auth on Every Single Request
In `src/middleware.ts`, `supabase.auth.getUser()` runs on every request:
- Every page load pays an unavoidable ~280ms network penalty to Supabase in `us-east-1`.
- Even static routes (`/tasks`, `/focus`, `/analytics`) take ~300ms TTFB instead of <10ms.
- Session JWT validation can use fast local token checks for standard routes instead of remote network requests for every asset/RSC call.

### C. Duplicate Auth Checks
`auth.getUser()` is called in `middleware.ts`, and then called **AGAIN** immediately in `getDashboardData()` and in page components.

### D. Zero `loading.tsx` in the entire App Router
`find src/app -name "loading.tsx"` found **0 files**.
Next.js App Router cannot display instant visual transitions when navigating between sidebar links because no route-level loading state exists.

### E. Disorienting Fullscreen Spinners
Several pages (`/focus`, `/quran`, `/analytics`) use inline `<Suspense>` with centered spinning loaders (`animate-spin`) rather than matching structural skeletons, creating a jarring flicker effect.

### F. Unnecessary `select("*")` Over-fetching
Every single query loads all database columns (`select("*")`), including unused timestamps, foreign keys, and metadata.

### G. Client-side Settings/Profile Redundant Fetching
Pages like `/settings` refetch profile and prayer settings repeatedly upon each mount, causing hydration delays.
