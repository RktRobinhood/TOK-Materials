# Draw Steel (MCDM) and Disco Elysium: borrowable non-combat mechanics

Research for Rift of Reason (IB TOK maths/logic game). Mechanics only: no names, art or text are borrowed. All summaries are in my own words; source URLs are given per section.

Status: complete (8 October 2026). Part 1: Draw Steel negotiation, montage tests, respite and projects. Part 2: Disco Elysium checks, voices and Thought Cabinet. Part 3: adaptation notes and recommendations for Rift of Reason.

## Sources at a glance

- Draw Steel rules are read from **The Steel Compendium** (steelcompendium.io), an independent rules site published under the DRAW STEEL Creator License, reproducing *Draw Steel: Heroes* (printing 1.01b). It is not MCDM itself but is the most complete public rules text found; MCDM's Creator License allows use of the rules text. Edge cases should be checked against the printed book.
- Disco Elysium sources are listed in Part 2.

---

# Part 1: Draw Steel (MCDM, 2025)

## 1.1 Negotiation

Source: https://steelcompendium.io/v2/Read/heroes/negotiation/ (Draw Steel: Heroes, ch. 11)

### When it is used
- For important scenes where the heroes want a named NPC to do something that could change the adventure.
- The NPC must be **torn**: they have some reason to help and some reason to refuse. If they would simply agree, no negotiation is needed.
- Negotiation cannot change who the NPC is. Threatening violence is not negotiating; it leaves the system (and any agreement under threat is only temporary).
- The heroes can walk away at any time.

### The two tracks
| Track | Range | What it means |
|---|---|---|
| **Interest** | 0 to 5 | How willing the NPC is. 5 = final, best offer and the scene ends. 0 = NPC ends talks with no deal. |
| **Patience** | 0 to 5 | How many more arguments the NPC will listen to. Almost every argument costs 1. At 0 the NPC makes a final offer at the current Interest. |

Starting values come from the NPC's attitude:

| Attitude | Interest | Patience |
|---|---|---|
| Hostile | 1 | 2 |
| Suspicious | 2 | 2 |
| Neutral | 2 | 3 |
| Open | 3 | 3 |
| Friendly | 3 | 4 |
| Trusting | 3 | 5 |

Speaking the NPC's own language gives +1 Patience (one hero) or +2 (three or more heroes), max 5. Renown can give an edge on certain argument styles (admired heroes on persuading/leading; feared heroes on intimidating/bragging) if the NPC knows the hero and the hero's renown is at least the NPC's "Impression" score (1 = commoner up to 12 = deity).

### Motivations and pitfalls
- Each NPC has **at least two motivations** and **at least one pitfall** (often two).
- There are 12 types: Benevolence, Discovery, Freedom, Greed, Higher Authority, Justice, Legacy, Peace, Power, Protection, Revelry, Vengeance.
- Each pitfall is the *opposite stance* to a motivation (e.g. Greed as a pitfall = someone offended by being bought; Higher Authority as a pitfall = someone who refuses to serve anyone). One NPC's motivation can be another NPC's pitfall.
- **Each motivation can be successfully used only once per negotiation.**

### Making an argument (the core loop)
An argument must give a reason, not just a demand. If it is half an argument, the NPC asks a follow-up ("Why do you think that's true?"). One hero speaks per argument; players can discuss first. There are five cases:

| Case | Roll | Interest | Patience |
|---|---|---|---|
| **A. Appeals to an unused motivation, no pitfall** | medium test: low (11 or less) / middle (12 to 16) / high (17+) | 0 / +1 / +1 | -1 / -1 / 0 |
| **B. Appeals to a motivation already used** | no roll | 0 | -1 |
| **C. No motivation, no pitfall** (a plain argument) | harder test: low / middle / high | -1 / 0 / +1 | -1 / -1 / -1 |
| **D. Touches a pitfall** | automatic failure | -1 | -1 |
| **E. Caught lying** (a lie that failed) | extra penalty | -1 more | as above |

Notes: a really well-made or well-roleplayed motivation argument can be awarded the best result without rolling. Repeating the same plain argument automatically gets the worst result. After a pitfall the NPC may warn the heroes not to try that again.

### NPC responses (feedback)
The NPC always signals which way the argument went, so players learn:
- **Positive** (Interest went up): a "fair enough" type of reply.
- **Negative** (Interest went down): a "that won't move me" type of reply.
- **Impatient** (no change): an "I've heard that already" type of reply.

### Discovering motivations and pitfalls
- **Just ask** what the NPC wants. They may hint at a motivation, often by asking for something. At Interest 3+ the Director may simply reveal one.
- **Read them** with a test: low = nothing learned and the NPC gets annoyed (-1 Patience); middle = nothing; high = learn one motivation *or* pitfall (player's choice). Only one read is allowed between arguments.
- **Prepare beforehand**: research and scouting (reading a diary, asking friends) can reveal them before talks start.

### What each Interest level yields (the offer table)
| Interest | Reply | Offer |
|---|---|---|
| 5 | "Yes, and..." | Everything asked, plus a bonus (waives the heroes' side of the deal or adds an extra). Final; scene ends. |
| 4 | "Yes." | Everything asked, on the heroes' terms. Usually ends. |
| 3 | "Yes, but..." | Gives what was asked, but wants something extra in return (favour, payment). |
| 2 | "No, but..." | Refuses the main request, offers something smaller. |
| 1 | "No." | Refuses, no counteroffer. |
| 0 | "No, and..." | Refuses, ends talks, and may act against the heroes. |

### How it ends
- Interest 1 to 4 with Patience left: make another argument, or accept the current offer. The Director can ask "anything else?" to show Patience remains.
- Patience reaches 0, or Interest reaches 5: the current offer is final. Accept or decline; talks end.
- Interest reaches 0: no deal.

### Worked example in the book (paraphrased)
An NPC starts at Interest 2, Patience 4, with motivations Benevolence and Protection, pitfalls Higher Authority and Revelry. An appeal to authority (a pitfall) drops her to 1/3. A reasoned appeal to Protection raises her to 2/2. An appeal to Benevolence brings her to 3/1, so she gives a "Yes, but..." deal. Three arguments, one mistake recovered: a compact, readable scene.

### Why this is borrowable
It is a tiny state machine (two counters, a hidden list of tags, a fixed table of outcomes). Every choice gives instant, legible feedback. Discovering the hidden tags is itself a mini puzzle, and spending Patience to learn them is a real trade-off.

## 1.2 Montage tests

Source: https://steelcompendium.io/v2/Read/heroes/tests/ (Draw Steel: Heroes, ch. 9, "Montage Tests" and the test outcome table)

### Background: how one test resolves
Roll 2d10 + characteristic (+2 with a relevant skill). Results fall in three tiers, read differently by difficulty:

| Roll | Easy | Medium | Hard |
|---|---|---|---|
| 11 or less | success, with a cost | failure | failure, with a cost |
| 12 to 16 | success | success, with a cost | failure |
| 17+ | success, with a bonus | success | success |

A natural 19 or 20 is always a success with a bonus. Assisting: a helper rolls too; a low roll hurts (bane), middle gives an edge, high gives a double edge.

### What a montage is
- A group effort over hours or days toward one shared goal that needs several different abilities (crossing a desert, rallying villagers, performing a ritual).
- Only for goals with **stakes and pressure** (a deadline, approaching harm), not ordinary travel.
- Can be interrupted by a fight or a negotiation and then resume.

### Structure
- **Rounds.** Each hero takes one turn per round: make a test, assist someone, use an item or ability, or pass. Nobody acts twice until everyone has acted.
- **Two rounds by default.** If neither limit is hit after round two, the montage ends anyway (the Director may extend a gruelling one).
- **New obstacle every test.** Each test is narrated as a fresh problem on the way to the goal (with recurring hazards as an exception). The Director can add new obstacles mid-montage.
- **No repeating your own skill.** A hero cannot use the same skill twice in one montage (different heroes can share one).
- **Clever ideas** can earn automatic successes (the book's example: a magic item that keeps a ship's sails full earns 2).
- **Individual costs and bonuses.** Each roll's "cost" or "bonus" is applied to that hero (default cost: the enemy starts the next fight stronger; default bonus: a hero token). Individual results should never stop the story.

### Success and failure limits (five heroes)
| Difficulty | Successes needed | Failures allowed |
|---|---|---|
| Easy | 5 | 5 |
| Moderate | 6 | 4 |
| Hard | 7 | 3 |

Fewer heroes: subtract 1 from both limits per missing hero (minimum 2). More heroes: add 1 per extra hero. The Director may keep the limits hidden or show them.

### Outcomes
| Outcome | Condition | Reward |
|---|---|---|
| **Total success** | success limit reached first | 1 Victory (easy/moderate), 2 (hard) |
| **Partial success** | failure limit reached, or time runs out, with **at least 2 more successes than failures** | 1 Victory on moderate/hard; nothing on easy |
| **Total failure** | failure limit or time out, without that +2 margin | no Victory; the story gets harder (not a game over) |

(Victories are Draw Steel's XP-like reward that also powers heroes in the next fight.)

### Book example (paraphrased)
Four heroes race across a desert to warn a city: hard montage, so 6 successes / 2 failures. Round 1 gives 3 successes and 1 failure (one success comes with a cost, one with a bonus that helps the next hero). A monster fight interrupts. Round 2 brings the total to 6 successes: total success, 2 Victories.

### Why this is borrowable
It turns "getting from A to B" into a short sequence of different mini-challenges with a visible progress bar (successes vs. failures), a hard cap on length (two rounds), and a soft fail state (partial success). The "no repeating your skill" rule forces variety.

## 1.3 Respite, downtime and projects

Sources: https://steelcompendium.io/v2/Read/heroes/the-basics/ (Respite, Victories, Hero tokens) and https://steelcompendium.io/v2/Read/heroes/downtime-projects/ (Draw Steel: Heroes, ch. 12)

### Respite (the "rest between adventures" beat)
- **24 uninterrupted hours** in a safe place, doing nothing but resting and recovering (an ordinary night's sleep does not count). If danger interrupts, the benefits are lost.
- Heroes regain all Stamina and Recoveries.
- **Victories convert to XP** and reset to 0. (Victories are earned by winning fights *or* major non-combat challenges, e.g. a montage or a negotiation.)
- Each hero gets **one respite activity**: e.g. one project roll, or swapping equipment kit. Respites can be chained to do more activities, but the villains keep moving while the heroes rest (a built-in time-pressure dial).

### Projects: the core mechanic
- **Project goal** = the number of project points needed to finish.
- **Project roll** = a roll with no success/failure tiers: the **whole total becomes project points** (minimum 1). So every attempt makes progress; only the speed varies.
- Edges/banes: +2 / +4 or -2 / -4 to the total.
- **Breakthrough**: a natural 19 or 20 lets the hero roll again for the same project in the same respite.
- Heroes can have many projects open but work on only one per respite. **Other heroes can spend their activity to roll for your project** (shared progress).
- **Prerequisites**: some projects need an item ("item prerequisite") and a **project source** (a book, tutor, schematic, master) to start and to roll. If the hero does not know the source's language: bane (related language) or double bane (unknown).
- **Guides**: studying a special guide (a manual, a mentor) instantly adds a fixed number of points.
- **Project events** (optional): random (d6, on a 6) or at milestones (none for goal 30 or less; 1 at halfway for 31 to 200; 2 for 201 to 999; 3 for 1,000+). Events are small story moments that can help or hinder.

### Kinds of projects and typical goals
| Category | Examples (goal in points) |
|---|---|
| **Crafting** | Craft a treasure (goal per item); Imbue a weapon/armour (150 per enhancement); Find a cure (50 x the level of the creature that caused it); Build/repair a road (10 per mile); Build a teleport platform (1,500); Build an airship (3,000) |
| **Research** | Discover lore: common 15, obscure 45, lost 120, forbidden 240; Go undercover (15, with a rising chance of being caught); Hone career skills (240 or 360); Learn from a master (120 / 500 / 1,000) |
| **Other** | Learn a language (120); Learn a skill (120); Perfect a recipe (100, gives a small buff each respite); Community service (75, random consumable reward); Spend time with loved ones (60, temporary max Stamina boost); Fishing (points spent like currency on small rewards: meals 50/100, better tackle 120, event 200, reroll 300) |

Since a typical roll is roughly 10 to 20 points, a goal of 15 takes one respite, 120 takes about 8, and 1,000+ is a campaign-long ambition.

### Why this is borrowable
"Every attempt adds progress, the roll just sets the speed" removes fail-states from downtime. The visible progress bar towards a named goal, the option of friends chipping in, and small lore unlocks (15 / 45 / 120 / 240) map neatly onto short between-lesson visits.

---

# Part 2: Disco Elysium (ZA/UM, 2019; Final Cut 2021)

Sources:
- [W] Wikipedia, gameplay and development: https://en.wikipedia.org/wiki/Disco_Elysium
- [G] Disco Elysium Wiki (wiki.gg, the community's maintained wiki), Skills: https://discoelysium.wiki.gg/wiki/Skills and Thoughts: https://discoelysium.wiki.gg/wiki/Thoughts
- [L] Let's Play Archive walkthrough explaining check UI: https://lparchive.org/Disco-Elysium/Update%2001/
- [B] GameBanshee round-up quoting developers (Jump Dash Roll preview, Oct 2019): https://www.gamebanshee.com/39r8d
- [S] Shacknews, "How the Thought Cabinet works": https://shacknews.com/article/114772/how-the-thought-cabinet-works-in-disco-elysium

## 2.1 Skills as inner voices

- 24 skills in 4 attributes of 6 (intellect, psyche, physique, motorics). There is no combat; problems are solved by dialogue and checks. [W][G]
- **Each skill is a character in the hero's head** with its own personality and opinions. Skills banter with each other, give each other nicknames, and argue with the player. [G]
- **How they appear on screen**: a skill's line appears in the dialogue log like an NPC's line, labelled with the skill's name and, for a check, the difficulty and result (e.g. "[Medium: Success]"). They interleave with the real conversation. [L]
- **The more points in a skill, the more it talks.** Around level 4 a skill starts speaking up noticeably. [G] So a player's build literally changes who is in their head.
- Three extra "deep brain" voices cannot be levelled and mostly speak in sleep or unconsciousness. [G]
- In The Final Cut, all 24 skill voices are performed by a single narrator, which reinforces that they are all *you*. [G]

## 2.2 Passive checks (skills interjecting)

- No dice. Pass if **skill level + modifiers + 6 is at least the difficulty**. [G][L]
- Difficulty ladder (total needed): Trivial 6 to 7, Easy 8 to 9, Medium 10 to 11, Challenging 12, Formidable 13, Legendary 14, Heroic 15, Godly 16, Impossible 17 to 20. [G]
- A passed passive check makes the skill pipe up with an observation, a memory, an idea, or a new dialogue option. Most add flavour and lore and are not needed for the plot. [G][L]
- The game contains over 10,000 passive checks; Empathy has the most (about 900). [G]
- **Anti-passive checks** (about 200): if a skill is too *low*, something bad happens instead (lost morale or health). [G]
- Early in development they were called "black checks": inner impulses the player may follow or ignore. [G]

## 2.3 Active checks (white and red)

- The player chooses to attempt a check from the dialogue options. Roll **2d6 + skill + modifiers** against the difficulty (Easy 8 up to Impossible 20). Double 1 always fails; double 6 always succeeds (so there is always at least a 1-in-36 chance either way). [G][L]
- **The success chance is shown as a percentage before you commit** (hover the option), along with a list of modifiers. Modifiers come from things you did earlier: evidence found, a related dialogue choice, clothing, thoughts, substances. The example in [L]: a +3 bonus because the player had earlier stopped a ceiling fan. White checks can carry up to about ten modifiers. [G][L]
- **White checks: retryable.** After failing, the option stays visible but locked. It reopens when you put a new skill point into that skill, or sometimes after another event or after time passes. Gear and thoughts do not count as "new". [G]
- **Red checks: one shot.** They cannot be retried; the result is permanent and shapes the story. Failure does not end the game and sometimes leads to a *better* scene than success. [G]
- Design intent: failure is meant to be interesting, not a dead end. The writers drew on tabletop sessions that "failed in interesting ways"; one rejected tagline called it a game about being a total failure. [W] A mistake should change how you later feel and respond (embarrassment, regret) rather than lock content. [B]

## 2.4 Skills giving bad advice

- High skills have personality quirks: a high lying/acting skill spots lies but drifts into paranoia; a high body-chemistry skill resists drugs but nudges you towards using them. [W]
- Developers describe the skills as being like a stray urge (a craving for a cigarette): it is a thought, not a wise one, so skills can and do give bad advice. The designers called "whether to trust your own skills" one of the biggest puzzles in the game. [B]
- Skills have egos: if ignored, some react; a failed attempt at manipulation can make that skill take over and push the hero into unwanted actions. [B]
- Character archetypes hint at trade-offs: a very sensitive build is "unstable", a very physical one is unintelligent. [G]
- So every skill is both a **lens** (it notices things others do not) and a **bias** (it over-reads the world through its own interest). This is directly a TOK point.

## 2.5 The Thought Cabinet

- Ideas picked up in dialogue or from inner monologue become **Thoughts** stored in a cabinet. They do nothing until the player chooses to **internalise** one in a free slot. [W][S]
- Start with **3 slots**, up to **12**; each extra slot costs a skill point. [S]
- **Internalising takes in-game time** (from about half an hour to a few days, only while awake and while time passes in dialogue/exploration). [S]
- While researching, a thought often has a **"problem"**: a temporary penalty (e.g. -1 to a skill). When finished it gives a **"solution"**: a permanent bonus, a new ability or new dialogue options, sometimes with a lasting drawback. [W][S]
- Forgetting a finished thought costs a skill point and you lose its bonus. [W][S]
- About 53 thoughts exist, some mutually exclusive. Some are deliberate traps. [S]
- Wikipedia's example: a thought about living rough to save money makes the hero worse with people while being researched, and then doubles money from collecting bottles. [W]
- Design point: it is the player choosing which **beliefs** to adopt, paying a cost while "thinking it over", and living with the result.

## 2.6 Why this is borrowable

| Mechanic | What it gives a learning game |
|---|---|
| Passive interjections | Free hints and flavour without menus; the avatar's Way of Knowing "notices" things |
| Percent chance + listed modifiers | Shows how *earlier* evidence-gathering changes the odds; a natural probability lesson |
| White (retry later) vs red (one shot) | Low-stakes practice vs a few memorable, high-stakes moments |
| Voices that can mislead | A built-in "check your source" habit: the helpful voice is also a bias |
| Thought Cabinet | Beliefs as items: adopt one, pay a short cost while it settles, gain a lasting perk |

---

# Part 3: Adaptation notes for Rift of Reason

These notes fit the plan in `AOK/Mathematics/Rift of Reason/design/AVATARS.md` (section 2: inner voice, avatar-only options, talk encounters). Design rules used throughout: mouse only, short plain English, every encounter 2 to 5 minutes, **no dead ends** (a bad result changes the route, never blocks it), and any chance shown as an **honest percentage** (lesson 4 is about probability, so the numbers on screen must be true).

Simplifications vs. the sources: no 2d10 tests and no skill levels. Where Draw Steel rolls dice, we either make the outcome certain (the puzzle is choosing well) or show a percentage and roll once.

## 3.1 (a) Negotiation: "Win them over" (chapter 3)

**Where:** Tomorrowton, before the Tribunal. A caricature witness holds a piece of evidence the player needs in court (e.g. the video clip). Talking them into handing it over is a negotiation. One per visit to a few nodes (newsstand, cafe, archive); the chapter 3 boss's case can use evidence won here.

**Screen:** the caricature's card in the centre. Above it, an **Interest** bar of 5 hearts-or-stars (start lit to 2) and a row of **Patience** hourglasses (3 by default). Below it, 2 or 3 face-down **"Cares about"** tags and 1 or 2 face-down **"Can't stand"** tags. The player's hand is 5 or 6 **argument cards**, each one short sentence plus an icon showing what it appeals to. Click a card to say it. Each card can be used once.

**Motivations, simplified to six pairs** (Draw Steel's 12, folded so each pitfall is the opposite of a motivation, as in the source):

| Cares about (motivation) | Can't stand (its opposite as a pitfall) | TOK link |
|---|---|---|
| **Facts** ("show me the data") | "Fact-checkers are boring/elitist" | evidence as justification |
| **Fame** (likes, followers, being seen) | "The crowd is always wrong" (a contrarian) | appeal to popularity |
| **Fairness** (rules for everyone) | "Winners make the rules" | ethics, justice |
| **Safety** (protect my people) | "Risk is fun" | weighing consequences |
| **Experts** (respect authority, tradition) | "Nobody tells me what to do" | appeal to authority |
| **Profit** (what do I get?) | "You can't buy me" | self-interest vs truth |

**What each argument does** (from Draw Steel cases A to E, made deterministic):

| You play | Interest | Patience | NPC reply (feedback) |
|---|---|---|---|
| A card that hits an unused "Cares about" | +1 | -1 (0 if the card is also a *sound* argument, see below) | positive ("Hm, fair point.") |
| A card that hits a "Cares about" already used | 0 | -1 | impatient ("You said that already.") |
| A card that hits nothing (a plain argument) | shown chance: **50%** +1, otherwise -1 | -1 | positive or negative |
| A card that hits a "Can't stand" | -1 | -1 | negative + warning ("Don't go there.") |

**Finding out what they care about** (Draw Steel's three ways):
1. **Ask** button: "What do you want out of this?" Costs 1 Patience, flips one "Cares about" tag.
2. **Prepare on the map:** talking to the NPC's friends at nearby nodes flips tags *before* the negotiation starts (Draw Steel's "research beforehand"). This rewards exploring the fogged map.
3. **Your inner voice** flips one tag for free at the start, in its own style (see 3.4). It is right about the tag, but on one negotiation per chapter it is confidently wrong (its blind spot): a deliberate lesson in checking.

**The extra argument from the avatar's Way of Knowing.** Each avatar gets one special card that no one else has. It counts as hitting **any one** unused "Cares about" whose icon matches its list, but each also has one personality that hates it (its blind spot as a pitfall):

| Avatar | Special card | Counts as | Backfires on (pitfall) |
|---|---|---|---|
| Owlet (Reason) | **Spell it out**: a short if-then chain | Facts or Fairness | Fame-chasers ("Boring!") |
| Moth-kin (Sense perception) | **Look for yourself**: point at a detail they can see | Facts or Safety | "Fact-checkers are elitist" types |
| Fox kit (Imagination) | **Picture this**: a what-if scenario | Fame or Safety | Facts-only types ("That's a fairy tale.") |
| Frogling (Memory) | **Remember when**: a precedent from earlier in the game (uses a real flag from the save) | Experts or Fairness | "Nobody tells me what to do" types |
| Raven chick (Language) | **Reframe**: redefine the key word | Profit or Fame | Experts ("Don't play word games.") |

**Sound or slick? The TOK twist.** Every argument card also carries a small badge: **sound** (a fair reason) or **slick** (a fallacy: popularity, false authority, false choice, scare tactic). Slick cards persuade caricatures just as well; they *are* made of fallacies. Sound cards cost no Patience when they hit. At the end the result screen shows "You persuaded them" *and* "Was your argument good?" (number of sound vs slick cards). In the Tribunal, evidence won with slick arguments can be challenged by the prosecutor (one extra Press needed). This makes chapter 3's core idea playable: **persuading someone and showing something is true are different things**.

**Outcomes** (Draw Steel's table, rewritten so nothing blocks progress):

| Interest at the end | Reply | Result in our game |
|---|---|---|
| 5 | "Yes, and..." | Evidence + a bonus (a rare catch item or the caricature offers to join your team) |
| 4 | "Yes." | The evidence |
| 3 | "Yes, but..." | The evidence, plus a favour to do (a side-node opens on the map) |
| 2 | "No, but..." | A weaker clue (counts as a hint in the trial) |
| 1 | "No." | Nothing now; can try again on a later visit (a "white check") |
| 0 | "No, and..." | They tip off the prosecutor: the trial starts with one less health. Still winnable. |

Ends when Interest hits 5 or 0, Patience hits 0 (final offer), or the player clicks **Take the deal** at any time.

**Numbers for a 3 to 4 minute scene:** start Interest 2, Patience 3 (a "neutral" NPC); suspicious NPCs start 2/2, friendly 3/4. Two "Cares about" tags, one "Can't stand". Hand of 5 cards: 2 match, 1 is the pitfall, 2 are plain. With the free inner-voice tag, a careful student reaches 4 to 5 in three or four plays; a careless one ends around 2.

**Data sketch:**
```js
{ id: 'neg-newsstand', npc: 'creature/xyz', want: 'evidence-video',
  start: { interest: 2, patience: 3 },
  cares: ['fame', 'safety'], cantStand: ['facts'],
  cards: [ { text: 'Everyone will see you helped.', appeal: 'fame', sound: false },
           { text: 'Without this clip, someone innocent could be punished.', appeal: 'safety', sound: true },
           { text: 'The data clearly shows...', appeal: 'facts', sound: true },
           { text: 'It is just the right thing to do.', appeal: null, sound: true },
           { text: 'You have no other choice.', appeal: null, sound: false } ] }
```

## 3.2 (b) Montage: "Rift Run" (travel between chapters)

**Where:** whenever the player walks through a time rift into the next chapter (and as an optional "storm crossing" on long map edges). It replaces a plain loading moment with 2 to 3 minutes of play that **reviews the previous lesson**.

**Shape** (Draw Steel's montage, scaled for one player): **two rounds of three obstacles** (6 at most). Each obstacle is a picture card with one line ("The bridge planks are rotten", "A feed-screen blocks the path, flashing outrage"). The player picks one of **three approaches**, each a Way of Knowing button. Counters at the top: **successes needed: 4**, **stumbles allowed: 3** (Draw Steel's moderate limits, scaled down for a solo player; the limits are shown, as Draw Steel allows).

**Two kinds of approach** (this is the lesson):
- **Think it through** (always available, any avatar): a 10-second question from the last chapter, e.g. "Sign: *If the lamp is lit, the bridge is safe.* The bridge is safe. Must the lamp be lit? Yes / No / Can't tell." A right answer is a certain success. This is retrieval practice, and it shows that *knowing* beats *guessing*.
- **Chance approaches**: two Way of Knowing buttons, each showing an honest percentage, e.g. "Sense perception: look for a safer plank: **60%**". Your own avatar's Way of Knowing gets +20%; a team caricature of the matching colour adds +10%. One roll, shown with a short (calm) animation.

**Draw Steel's "no repeating your skill" rule:** a Way of Knowing button used once is greyed out for the rest of the run (Think it through is limited to 3 uses). This forces the student to use several ways of knowing, which is itself the TOK point.

**Draw Steel's "clever idea = automatic success":** an item in the bag that fits an obstacle (a lantern for a dark tunnel) shows as a fourth button with 100%.

**Outcomes:**

| Result | Condition | Effect |
|---|---|---|
| Clean crossing | 4 successes before 3 stumbles | Arrive with a bonus: a catch item, and one extra map node's fog lifted |
| Rough crossing | run out of obstacles with more successes than stumbles | Arrive normally |
| Lost in the rift | 3 stumbles first, or out of obstacles without more successes | Arrive at a side node; an Algorithm imp battle waits on the path. No progress lost. |

(Draw Steel's partial success needs a margin of 2; with only 6 obstacles a margin of 1 is fairer.)

**Probability tie-in:** keep a small "rift log" of every chance roll (the % shown vs what happened). In lesson 4 the student can open it: "Your 60% rolls succeeded 7 times out of 11." A real dataset about their own play for the probability lesson.

**Data sketch:**
```js
{ id: 'rift-1-2', review: 'ch1', need: 4, stumbles: 3,
  obstacles: [ { img: 'rift/bridge', text: 'The bridge planks are rotten.',
                 think: { q: 'If the lamp is lit, the bridge is safe. The bridge is safe. Must the lamp be lit?',
                          options: ['Yes', 'No', "Can't tell"], answer: 2 },
                 chance: [ { wok: 'perception', base: 40 }, { wok: 'imagination', base: 30 } ],
                 item: 'rope' } ] }
```

## 3.3 (c) Downtime: "Campfire" between lessons

**Where:** the campfire (already planned in AVATARS.md for swapping tweaks). It opens automatically at the **start of each lesson** when a save is loaded, and can be visited once per chapter later. It is Draw Steel's respite: a safe, short pause where the student takes **2 campfire actions** (Draw Steel gives 1; two feels better for a 3 to 5 minute warm-up), then walks on.

**Campfire actions** (pick 2):
1. **Work on a project** (progress bar, below).
2. **Visit someone**: one NPC from an earlier chapter appears with a short scene that reacts to the student's choices (flags). "Yes, but..." favours from negotiations are paid off here; a "No." from a negotiation can be re-tried here (the white-check retry).
3. **Shop**: spend coins from montages, negotiations and battles (catch items, hint tokens, cosmetic hats, extra argument cards). Keep the shop to 6 to 8 items.
4. **Swap tweaks / team** (does not use an action, like swapping a kit in Draw Steel's respite is cheap).
5. **Think** (Thought Cabinet, see 3.4): start internalising a thought.

**Projects** (Draw Steel's project points: every attempt makes progress; the roll only sets the speed):
- Each project has a **goal** (e.g. 30 points) and a source (a book from the library node, a mentor NPC).
- Working on it = a 30 to 60 second mini-puzzle from the current chapter's family. Points = **10 + 2 per correct step** (never less than 5, so effort always counts). A perfect run is a **breakthrough**: +5 and a free second go.
- **Friends chip in:** entering a classmate's team code at the campfire adds 5 points to one of your projects (Draw Steel's "other heroes can roll for your project"), once per classmate per lesson. Social, low-risk, good for a classroom.
- Event at the halfway point (Draw Steel's milestone events): a 2-line scene with the project's mentor.

**Project list** (each maps a Draw Steel category to TOK content):

| Project | Draw Steel model | Goal | Reward |
|---|---|---|---|
| **Track down a legend** (read about a historical mathematician) | Discover lore (15 / 45 / 120) | 20, 40 or 60 | The legendary's bio card; at the top tier, a chance to catch them |
| **Learn a new argument** | Learn a skill | 30 | A new argument card for negotiations |
| **Mend the old bridge** | Build or repair a road | 30 | A shortcut appears on the map |
| **Help the village** | Community service | 20 | A random consumable |
| **Study with a master** | Learn from a master | 40 | Unlocks one tweak early |
| **Bluff pond** (fishing) | Fishing | open | Points spent like coins on small treats |

## 3.4 (d) Inner voices: helpful and misleading

**Presentation** (from Disco Elysium's dialogue log): the voice's line appears in the same text box as NPC lines, but with the Way of Knowing's name in its colour and small capitals (**REASON**, **SENSE**, **IMAGINATION**, **MEMORY**, **LANGUAGE**), a small avatar portrait with the "inner" sound effect, and the text in italics. No new UI panel. One line, max 15 words.

**Passive lines ("it noticed something")**: as in AVATARS.md: two or three per node visit, triggered by script steps. No level needed: each avatar has one voice, so every passive "succeeds". To borrow Disco Elysium's "more points = more lines", each **tweak slot unlocked** adds lines (the voice gets chattier as the avatar grows).

**Active voice checks ("let your Way of Knowing try")**: a dialogue option tagged with the Way of Knowing, showing an honest percentage and its modifiers, like Disco Elysium's hover:
> [MEMORY 55%] "Wait, I've seen this lock before."
> +15% you read the old notice at the market · +10% a Memory-colour caricature on your team
- **White** options (most): on a fail, they stay visible and reopen on the next visit or after the player finds a new clue. Low stakes.
- **Red** options (one per chapter at most, red border): one try, the result sticks, and **both** results lead somewhere interesting.
- The modifiers are **evidence changing a probability**: this is the visible seed of lesson 4 (updating on evidence; the Algorithm does the same thing with your clicks).

**Each Way of Knowing: lens and blind spot.** Most lines are genuinely helpful. About once a chapter the voice is confidently wrong in its own typical way, and a later line or NPC shows the mistake.

| Avatar (WoK) | Helpful: what it notices | Misleading: its blind spot | Chapter where the blind spot fits |
|---|---|---|---|
| Owlet (Reason) | contradictions, valid if-then chains, "that does not follow" | **Valid but false**: a perfect deduction from a premise nobody checked. Also treats an induction as certain. | Ch 2 liars village: "If the baker is a knight, then... so the baker is a knight!" (assumed what it proved) |
| Moth-kin (Sense perception) | small details, mismatched colours, what is missing from a picture | **Vivid is not proof**: a striking detail that proves nothing; one sighting taken as a rule; a chart that *looks* huge (cut-off axis). | Ch 1 induction: "Every crow I've seen is black. Done." Ch 3 truncated-axis chart |
| Fox kit (Imagination) | what-ifs, counterexamples, other explanations | **A lovely story with no evidence**: picks the most exciting explanation, not the most likely; sees a mind where there is none. | Ch 4: "The Algorithm *wants* something. It *hates* us." (it is probabilities) |
| Frogling (Memory) | earlier clues, who said what, "this happened before" | **"Last time it was like this"**: past pattern as a guarantee; misremembers details; the gambler's fallacy. | Ch 4 probability: "Five heads in a row, so tails is due!" |
| Raven chick (Language) | exact wording, double meanings, definitions, loopholes | **Clever words over substance**: equivocation, being impressed by a label or a fancy term. | Ch 2 exact words of liars; Ch 4: "It's called *intelligence*, so it must understand." |

**Emotion, the voice that is not yours.** No avatar has Emotion. Use that: from chapter 3, short **grey, flickering "voice" lines** sometimes appear in the inner-voice style but labelled with a feed icon instead of a Way of Knowing ("Everyone is laughing at you. Click here."). They are the Algorithm pushing outrage into your head. The student's own voice can call it out ("That wasn't me."). In the chapter 4 reveal, these lines are shown with the probability the Algorithm gave each one ("72% likely to make you click"). This plays both TOK points: emotion is a powerful way of knowing that can be hijacked, and the "AI" is only predicting clicks. Keep it rare (2 or 3 lines per chapter) so it stays eerie, not noisy.

**Thought Cabinet, light version: "Notebook of ideas".**
- 2 slots (a third after the chapter 2 boss). Thoughts are short knowledge claims picked up in scenes: "Correlation is not causation", "Every rule has an exception", "If lots of people believe it, it's probably true".
- **Internalising** takes 3 map nodes (instead of in-game hours). While it settles, a small **problem** (e.g. one fewer hint). When done, a **solution**: a small perk in puzzles or battles, plus new dialogue options.
- Some thoughts are **traps** (as in Disco Elysium): "If lots of people believe it, it's true" gives a quick perk in Fame negotiations but makes slick arguments look sound to you (the badges hide). Teaches that the beliefs you adopt change what you can see.
- Forgetting a thought costs a few coins.

## 3.5 Session budget (30 to 40 minutes)

| Piece | Time | When |
|---|---|---|
| Campfire (2 actions) | 3 to 5 min | Start of lessons 2, 3, 4 |
| Rift Run (montage) | 2 to 3 min | Entering a new chapter |
| Negotiation | 3 to 4 min each, 1 to 2 per lesson | Chapter 3 mainly (one teaser in chapter 2 with a villager) |
| Inner voice | ~0 extra | Throughout |

## 3.6 Top recommendations (priority order)

1. **Build the negotiation for chapter 3 first.** It maps almost 1:1 onto "breaking down arguments": find what someone cares about, avoid what they hate, and then ask whether your persuasion was *sound*. Two meters, hidden tags, a fixed outcome table: cheap to build in plain JS.
2. **Make the avatar's special argument card double as its blind spot** (counts as some motivations, backfires on one personality). One mechanic teaches both the strength and the limit of a Way of Knowing.
3. **Show honest percentages with listed modifiers** on chance options (voice checks, rift run) and keep a roll log. Lesson 4 then uses the student's own data, and the Algorithm reveal mirrors the same numbers.
4. **Rift Run as retrieval practice**: a certain "think it through" option beside chance options teaches that knowledge beats guessing and reviews the previous lesson.
5. **Campfire projects where every attempt adds progress**, with classmates able to chip in via team codes.
6. **Emotion as the hijacked voice** (Algorithm lines in the inner-voice style) as the narrative bridge into chapter 4.

