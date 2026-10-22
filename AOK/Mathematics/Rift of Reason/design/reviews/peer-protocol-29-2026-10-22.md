# Live practice protocol — #29, 22 October 2026

**Issue remains open.** These are dormant classic match-core and ordered transport modules. Student UI, actual browser gameplay and QR/camera/device validation remain outstanding. Native connection evidence is in `peer-29-2026-10-22.md`.

## Information and authority

`Battle.PeerMatch` retains engine state on the host. Recipient views explicitly select public board/discard/rule/Fate records, the recipient's hand/Axioms, legitimately known opposing hand cards and still-held public Axioms. Concealed conditions remain backs; private pending menus/actions go only to their decider. Event strings follow `privateTo/publicText`; raw player records, deck order, hidden opponent hands, collection UIDs, structured private events, pending-source internals and the engine seed are omitted. Twelve recent allowed event strings accompany persistent scheduled effects and public Axiom knowledge. Unlimited activations use `uses: null, unlimitedUses: true` for JSON.

Moves select a legal-action index in a specific match/revision. The channel binding supplies sender identity. Stale, duplicate, foreign-match, malformed and out-of-turn requests are rejected; accepted actions use the canonical engine and increment revision.

Public match ID and private engine seed use **independent cryptographic random draws**. Review demonstrated that the draft's ID-derived seed allowed replay of a known starter to infer hidden hands. This was fixed before publication; the inference route is a regression test.

The host is a trusted classmate with full state and the guest's submitted deck. This design cannot authenticate remote collection ownership or prevent a modified host. Local loadouts pass canonical ownership checks; remote decks pass strict complete construction/copy/quota/lesson checks and are rejected rather than trimmed. The guest sends its existing team-code loadout to authority; the host never sends its private deck to the guest. No account or ownership service is added.

## Clock and transport policy

One monotonic host deadline gives the active turn 60 seconds, including draw and either player's required reactions. Actions never reset it. Expiry resolves mandatory menus with the first legal choice, takes the first legal draw if needed, then legally ends that same turn. A 128-step safety stop bounds pathological resolution. Background catch-up resolves one expired turn, then gives the next player a full minute. Every submission checks expiry before acceptance.

`Battle.PeerSession` sends views in ordered parts of at most 5,000 characters, at most 32 per board; each fits the 16,384-character transport cap even with JSON escaping. A bounded 128-message FIFO pauses when the adapter returns `false` for backpressure and resumes on `pump()`. `Peer.writable()` supplies that signal. Fatal opening/move/receive/pump send errors stop cleanly. An incomplete board gets three seconds; 15 seconds without the partner's heartbeat/input ends practice even if RTC remains open. Callers must pump regularly, bind native departure/failure and close on leaving.

Practice brings no adventure items and calls no save writer. Cards, coins, statistics and rewards never settle. Disconnect/retry cannot duplicate rewards or lose collection progress. A new connection starts a fresh practice match; broken matches are not saved resumable battles.

## Validation and limits

34 focused tests pass: 10 transport, 13 core and 11 session. Twelve complete legal core matches agree with the engine after every move. A full wire-driven match uses two canonical owned starter decks, ends consistently for both recipients and leaves saves byte-for-byte unchanged. These are simulated deliveries, not native browser gameplay evidence.

Coverage includes hidden identities/order, private events/menus, legitimate reveals, public Axiom duplicates after reset/log eviction, scheduled effects, private entropy, exact expiry, opponent reactions, background catch-up, corrupt/partial frames, resumable queued multipart delivery and native send errors for either player. Both independent reviews passed after fixing information retention, JSON Infinity, private entropy and backpressure cleanup.

Full tracked suite plus both new files: **1,471 total / 1,470 passed / 1 skipped / 0 failed**, 444 seconds. Unrelated unfinished Mending tests and OneDrive duplicates were excluded. No voice quota used.

Next: student UI, a complete native browser match, authoritative visible clock/leave/retry/save stability, QR and fallback checks, phone-width keyboard controls. Disclose untested physical phone/camera/browser-product/classroom-network cases. Do not close #29 on module evidence alone.
