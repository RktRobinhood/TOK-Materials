# Future conditional expansion handoff

User requested a later conditional/trap expansion after the initial card batch. This folder is design and issue publication only. Existing 210 contracts, accepted art, game code, saves, recordings and other sessions' files are unchanged.

- [Backend specification](BACKEND-SPEC.md): actor/trigger menus, visible/concealed commitment, one-shot queue, privacy, AI, winner and policy gates. Published as [#148](https://github.com/RktRobinhood/TOK-Materials/issues/148), natively blocked by #109 and #123.
- [23 concepts](CONCEPTS.md) / [structured data](concepts.json): three per six Ways plus five Generic, published as [#149](https://github.com/RktRobinhood/TOK-Materials/issues/149), natively blocked by #148/#109/#123. Per-card Fate/Win/token/rearm policy gates remain explicit.
- [Content issue source](CONTENT-ISSUE.md) and [publication receipt](publication.json) preserve the handoff. Source publication/commit is owned by the main task; no runtime work has begun.

Run `node design/drafts/conditional-expansion-2026-10-13/prepare-concepts.mjs` from the game folder to regenerate the concept documents and validate counts, unique IDs/names/effects, bounded costs/menus and absence of collisions with the existing 210 IDs/names. Validation passed:23 = 6×3 +5. This is arithmetic/proposal validation, not engine testing or measured balance.

Next builder: respect the initial-set dependencies, settle relevant event/Fate/expiry/copy/Win/queue policies, then implement a small fixed face-up post-play slice at the authoritative battle action seam. Do not blindly release all23, invent conditional mono/mixed bonuses, replace the 210 or bypass plot-only acquisition. Keep the public deterministic environmental schedule public.

Future art/voice handoff: a shared trap back and armed/consumed marker, normal full-art frames/colour motifs, current card-play/reveal/block/axiom/defeat cues. Record final accepted requests in existing Stage13/voice-flow ledgers when the feature is picked up. No images, paid API calls, sounds or recordings were created here.

Applied workflow: `to-spec` synthesis/publication without an interview. Established GitHub tracker/labels were used; unrelated setup documents were not created. Test seam selection is a documented recommendation for future implementation, not a claim of a new teacher-approved engine policy.
