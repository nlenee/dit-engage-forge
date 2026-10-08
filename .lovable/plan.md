# DIT OS 2.0 — Read-only audit and P0/P1 plan

No files, SQL, policies, functions or deployments were changed during this audit.

## 1. Build diagnostics: messaging and sign-in
- VERIFIED: the type check (`tsgo --noEmit -p tsconfig.app.json`) passes with zero errors. The build error log has no outstanding errors.
- VERIFIED: `src/pages/MessagesPage.tsx` has no duplicate imports (each import line is unique) and contains no `useEffect` at all, so there is no malformed effect.
- VERIFIED: the live-updates logic is in `src/hooks/useMessages.ts`. Each subscription now gets its own channel name, with cleanup through `removeChannel`. This was the fix for the earlier "cannot add postgres_changes after subscribe" crash.
- UNVERIFIED: how messaging behaves for a signed-in user at runtime. Automated signed-in checks still render a blank page because the test session isn't picked up.

## 2. Feature presence (VERIFIED in source)
- Letters: `pages/CreateLetter.tsx`, `components/LetterForm.tsx`, `LetterPreview.tsx`, `TemplateSelector.tsx`, `SignatureSelector.tsx`, `DigitalSealDialog.tsx`, `VersionHistory.tsx`, `hooks/useLetters.ts`.
- PDF: jsPDF/html2canvas in `CreateLetter.tsx` and `ExecutiveSummary.tsx`.
- Email: `EmailDialog.tsx`, `BulkEmailDialog.tsx`, `ScheduleEmailDialog.tsx`, `EmailCampaignManager.tsx`, `admin/ComposeEmailPanel.tsx`, `admin/MonthlyMessagePanel.tsx`. Backend functions include `send-letter-email`, `send-internal-email`, `process-scheduled-emails` and `send-message-notification`.
- Applications: `pages/applications/{ApplyPage, VolunteerPage, TrackPage, AppointPage, ApplicationsReviewPage, FactionFormsPage, AdminFormsPage}`, `components/applications/{ScheduleInterviewDialog, ShareLinkPanel}`. Backend functions include `approve-application`, `on-application-submit` and `send-application-letter`.

## 3. Navigation and role guards (VERIFIED)
```text
App.tsx (BrowserRouter > AuthProvider)
 ├─ PublicRoute    -> /auth (signed-in users are sent to /dashboard)
 ├─ SignedInRoute  -> /complete-profile
 ├─ ProtectedRoute -> requires a user and profile_completed, else /auth or /complete-profile
 └─ in-page guards -> RouteAccess.tsx (PageLoader / AccessDenied) using
                      useAuth: role flags + hasPermission/canAny (user_permissions RPC)
Header.tsx: responsive navigation, unread badge, role label (lib/roleLabels.ts)
```
- `useAuth.loading` stays true until roles are loaded, so guarded pages don't flash an access-denied screen.

## 4. Biggest UX and performance problems
1. All pages load up front, with no lazy loading in `src/App.tsx`. Heavy libraries (jsPDF, html2canvas, TipTap, background removal, GIF export) end up in the first download. (VERIFIED: no `lazy(` calls.)
2. Some page files are very large: `AdminDashboard.tsx` (28 KB), `CommunityManagerDashboard.tsx` (23 KB), `Landing.tsx` (20 KB), `CFODashboard.tsx` (19 KB). They are hard to maintain and slow to render.
3. `useMessages.ts` fetches every message the user can see, with no limit, and listens to the whole messages table. It should listen only for rows that involve the current user.
4. `useAuth.tsx` reloads the whole page when the session changes in another tab, and checks roles, profile and permissions one after another. This makes sign-in slower.
5. 53 backend security warnings remain open (a public extension and callable SECURITY DEFINER functions). UNVERIFIED whether any of them can actually be exploited.

## 5. GitHub sync
- VERIFIED: this workspace's code history lives in Lovable's internal storage. No GitHub remote shows up in the sandbox. That is normal, because GitHub sync runs on Lovable's side and wouldn't appear here.
- VERIFIED: commit `3859ad6` ("Add project README", 2026-10-07) exists here. It is **not** an ancestor of the current HEAD (`be887f9`), so the Lovable history has diverged or been rewritten since then.
- UNVERIFIED: whether GitHub sync is currently connected to `nlenee/dit-engage-forge`. Check this under + menu → GitHub.
- How to reconcile, without destroying anything:
  1. Confirm the GitHub connection points at that repo and the correct default branch.
  2. If sync is connected, make a small edit in Lovable so the current HEAD gets pushed.
  3. If GitHub has commits that Lovable lacks, clone the repo locally, create a backup branch, merge it into the default branch, and push. Lovable then pulls the result. Never force-push.
  4. If sync is disconnected, reconnect it. A full reconnect creates a new repo; to keep the old one, merge it manually as in step 3.

## 6. Prioritized safe plan (no destructive changes)
**P0**
- A. Scope the message listener to rows where the user is sender or recipient (two filtered listeners), and cap the message query at 200, newest first.
  Check: send a message between two accounts; the badge updates; no console errors.
- B. Investigate the 53 backend warnings and keep only intended public calls (read-only triage first, then targeted access revokes in a later approved step).
  Check: the warning count drops; sign-in, applying and the member directory still work.

**P1**
- C. Load pages lazily in `App.tsx` (React.lazy + Suspense using the existing `PageLoader`).
  Check: the build passes; every page still opens; the first download is smaller.
- D. Load the PDF, GIF and background-removal libraries only when their button is clicked.
  Check: PDF and facecard exports still work.
- E. In `useAuth.tsx`, run the profile and permission lookups at the same time, and replace the full-page reload with a session refresh.
  Check: sign-in by password and Google; admin pages show no access-denied flash.
- F. Fix the automated signed-in test so phone-size and messaging checks can run.

Validation for every step: type check, the build log, a Playwright check at 375 px and on desktop, and the console and network logs.
