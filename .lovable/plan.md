# Reliable message links and group messaging

## What will change
- Make each email notification link to the exact platform message, not a generic mailbox URL.
- Preserve that destination through sign-in, then open it automatically after authentication.
- Detect when the browser is signed into the wrong account and offer a clear account switch instead of routing home.
- Replace blank or indefinite loading states with a fast, visible loading/error state and avoid full-page reloads during normal navigation.
- Let senders select multiple members and deliver a secured message and email alert to each recipient.
- Make the recipient picker use the complete approved-member directory so eligible members such as Blessing Akinpelu appear.

## Technical details
- Add a protected message deep-link route and safe `next` handling in the route guard and sign-in flow.
- Update notification email links to include the message and intended recipient IDs.
- Decouple recipient visibility from admin-only member-management access while keeping private fields hidden from ordinary members.
- Extend compose and sending for multiple recipients with clear failure feedback.
- Check offline navigation caching and authentication startup to prevent stale 404 or blank pages.

## Verification
- Test direct message links while signed out, signed into the recipient account, and signed into a different account.
- Test single and multi-recipient sends, member search, and direct opening on desktop and mobile.
- Confirm the live email function, build, runtime console, and navigation fallback are healthy.
