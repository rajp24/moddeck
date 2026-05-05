## v0.1.4 · May 5, 2026

**Safer Channel-Scoped Controls And Trello Logs**

ModDeck now opens moderation modals against the channel you are actually working in, including actions launched from chat messages and chatter menus. Global chat-mode controls are hidden from the All Channels view so slow mode, emote-only, blocked terms, and similar settings can only be changed after selecting one channel.

You can now keep a Trello-backed ModDeck LOGS list updated automatically from every commit.

📄 app/dashboard/page.tsx, components/CenterPanel.tsx, components/LeftSidebar.tsx, components/RightSidebar.tsx, components/modals/*.tsx, .githooks/*, scripts/trello_desc.py

---
