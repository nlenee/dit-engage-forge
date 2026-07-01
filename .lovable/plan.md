# Plan — Offices, Access Control & Applicant Meeting Scheduler

## 1. Reassign bug — DONE
`application_reviews.insert` was receiving `new_faction` (not a column). Now only valid columns are written; `final_faction` is patched on `applications` as before.

## 2. Executive Board panel (Admin dashboard)
New card on `/admin` listing every leadership seat with occupant + access summary.

Seats shown:
- Chief Executive Director
- Executive Secretary
- Community Manager
- Chief Finance Officer
- Financial Controller (new)
- Executive Director — per faction (SHI, DYP, TECK, MindUp)
- Executive Assistant — per faction
- Any custom office created via section 3

Data source: `user_roles` + `profiles` + new `offices` table.

## 3. Offices & dynamic access control

### New tables
- `offices` — `id, code (slug), title, description, kpis (jsonb), faction (nullable), created_by`
- `office_permissions` — `office_id, permission_key` (e.g. `applications.review`, `finance.view`, `letters.create`, `directory.manage`, `announcements.publish`, `members.manage`, `admin.settings`)
- `office_assignments` — `office_id, user_id, assigned_at, assigned_by` (unique on `office_id,user_id`)

All with GRANTs + RLS (admin/CED/ES full; others read-only for their own).

### Permission model
Central catalog `PERMISSION_KEYS` in `src/lib/permissions.ts` (source of truth used by routes + UI).
New RPC `user_permissions(_user_id uuid) returns text[]` = union of built-in role permissions **and** permissions granted via any office the user occupies.
`useAuth` exposes `permissions: Set<string>` and `hasPermission(key)`.
`ProtectedRoute` accepts `requiredPermission` and gates by that instead of hard-coded roles. Existing role checks preserved as fallback so nothing breaks.

### Admin UI — Offices Manager
`/admin` → "Offices & Access" tab:
- List of offices with occupant, faction, permissions.
- "Create Office" dialog: title, description, KPI bullets, faction (optional), permission checkboxes, member picker.
- "AI Assist" button → calls new edge function `office-assist` (Lovable AI Gateway, `google/gemini-3-flash-preview`) that takes a title + short intent and returns a suggested description, 3–6 KPIs, and a recommended permission set the admin can accept/edit.
- Edit / reassign / delete office.

### System recognition
Because routes gate on `requiredPermission`, any office created in the UI immediately grants its occupant the checked capabilities — no code change needed to "recognize" new roles.

## 4. Applicant meeting scheduler
On the application review drawer, new **"Schedule Meeting"** action:
- Dialog: date/time picker, duration, meeting link (Google Meet/Zoom URL), notes.
- Writes to existing `interviews` table (already present) and inserts an `application_reviews` row with action `interview_requested`.
- Updates application status to `interview_scheduled`.
- Calls new edge function `send-interview-invite` (Resend, existing `RESEND_API_KEY`) that emails the applicant with date/time/link/notes, branded template.
- Logs to `email_logs`.

## 5. Files touched (high level)

```
supabase/migrations/<new>.sql          offices + office_permissions + office_assignments + user_permissions RPC + GRANTs + RLS
supabase/functions/office-assist/       AI-assisted office draft
supabase/functions/send-interview-invite/  Resend email to applicant
src/lib/permissions.ts                  PERMISSION_KEYS catalog
src/hooks/useAuth.tsx                   load permissions, expose hasPermission
src/components/RouteAccess.tsx / App.tsx  requiredPermission gate
src/pages/AdminDashboard.tsx            Executive Board panel + Offices tab
src/components/admin/OfficesManager.tsx (new)
src/components/admin/CreateOfficeDialog.tsx (new)
src/components/applications/ScheduleInterviewDialog.tsx (new)
src/pages/applications/ApplicationsReviewPage.tsx  wire schedule button
```

## 6. What is intentionally NOT changed
- Existing role checks (`isAdmin`, `isCED`, etc.) stay — permissions are additive.
- No changes to Landing, member directory styling, XP system, birthday widgets, or existing dashboards.
- No auto-migration of current role holders — admin decides which offices to formalize.

## Approval
Approve to proceed and I'll ship the migration first, then the edge functions, then the UI.
