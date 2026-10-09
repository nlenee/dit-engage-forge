# DIT OS 2.0 — Mobile regression and release checklist

Scope: authenticated Hybrid Executive workspace. Public website, public applications, anniversary, and official PDF content keep their distinct identities. The tests below must pass before publishing.

## Universal
- [ ] Sign in (including slow session restore), sign out, and profile completion redirect
- [ ] On 320px, 360px, 390px, tablet, desktop: no horizontal page overflow
- [ ] Bottom navigation never overlays form buttons, footers, charts, or modals
- [ ] Only one prominent page heading; drawer, breadcrumbs and active navigation work
- [ ] Keyboard focus, drawer dismissal, dialog closing, and back navigation are usable
- [ ] Loading/error/empty states never trap the user
- [ ] A member cannot access an unauthorized module by typing its URL

## People and organization
- [ ] Directory search/filter, long member names, roles, contacts and faction labels fit mobile
- [ ] Admin Members and Users cards: open detail, edit, role change, lock/unlock, and deletion confirmation
- [ ] Organizational Structure: all tiers and assignments shown; expandable permissions complete
- [ ] Offices: grant/assignment actions retained; permissions and KPIs expand
- [ ] Executive Board: appointments, occupants, permissions and factions retained
- [ ] Factions: create/edit and member assignment remain functional

## Communications and governance
- [ ] Inbox, Sent, compose, reply and unread counts display and update
- [ ] Letter editor: mobile Edit/Preview; draft save, version history, export PDF, send, schedule, seals
- [ ] Letter Management: mobile cards, status, navigation to letter; desktop table
- [ ] Application Reviews: list/review/actions, filters, applicant responses, interview, approval/rejection/transfer
- [ ] Registration URL and QR expand, copy and download correctly
- [ ] Email Logs: full details visible via mobile record, desktop table retained
- [ ] Templates: create/edit/delete and expanded preview
- [ ] Compose Email: recipient modes, count, scheduling, send, error/success feedback
- [ ] Monthly Messages: expand history, approval status, prepare/regenerate/send
- [ ] Campaigns and XP Reviews: accessible buttons and working decisions

## Operations and reporting
- [ ] Community events and engagement: create records, correct counts, status, mobile records
- [ ] Finance: transaction records, budget/fundraising flows, monetary amounts, permissions
- [ ] Admin Analytics: countries merged consistently, charts and legends readable
- [ ] Executive Summary: exported PDF still retains official layout and all counts
- [ ] Facecard: portrait upload and every export size unchanged; preview responsive
- [ ] Landing: DIT branding, Login, Apply to Join and hero usable at phone widths
- [ ] Anniversary Hub and public application portals still function independently

## Release gates
- [x] Code remains compatible with existing Supabase schema and permissions (no schema changes in UX batches)
- [ ] Current head TypeScript check, targeted lint and production build passed
- [ ] Authenticated mobile and desktop smoke testing performed
- [ ] At least one authorized admin, executive, finance, community, secretary and member role tested
- [ ] No unexpected data writes, no unauthorized exports/emails, and no loss of working workflows
- [ ] Lovable preview synchronized to reviewed GitHub commit
- [ ] Production publish explicitly verified after deployment

Note: Automated compilation is **not** evidence that authenticated journeys or PDF/email side effects have passed.
