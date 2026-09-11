# Sign-in fix, member messaging, mobile polish, app badge

## 1. Finish the sign-in fix (item 3)

- Approved applicants are created as fully usable members: all details copied over and the record marked complete, so they can sign in immediately.
- Anyone who signs in with genuinely missing details is sent to a short "finish your profile" step instead of being pushed back to the application form.
- The "not registered" message only appears for people who truly have no member record.

## 2. Member-to-member messaging

A new **Messages** area on every member's dashboard:

- Pick any registered member from a searchable list (name, faction, official title shown).
- Write a subject and message, send it.
- Inbox with unread badges, conversation view, reply, mark as read.
- Sent items list.

When a message is sent, DIT mail automatically emails the recipient:
"You have a message from {sender name}, {role in DIT} — check it up now" with a link to their dashboard messages.

## 3. Unread count on the installed app

- The dashboard shows a numbered badge on the Messages entry.
- The installed app icon shows the unread number (1, 2, 3…) using the browser app-badge feature, cleared when messages are read.
- Note: a number appearing while the app is fully closed needs push notifications (a separate Firebase setup). This step covers live/in-app badging; say the word and I'll add true background push after.

## 4. Mobile responsiveness pass

Across every page: dashboard, admin, community, finance, summary, applications, directory, profile, facecard, structure, landing.

- Header collapses into a slide-out menu on small screens; no cramped icon row.
- Tables become stacked cards on phones; no horizontal overflow or overlapping text.
- Dialogs, forms and toolbars sized for small screens with scrollable bodies.
- Consistent spacing/typography scale, safe-area padding, tap targets at least 44px.
- Verified at 320px, 375px, 414px, 768px, 1024px and desktop.

## Technical notes

- New `messages` table (sender, recipient, subject, body, read_at, parent_id) with RLS limiting reads to sender/recipient and inserts to authenticated members; GRANTs for `authenticated` and `service_role`.
- `src/hooks/useMessages.ts` + `src/components/messages/*`, mounted on `/dashboard` and a `/messages` route.
- Realtime subscription for live inbox/badge updates; `navigator.setAppBadge` / `clearAppBadge` behind feature detection.
- New `send-message-notification` edge function reusing the existing Gmail SMTP mailer, sender title resolved via the shared role labels.
