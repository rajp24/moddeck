## v0.1.11 · May 5, 2026

**Direct Channel Control Selector**

ModDeck now includes an explicit Control Channel dropdown in the left sidebar so chat-mode and blocked-term controls can be pointed at any channel you moderate instead of relying only on the top page selection.

You can now choose another channel directly before toggling slow mode, followers-only, sub-only, emote-only, unique chat, or blocked terms.

📄 app/dashboard/page.tsx, components/LeftSidebar.tsx

---

## v0.1.9 · May 5, 2026

**Moderator Ban Notice**

ModDeck now explains that Twitch does not allow banning or timing out moderators when Twitch rejects those moderation actions with a protected-user response.

You can now tell when a failed ban or timeout likely means the target is a mod and needs to be unmodded first.

📄 components/modals/moderation-errors.ts

---

## v0.1.7 · May 5, 2026

**Reliable Chat Mode Updates**

ModDeck now forwards Twitch chat-settings failures to the frontend instead of pretending the update succeeded, and the slow-mode toggle sends the correct payload when enabling or disabling slow mode.

You can now see whether Twitch accepted a slow-mode or chat-mode change for the selected channel, and the switch will roll back if Twitch rejects it.

📄 app/api/twitch/chat-settings/route.ts, components/LeftSidebar.tsx

---

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
