## Overview
Add a cinematic public landing page at `/` (move authenticated dashboard to `/dashboard`) and extend the signup flow with a complete onboarding form. Reuse existing auth + profiles backend; only add new columns where needed.

## 1. Routing changes (`src/App.tsx`)
- `/` → new public `Landing` page (no auth gate). If user is logged in, show a "Go to Dashboard" CTA but still render landing.
- `/dashboard` → existing `Dashboard` (protected).
- `/auth` already exists — keep, but landing's "Login"/"Join DIT" buttons deep-link to `/auth?mode=login` or `/auth?mode=signup`.
- Update `Header` "home" link to `/dashboard` for logged-in users.

## 2. New Landing page (`src/pages/Landing.tsx`)
Cinematic flyer-style hero matching the attached countdown design:
- Deep navy bg with damask SVG pattern overlay + side curtain gradients (CSS only — no asset uploads).
- Top: small date line "31ST MAY, 2026".
- Massive glowing weeks number (auto-computed to target date 2026-05-31), with smaller `WEEKS TO GO` label.
- Animated countdown row: Weeks · Days · Hours · Minutes · Seconds (live ticking).
- Centerpiece: large rainbow/glow "10 Years Anniversary" mark — pure CSS/SVG (gradient ring + script font for "Years Anniversary").
- Floating "10" logo: small version that bounces around the viewport (DVD-style), velocity vector reflected on edge collisions, soft glow trail (requestAnimationFrame in a useEffect).
- Particle layer: 30 absolutely-positioned dots with random animation delays/durations using existing tailwind animate utilities + new keyframes (`float`, `twinkle`, `glow-pulse`) added to `tailwind.config.ts` & `index.css`.
- Mission + Vision section (text content from user).
- CTA section: "Member Login" + "Join DIT" buttons with hover scale/glow.
- Footer: contact emails, phone numbers, socials (DIVINE INTELLIGENCE TEAM).

All colors via existing semantic tokens; add a few new tokens (`--gold-glow`, `--rainbow-*`) to `index.css`.

## 3. Auth page enhancements (`src/pages/Auth.tsx`)
- Add tab toggle Login | Signup with smooth transition (already partially present — polish with `animate-fade-in`).
- Add Google OAuth button using managed `lovable.auth.signInWithOAuth("google", ...)` (call `supabase--configure_social_auth` first to scaffold).
- Read `?mode=` query param to preselect tab.
- Signup tab: replace simple form with the multi-step onboarding form below.
- Glassmorphism card styling.

## 4. Multi-step Signup (`src/components/SignupWizard.tsx`)
Steps with progress indicator + smooth transitions:
1. Account — email, password, full name
2. Personal — DOB (reject <15), phone w/ country code (`react-phone-number-input` already-style; use simple country code select), faction (DYP/SHI/TECK/MINDUP)
3. Origin — country/state/city (dependent dropdowns via existing `country-state-city` package, with `City.getCitiesOfState`)
4. Residence — same dropdowns
5. Membership — date joined DIT (month required, year required, day optional, "best of knowledge" checkbox)
6. Employment — radio (employed/self-employed/unemployed); if employed → employer name
7. Education — toggle student y/n
   - Student: school, course, level (incl. "Jambite")
   - Non-student: academic background, year of graduation
8. Review & Submit

Validation with `zod`. On submit:
- `supabase.auth.signUp` with all extra fields in `options.data`.
- Profile trigger inserts base fields; remaining fields written via a follow-up `update` on `profiles` once the session is created.

Google flow: after OAuth callback, if profile missing required fields → redirect to `/complete-profile` which renders steps 2-7 of the wizard.

## 5. Database migration
Add columns to `profiles` (nullable so existing rows unaffected):
- `origin_country, origin_state, origin_city`
- `residence_country, residence_state, residence_city`
- `date_joined_month`, `date_joined_year`, `date_joined_day` (smallint nullable), `date_joined_approx` (boolean)
- `employment_status` text, `employer_name` text
- `is_student` boolean, `school` text, `course` text, `level` text
- `academic_background` text, `graduation_year` smallint
- `profile_completed` boolean default false

Update `handle_new_user()` to also map any of these fields if present in `raw_user_meta_data`. RLS unchanged (already allows users to update own profile).

## 6. Complete-profile page (`src/pages/CompleteProfile.tsx`)
Protected route. Renders SignupWizard in "complete" mode (skips email/password steps). Redirects to `/dashboard` on completion. Used by Google signups and any account where `profile_completed = false`.

Add a check in `App.tsx` ProtectedRoute: if logged in & `profile_completed=false` & path != `/complete-profile` → redirect.

## 7. Branding/contact constants
New `src/config/contact.ts` exporting email, phones, socials. Used in Landing footer + Auth footer.

## Technical notes
- Floating "10" uses `requestAnimationFrame`, position state in ref to avoid re-renders; collision = invert vx/vy.
- Countdown target = `2026-05-31T00:00:00`. Recompute every second with `setInterval`.
- All animations CSS-based or RAF; no new heavy libs.
- New deps: none required (country-state-city, zod, react-hook-form already present).

## Files
- New: `src/pages/Landing.tsx`, `src/pages/CompleteProfile.tsx`, `src/components/SignupWizard.tsx`, `src/components/FloatingAnniversaryLogo.tsx`, `src/components/CountdownTimer.tsx`, `src/config/contact.ts`
- Edit: `src/App.tsx`, `src/pages/Auth.tsx`, `src/hooks/useAuth.tsx` (add `signInWithGoogle`, expose `profileCompleted`), `src/index.css`, `tailwind.config.ts`
- Migration: add profile columns + update trigger
