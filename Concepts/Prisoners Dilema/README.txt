PRISONER'S DILEMMA — CLASSROOM TEST BUILD

How to test
-----------
1. Open index.html directly in a modern browser, or
2. From this folder run: python -m http.server 8000
   Then open http://localhost:8000

What is in this build
---------------------
- Student wording: Stay Quiet / Snitch
- 5-round repeated Prisoner's Dilemma
- 4 opponents with different persistent behavioural strategies
- Custom opponent avatars
- Tutorial
- Mobile-first responsive layout
- Live sentence score rail
- Per-opponent local leaderboard saved in this browser/device
- Offline procedural interrogation/prison-style sound design

Leaderboard limitation
----------------------
The included leaderboard is deliberately DEVICE-LOCAL. A static browser page cannot auto-discover other students on Wi-Fi or cellular and share scores securely without some form of signalling/shared service.

For a whole-class live leaderboard, add a very small shared backend such as Firebase, Supabase, a Cloudflare Worker/D1 endpoint, or a teacher-hosted LAN service.
