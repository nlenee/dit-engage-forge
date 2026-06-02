# DIT Membership Application & Recruitment Pipeline

This is a large multi-system module. I'll build it in the order you specified, in **phased batches** so each phase is reviewable and testable before the next. Trying to ship all 14 phases in a single pass would produce unreviewable, error-prone code and exhaust context before the AI placement and dashboard work.

## Approach

- **No changes to existing tables.** All 12 new tables live alongside current schema.
- **Design system matched** to existing platform (Sora/Fraunces/JetBrains Mono, navy/sky/gold). I'll reuse existing tokens in `index.css` and add only what's missing.
- **RLS enforced** on every new table per the role matrix.
- **Public routes** (`/apply`, `/apply/:slug`, `/volunteer`, `/track`) bypass auth; admin/reviewer routes use existing `RouteAccess` guards.
- **Progressive save** keyed by applicant email in `localStorage` + a draft row.
- **QR codes** client-side via `qrcode` npm package (no external service).
- **AI placement** via existing Lovable AI Gateway (Gemini), not Anthropic — we already have `LOVABLE_API_KEY` configured and no Anthropic key. Same JSON contract.
- **Emails** reuse existing Gmail SMTP edge function pattern.

## Phased delivery

### Phase 1 — Foundation (this turn)
1. **Migration**: all 12 tables + enums + RLS + GRANTs + indexes + `applications.reference_number` auto-generator + helper functions (`has_faction_role`, etc.).
2. **Routing**: add all 7 new routes to `App.tsx` as stubs so navigation works.
3. **Seed**: insert default universal + 4 faction membership form templates into `form_templates`.

### Phase 2 — Applicant flows
4. Membership wizard `/apply` + `/apply/:factionSlug` (Steps 1–11, progressive save, faction pre-selection, faction-branded header).
5. Volunteer flow `/volunteer`.
6. Tracking portal `/track`.

### Phase 3 — Intelligence & reviewer tools
7. Edge function `on-application-submit` (AI placement via Lovable AI, acknowledgement email, reviewer notification).
8. Reviewer dashboard `/dashboard/applications` (3-panel, realtime, all review actions, interview scheduler modal).
9. Share Registration Link panel (copy + QR PNG download + campaign generator) — embedded in reviewer dashboard + form builder.

### Phase 4 — Builders & admin
10. Form builder `/faction/forms` + `/admin/forms` with question library.
11. Direct BoE appointment `/admin/appoint` (invite → registration → approve).
12. Admin controls (lock duration, notification recipients, AI toggle, link management).
13. Email templates for all 7 trigger points.
14. Dashboard widgets (notification badge + review queue) + profile onboarding progress.

## Technical notes

- New enums: `application_type`, `application_status`, `document_type`, `review_action`, `interview_channel`, `interview_outcome`, `form_type`, `question_type`, `notification_type`, `delivery_status`.
- `reference_number` generated via sequence + trigger in format `DIT-YYYY-XXXX`.
- `applications.application_count` on `application_links` incremented via trigger on `applications` insert when `ref_campaign` matches.
- AI placement: prompt unchanged in spirit; model swapped to `google/gemini-2.5-pro` with `response_format: json_object` (Anthropic would require user-supplied secret).
- Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;`
- New dep: `qrcode` (client-side QR generation).

## Confirmation needed

Reply **"go phase 1"** (or just "go") and I'll ship the migration + routes + seed in this turn. After you approve the migration and verify the stubs render, I'll proceed to Phase 2.

If you'd prefer Anthropic Claude specifically for AI placement instead of Lovable AI Gemini, say so and I'll request your `ANTHROPIC_API_KEY` before Phase 3.