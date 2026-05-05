## v0.1.6 · May 5, 2026

**Clearer Protected-User Moderation Errors**

ModDeck now blocks obvious impossible moderation targets before calling Twitch and translates protected-user API failures into a clear explanation instead of showing Twitch's raw `user_id` field wording.

You can now tell when a ban, timeout, or warning failed because the target is the broadcaster, yourself, a moderator, or otherwise protected in that channel.

📄 app/api/twitch/ban/route.ts, app/api/twitch/timeout/route.ts, app/api/twitch/warn/route.ts, components/modals/BanModal.tsx, components/modals/TimeoutModal.tsx, components/modals/WarnModal.tsx, components/modals/moderation-errors.ts, lib/moderation.ts

---

## v0.1.4 · May 5, 2026

**Safer Channel-Scoped Controls And Trello Logs**

ModDeck now opens moderation modals against the channel you are actually working in, including actions launched from chat messages and chatter menus. Global chat-mode controls are hidden from the All Channels view so slow mode, emote-only, blocked terms, and similar settings can only be changed after selecting one channel.

You can now keep a Trello-backed ModDeck LOGS list updated automatically from every commit.

📄 app/dashboard/page.tsx, components/CenterPanel.tsx, components/LeftSidebar.tsx, components/RightSidebar.tsx, components/modals/*.tsx, .githooks/*, scripts/trello_desc.py

---
