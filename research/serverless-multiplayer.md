# Serverless multiplayer for a static-site classroom game (research, Oct 2026)

Context: plain HTML/CSS/JS on GitHub Pages, no own backend, ~20–25 student laptops + 1 teacher laptop on a projector, Danish upper-secondary school Wi-Fi. Goals: 1v1 battles, class raids (shared boss HP), maybe trading.

Status: complete — see §6 for the ranked recommendation.

---

## 1. Serverless WebRTC with manual signalling (copy-paste / QR)

- Since 2019 Chrome (and later Edge/Firefox) replace private IPs in host ICE candidates with random `xxxx.local` mDNS hostnames that only resolve on the same LAN segment. Source: Chromium PSA, https://groups.google.com/g/discuss-webrtc/c/6stQXi72BEU/m/2FwZd24UAQAJ ; Mozilla bug 1554976, https://bugzilla.mozilla.org/show_bug.cgi?id=1554976
- Consequence: with no STUN server, the only candidates are mDNS host candidates. These work only if (a) mDNS multicast (UDP 5353, 224.0.0.251) is delivered between the two laptops and (b) peer-to-peer UDP is allowed on the WLAN. mDNS does not cross routers/VLANs, so on large segmented enterprise networks it fails. (Same PSA thread notes that in multi-segment enterprises STUN becomes necessary once mDNS is in use.)
- Adding a public STUN server (e.g. `stun:stun.l.google.com:19302`) yields srflx candidates; two laptops behind the same school NAT then need NAT hairpinning, or host candidates to work — not guaranteed.
- **Client (AP) isolation**: common default on education/guest SSIDs; blocks direct traffic between wireless clients on the same SSID even on the same VLAN, and also suppresses mDNS/device discovery. With isolation on, *no* direct P2P path exists; only a TURN relay works. Source (vendor guide on campus Wi-Fi): https://www.purple.ai/en-us/guides/university-campus-wifi-eduroam-residence-halls-and-byod-at-scale
- **UDP blocking**: some firewalls block outbound UDP except DNS; then even STUN fails and only TURN over TCP/TLS on 443 works.
- **TURN without a server of our own**: Cloudflare Realtime TURN has a free tier (1,000 GB/month combined SFU+TURN, then $0.05/GB) and offers TURN on TCP 443/80/3478 and TLS 5349 — https://developers.cloudflare.com/realtime/turn/ . BUT credentials must be minted with an API token: "You should keep your TURN key on the server side (don't share it with the browser/app)" — https://developers.cloudflare.com/realtime/turn/generate-credentials/ . Workaround without a backend: teacher runs one `curl` before class to mint short-TTL (e.g. 8 h) credentials and pastes them into the teacher screen / a share code. Game data volume is tiny (KB per battle), so cost is effectively zero. (Alternatively a Cloudflare Worker could mint them, but that is "server code".)
- **Verdict for manual copy-paste/QR signalling**: elegant and zero-dependency, but SDP offers are long (~1–3 KB even with trickle disabled), so QR codes are dense; each pairing needs a 2-way exchange (offer → answer) i.e. two scans; and success depends entirely on the Wi-Fi not isolating clients. Treat as "may work", must be tested once on the actual school SSID.

## 2. Libraries using public signalling infrastructure

### Trystero (https://github.com/dmotz/trystero)
- Strategies: Nostr (default; "hundreds of active relays"), MQTT (recommended second), BitTorrent trackers (third, "far less relay redundancy than Nostr"), IPFS, Supabase, Firebase, plus a self-hosted WebSocket relay option. Packages `@trystero-p2p/mqtt`, `@trystero-p2p/torrent`, `@trystero-p2p/supabase`, `@trystero-p2p/firebase`, etc.
- CDN without build step: `import {joinRoom} from 'https://esm.run/trystero'` inside `<script type="module">` (esm.run = jsDelivr). Works on GitHub Pages.
- Ships default public STUN servers; TURN can be passed via `turnConfig` (array of ICE server objects) or `rtcConfig.iceServers`.
- README warns browsers "can only handle a limited amount of WebRTC connections at a time" and recommends splitting users into rooms; Trystero rooms are a full mesh, so a 25-person room = 300 connections total and 24 per laptop — use small rooms (1v1) or a star topology instead.
- Reliability: signalling depends on third-party public relays/trackers you don't control (may rate-limit or be blocked by school web filters — WebSocket to `wss://` relays on 443 usually passes). Media/data still needs a direct P2P path → same AP-isolation risk as §1.
- Privacy: only room IDs/SDP pass through public relays; Trystero encrypts SDP with the room password option. No personal data stored.

### PeerJS (https://github.com/peers/peerjs, https://peerjs.com/)
- "Use our free cloud server or host your own PeerServer" (peerjs.com). The cloud server (0.peerjs.com) has no published SLA or limits in the docs; historically has had outages. Browser support Chrome/Edge 83+, Firefox 80+, Safari 15+.
- Same P2P path caveats; PeerJS by default uses a public STUN and does not ship a usable free TURN.

### y-webrtc (Yjs) (https://github.com/yjs/y-webrtc)
- Default public signalling servers were `wss://signaling.yjs.dev` and two Heroku apps; in Feb 2023 all three were reported unreachable and the issue was labelled "wontfix", i.e. users are expected to host their own signalling — https://github.com/yjs/y-webrtc/issues/43 . Same P2P/AP-isolation caveats; CRDT model is overkill for turn-based battles. **Not recommended.**

**Key point for §2**: these libraries remove the *signalling* server, not the need for a *network path*. If the school Wi-Fi isolates clients, every pure-P2P option fails unless a TURN relay is configured.

## 3. Hosted realtime backends with no server code (client-only SDKs)

These route all traffic through a cloud service over WSS/443, so **AP isolation and UDP blocking don't matter** — the most likely option to "just work" on school Wi-Fi (unless the web filter blocks the domain).

### Firebase Realtime Database (+ Anonymous Auth)
- Spark (free) plan: "The Spark plan limit on simultaneous connections is 100" (paid: 200,000); 1,000 writes/s — https://firebase.google.com/docs/database/usage/limits . 25–30 concurrent users is well within limits. (Spark storage/download caps — reportedly 1 GB stored, 10 GB/month downloaded — see https://firebase.google.com/pricing; not re-verified here.)
- Locations: us-central1, **europe-west1 (Belgium)** `DATABASE_NAME.europe-west1.firebasedatabase.app`, asia-southeast1. Location is chosen when the default database is created; *multiple* databases per project require Blaze — https://firebase.google.com/docs/database/locations . (Some 2026 blogs claim RTDB has no EU region — contradicted by the official doc.)
- Anonymous Auth works on Spark and needs no personal data; security rules can restrict writes to `/rooms/{code}` and validate shape. Firebase JS SDK loads from `https://www.gstatic.com/firebasejs/<ver>/firebase-app.js` as ES modules — no build step.
- GDPR: Google is a US company (CLOUD Act / Schrems II concerns persist even with EU region and the EU–US Data Privacy Framework). Mitigate by storing **no personal data**: random room codes, self-chosen nicknames (advise pseudonyms), auto-delete rooms after the lesson. Anonymous Auth still processes IP addresses → technically personal data; the school's DPO (databeskyttelsesrådgiver) may want a databehandleraftale/DPA. Firebase's DPA is accepted via the console.
- Firestore also usable, but RTDB is better for many small realtime updates (raid HP ticks); Firestore's free tier counts reads/writes (50k reads/20k writes per day) which a 25-player raid could burn quickly if poorly designed.

### Supabase Realtime (Broadcast / Presence)
- Free plan: 200 concurrent realtime connections, 100 messages/s, 20 presence messages/s, 2 M messages/month, broadcast payload 256 KB — https://supabase.com/docs/guides/realtime/limits , https://supabase.com/pricing
- Caveat: "Free projects are paused after 1 week of inactivity. Limit of 2 active projects." — a teacher would need to unpause in the dashboard before class (or keep alive).
- Broadcast + Presence channels need no tables and no server code; publishable anon key is safe to ship in client code. EU regions (Frankfurt, Stockholm, Ireland, London, Paris) selectable at project creation. Supabase is a US company with EU hosting on AWS; same DPA considerations, but with Broadcast nothing is persisted.
- CDN: `import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'`.
- Budget: a 25-player, 30-min raid at ~1 action/5 s = ~9k messages × fan-out to 26 receivers ≈ 230k delivered messages → a handful of raids per month fits in 2 M; throttle/aggregate on the host (teacher) to stay safe. 100 msg/s cap: batch boss-HP updates (e.g. 2×/s).



## 4. Fully offline / asynchronous designs (no network between students at all)

Only requirement: the game itself loads from GitHub Pages (and can be cached with a service worker so it even runs offline).

### 4a. Team codes and "ghost battles"
- Encode a team compactly: species id (1 byte), level (1 byte), 4 move ids, a few stat/IV bytes → ~10 bytes per creature, ~60 bytes for a 6-team, plus version byte and a checksum. Base64url/base32 gives ~80–100 characters: easy to paste in Teams/chat or show as a QR code (a QR at that size is low-density and scans reliably from a laptop webcam). `CompressionStream` is unnecessary at this size.
- Battles against a "ghost" = the opponent's team driven by the game's AI. Use a **deterministic seeded PRNG** (e.g. mulberry32/sfc32 — a few lines of JS; never `Math.random()`) and a pure `simulate(teamA, teamB, seed, aiPolicy)` function with integer maths only. Seed = hash of both team codes + date/round, so both students independently compute the identical result and can verify each other ("replay code").
- Live 1v1 with human choices each turn is impractical offline (each turn needs a message exchange), so ghost battles are the realistic offline 1v1. Tournaments: teacher collects team codes and runs a bracket on the projector — all battles simulate instantly and deterministically, nice to watch as replays.
- QR scanning in-browser: the native `BarcodeDetector` API is "Limited availability … not Baseline" (https://developer.mozilla.org/en-US/docs/Web/API/Barcode_Detection_API) and is not available in desktop Chrome on Windows (check https://caniuse.com/mdn-api_barcodedetector), so use a JS decoder from a CDN (e.g. jsQR or zxing-wasm via jsDelivr). Camera access needs HTTPS — GitHub Pages provides that. Copy-paste of text codes is the zero-hardware fallback.

### 4b. Asynchronous raid with the teacher projector as hub
- Projector page shows the boss, a **round seed** (short code, e.g. `K7Q-42`) and a timer.
- Each student enters the round seed; their own laptop simulates their team vs the boss for N turns (deterministic from round seed + team code) and outputs a short **damage code**: student number/nickname slot + damage + checksum keyed by the round seed (6–8 base32 chars). The keyed checksum stops casual faking/re-use from earlier rounds; it is not cryptographically secure (code is client-side), which is fine for a class game.
- Submission paths (no network): (1) students type their code into the projector laptop (25 × 8 chars ≈ 2–3 min, or a "boss counter" moment), (2) the teacher's webcam scans a QR on each student's screen as they walk past, or (3) a student reads it aloud. The projector page validates and subtracts from shared boss HP with animation. Multi-phase raids: the new phase reveals a new round seed.
- Fully deterministic means the teacher page could even re-simulate each student's attack from their team code instead of trusting a damage number (submit team code + seed → teacher computes damage). That is cheat-proof as long as team codes themselves are honest.

### 4c. Trading offline
- Naive "trade code" = duplication bug (code can be pasted twice). Mitigation: two-step handshake — A's game creates an offer bound to a random nonce; B's game returns an acceptance code that references the nonce; A's game then deletes the creature. Still beatable by editing localStorage, but adequate for a class. Or: make trading a teacher-mediated event on the projector.

## 5. Star topology with the teacher laptop as host

- Hard browser limit: Chrome throws "Failed to construct 'RTCPeerConnection': Cannot create so many PeerConnections" past a per-page cap (commonly reported as 500 in Chromium; older reports cite 256 — not verified against source here) — https://github.com/webtorrent/webtorrent/issues/1349 . 25 peers is far below the cap; data channels for small JSON messages are very cheap. Practical constraint is ICE setup time and network path, not CPU.
- So a star (teacher host = authoritative game state, 25 students each with 1 connection) is technically easy — *if* P2P paths exist (see §1 AP isolation). A full mesh (Trystero default with everyone in one room: 24 connections per laptop, 300 total) is the thing to avoid; use one room per raid but have students only talk to the host (Trystero `sendX(data, hostPeerId)`), or use a hosted backend channel where the teacher client acts as host.
- With Supabase Broadcast / Firebase RTDB the same star logic applies at the application level: students publish actions to the room, the teacher client is the only one that applies them and broadcasts boss HP. No network-path risk.

## 6. Recommendation

| Rank | Option | (a) Works on school Wi-Fi with zero IT | (b) Build effort | (c) Privacy |
|---|---|---|---|---|
| 1 | Offline team/damage codes + deterministic sim, projector as hub (§4) | ~100% (only needs the page to load) | Low–medium (sim needed anyway) | Best — nothing leaves the laptop |
| 2 | Hosted realtime over WSS/443: Supabase Broadcast/Presence (EU region) or Firebase RTDB europe-west1 + Anonymous Auth (§3) | High (~90%; fails only if domain filtered) | Low–medium (client SDK from CDN, room codes, teacher-as-host) | Medium — US provider, EU hosting, store no PII, ephemeral rooms; check with school DPO |
| 3 | Trystero (Nostr/MQTT) + Cloudflare TURN creds pasted by teacher (§1–2) | Medium–high (TURN on TCP/TLS 443 bypasses isolation) | Medium (+ credential ritual before class) | Good — data E2E-encrypted (DTLS), relays see only signalling |
| 4 | Trystero / PeerJS public signalling, STUN only | Unknown — fails entirely if AP/client isolation is on; must test on the real SSID | Low | Good |
| 5 | Manual copy-paste/QR SDP exchange | Same as 4, plus mDNS issues; worst UX (two scans per pair) | Medium | Best of the live options |

**Layered approach**
1. **Core (always works):** deterministic seeded battle engine + compact team codes → ghost battles, projector tournaments, async raid with damage codes typed/scanned into the teacher screen. Design every live feature so it degrades to this.
2. **Live enhancement:** one transport abstraction (`send/onMessage/roomCode`) with the teacher laptop as authoritative host. First implementation: Supabase Broadcast (EU region) — or Firebase RTDB europe-west1 — for live raids (shared HP bar updating in real time) and live 1v1. Remember Supabase free projects pause after 1 week idle.
3. **Optional P2P adapter:** Trystero behind the same interface; run a 5-minute test on the school SSID (two laptops, STUN only) to see whether client isolation is on. Add TURN only if needed.
4. **Privacy defaults:** pseudonymous nicknames, random room codes, no accounts, auto-expire rooms; collection lives in localStorage + exportable backup code.

Status: complete (Oct 2026). Items worth re-verifying on site: AP isolation on the school SSID; whether the school web filter blocks `*.supabase.co`, `*.firebasedatabase.app`, or Nostr relay domains.
