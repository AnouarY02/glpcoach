# GlpCoach — Build Phases

## Phase 1: Foundation (Complete)
All basic pages and layout scaffolded.

- Next.js 14 app with TypeScript, Tailwind CSS
- Supabase auth (login, register, password reset)
- Layout with bottom navigation (dashboard, coach, meals, symptoms, progress, inject, settings)
- Middleware for protected routes
- Onboarding flow (medication, dose, start weight, injection day)
- All page shells: dashboard, coach, meals, symptoms, progress, inject, settings
- Supabase client/server helpers (`src/lib/supabase/`)
- Type definitions (`src/lib/types.ts`)

## Phase 2: Utilities & Shared Components
Common logic and reusable UI pieces.

- `src/lib/utils.ts` — `getCycleDay`, `getNextInjectionDate`, `getCyclePhase`, `formatWeight`, `cn`
- `src/components/CycleDayBadge.tsx` — Pill badge showing cycle day + phase label with color coding
- `src/components/WeightLogForm.tsx` — Reusable weight entry form (compact + full mode)
- `src/app/dashboard/WeightLogWidget.tsx` — Dashboard widget wrapping WeightLogForm

## Phase 3: Stripe Payments
Full subscription flow with Stripe.

- `src/app/api/stripe/checkout/route.ts` — Creates Stripe Checkout session (€12.99/mo subscription)
- `src/app/api/stripe/webhook/route.ts` — Handles `checkout.session.completed`, `customer.subscription.deleted`, `customer.subscription.updated` — upgrades/downgrades `user_profiles.subscription_tier`
- `src/app/api/stripe/portal/route.ts` — Creates Stripe Billing Portal session (find-or-create customer by email)
- Settings page updated with real Upgrade/Manage buttons, `?upgraded=1` success banner

## Phase 4: AI Meal Analysis
Claude-powered protein estimation for logged meals.

- `src/app/api/meals/analyze/route.ts` — POST endpoint using `claude-haiku-4-5-20251001`; accepts description + optional base64 photo; returns `{ protein_estimate_g, tips, analysis }`
- Meals page updated: Sparkles button next to description input auto-fills protein estimate + shows green AI tip callout

## Phase 5: Symptom Export
Doctor-friendly data export.

- `src/app/api/symptoms/export/route.ts` — GET endpoint; fetches last 30 days of symptoms; returns CSV with header row (date, time, symptom, severity, cycle day, notes)
- Symptoms page updated: "Export voor arts" card with download button at bottom
- Symptoms page: `CycleDayBadge` shown in page header when cycle day is known
- Each symptom log row shows "Dag X van cyclus" label

## Phase 6: Progress Improvements
Better weight tracking and real data.

- Progress page: `WeightLogForm` (compact) replaces manual inline form
- Streak calculation: counts consecutive days with weight log entries (going back from today)
- Clinical comparison text always visible: "Klinische studies tonen gemiddeld 5–15% gewichtsverlies in 6 maanden"
- Weeks-on-medication shown inline in comparison text

## Phase 7: AI Coach (Phase 1 complete)
Already built in Phase 1:
- `src/app/api/coach/route.ts` using `claude-opus-4-5`
- Context injection (cycle day, last injection, recent symptoms, current weight)
- Free tier message awareness scaffolded
