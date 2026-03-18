# Dominion of Catan — AI Player Specification

**Version:** 0.1.0-draft
**Companion to:** Technical Specification v0.1.0

---

## 1. Overview

The game supports two AI difficulty levels: Easy and Hard. Both are pure heuristic engines — no external API calls, no network latency, no cost. They run entirely in the browser/server as synchronous functions against the game state.

**Easy AI** plays like a competent beginner. It understands the rules, follows simple priority lists, and makes reasonable moves — but it doesn't adapt to opponents, doesn't plan ahead, and follows a fixed strategic playbook. It will never make an illegal move, but it will make plenty of suboptimal ones.

**Hard AI** plays like an experienced player. It evaluates board state, deck composition, resource scarcity, opponent progress, and future payoff when making decisions. It adapts its strategy based on game phase, adjusts to what opponents are doing, and makes targeted robber placements. It should feel like it's "trying to win" without being omniscient.

Both AIs share the same interface and decision-point structure. They differ only in how they score and select options at each decision point.

---

## 2. AI Interface

```typescript
interface AIPlayer {
  difficulty: 'easy' | 'hard';

  /** Given the full game state and a decision prompt, return a chosen action. */
  decide(state: GameState, decision: AIDecision): AIAction;
}

type AIDecision =
  | { type: 'PRODUCTION_CHOICE'; playerId: string; hex: HexId; count: number }
  | { type: 'DENOMINATION_CHOICE'; totalCoins: number }
  | { type: 'ACTION_PHASE'; playerId: string }
  | { type: 'CHAPEL_TRASH'; playerId: string; maxCards: number }
  | { type: 'REMODEL_TRASH'; playerId: string }
  | { type: 'REMODEL_GAIN'; playerId: string; maxCost: number }
  | { type: 'MINE_TRASH'; playerId: string }
  | { type: 'MINE_GAIN'; playerId: string; maxCost: number }
  | { type: 'MILITIA_DISCARD'; playerId: string; targetHandSize: number }
  | { type: 'MOAT_REVEAL'; playerId: string }
  | { type: 'ROBBER_PLACEMENT'; playerId: string; source: 'roll7' | 'militia' }
  | { type: 'TRADE_BUILD_PHASE'; playerId: string }
  | { type: 'ATTACH_PHASE'; playerId: string }
```

The game engine calls `decide()` at each decision point during the AI's turn (and during off-turn events like Militia discards or production choices). The AI evaluates the game state and returns an action. The engine validates the action and applies it.

**Timing:** For player experience, AI decisions should include a small artificial delay (300–600ms per decision) so the game doesn't feel instant. The AI itself runs synchronously and returns immediately; the delay is applied by the UI layer.

---

## 3. Strategic Framework

Before specifying each AI level, here's the shared strategic framework both AIs reason within. The difference is how deeply they evaluate each factor.

### 3.1 Game Phases

The game has three strategic phases. Both AIs should be aware of which phase they're in, but Easy follows fixed rules per phase while Hard dynamically adjusts.

**Early Game (turns 1–8 approx):** Priority is board expansion — roads, settlements, attaching the starting Province. Build infrastructure before buying cards.

**Mid Game (turns 9–20 approx):** Priority shifts to the deck engine — buying Action cards, converting resources to coins efficiently, purchasing Victory cards when affordable. Balance board expansion with card purchases.

**Late Game (turns 20+ or when Province pile ≤ 4):** Priority is pure VP accumulation. Buy Victory cards aggressively. Stop investing in engine and infrastructure unless it directly leads to more VP.

**Phase detection heuristic:**
- Early: AI has ≤ 3 buildings (settlements + cities) on the board
- Mid: AI has > 3 buildings AND Province supply > 4
- Late: Province supply ≤ 4 OR any two supply piles are empty

### 3.2 Resource Value Model

Not all resources are equally valuable. Their value shifts based on board position, game phase, and scarcity.

**Base resource priority** (for an AI deciding what to collect or trade for):

| Resource | Early Priority | Mid Priority | Late Priority |
|----------|---------------|-------------|---------------|
| Brick | High (roads, settlements) | Medium | Low |
| Lumber | High (roads, settlements) | Medium | Low |
| Grain | Medium (settlements) | High (cities, settlements) | High (cities) |
| Wool | Medium (settlements) | Low | Low |
| Ore | Low (nothing to build) | High (cities) | High (cities) |

### 3.3 Deck Health Metrics (Hard AI only)

The Hard AI tracks deck composition to inform purchasing and trashing decisions.

- **Deck density:** ratio of "useful" cards (resources needed for current goals + coins + action cards) to total deck size. Higher is better.
- **Coin potential:** expected coin yield per hand draw, based on treasure cards and Province-converted production.
- **Action density:** ratio of Action cards to total deck. Too high (>30%) means dead Action chains; too low (<10%) means no engine.
- **Junk ratio:** Curses + unneeded resources as a percentage of deck. Chapel becomes high priority when this exceeds 25%.

---

## 4. Easy AI Specification

### 4.1 Personality

The Easy AI follows fixed priority lists. It does not evaluate opponent state, does not adapt to resource scarcity, and does not plan multi-turn sequences. It makes the "obvious" move at each decision point. It plays a generic balanced strategy every game.

### 4.2 Initial Placement

**First settlement:** Score each valid intersection by summing the production probability of adjacent hexes (number of pip dots for each hex's number token). Pick the intersection with the highest total. Break ties randomly.

**Second settlement:** Same scoring, but add a bonus (+2 pips) for intersections that provide a resource type not covered by the first settlement. This ensures some resource diversity.

**Road placement:** Place the road on the edge that points toward the nearest high-value unoccupied intersection (one with good production). If no clear direction, place randomly among valid edges.

### 4.3 Production Choices

**Rule:** Always take resources in early game. In mid/late game, convert to coins at Province settlements only when the AI has no immediate building plans (no affordable build in the current resource pipeline).

**Denomination choice:** Always take the highest denomination available. 3 conversions → 1 Gold. 2 conversions → 1 Silver. 1 conversion → 1 Copper.

### 4.4 Action Phase

Play Action cards in this fixed priority order. Play the first one found in hand. If it grants +Actions, continue down the list.

1. **Village** (or any +Action card) — always play first to enable chains
2. **Festival** — actions + coins + buy
3. **Market** — all-around value
4. **Smithy** — draw cards
5. **Militia** — disruption (place robber on the hex adjacent to the player with the most VP, choosing randomly among tied players)
6. **Witch** — give curses
7. **Mine** — upgrade cheapest treasure (Copper → Silver → Gold)
8. **Remodel** — trash the least useful card in hand (Curse > Copper > excess resources)
9. **Chapel** — trash up to 2 Curses, then up to 2 Coppers (never trash more than 2 total cards)
10. **Moat** — don't play proactively (only reveal as reaction)

If no Action cards in hand, or only Moat, pass the Action phase.

### 4.5 Trade & Build Phase

Execute the first affordable action from this priority list. Repeat until nothing is affordable or desirable.

**Build priority:**
1. **City** — if affordable and the AI has a settlement to upgrade
2. **Settlement** — if affordable and a valid location exists connected to roads
3. **Road** — if the AI has fewer than 2 settlements and a road would open a new settlement spot within 1–2 more roads

**Buy priority (one purchase per turn unless +Buy):**
1. **Province** — if affordable (8 coins) and the AI has an open Province slot
2. **Duchy** — if affordable (5 coins) and the AI has an open Duchy slot and it's mid/late game
3. **Estate** — if affordable (2 coins) and the AI has an open Estate slot and it's late game
4. **Smithy** — if the AI owns < 2 Smithies
5. **Village** — if the AI owns < 2 Villages
6. **Festival** — if the AI owns < 1 Festival
7. **Market** — if the AI owns < 1 Market
8. **Militia** — if the AI owns < 1 Militia
9. **Nothing** — save coins for next turn

**Bank/Harbor trades:** Only use 4:1 bank trades, and only when the AI has 4+ of a resource it doesn't need and is 1 resource short of an affordable build. Never use harbor trades (Easy AI doesn't optimize for harbors).

### 4.6 Attach Phase

Attach any Victory cards in hand to buildings with open slots. Priority: Province first (to the settlement/city adjacent to the most productive hexes), then Duchy, then Estate. If multiple buildings have slots, prefer the one with more adjacent hex production.

### 4.7 Robber Placement (7 or Militia)

Place the robber on the hex with the highest-probability number token that is adjacent to the player with the most VP (other than the AI). If tied, pick randomly. Never place on a hex adjacent to the AI's own buildings.

### 4.8 Reactive Decisions

**Moat:** Always reveal Moat when attacked.

**Militia discard:** Discard in this order: Curses first, then the resource type the AI has the most of, then Coppers.

---

## 5. Hard AI Specification

### 5.1 Personality

The Hard AI evaluates each decision by scoring candidate options across multiple weighted factors. It adapts its strategy based on game phase, board state, deck composition, and opponent progress. It plans 1–2 turns ahead for build sequences and actively targets the leading player with the robber.

### 5.2 Scoring Engine

Every decision point generates a set of candidate options. Each option is scored by summing weighted factors. The highest-scoring option is chosen, with small random noise (±5%) added to prevent perfectly deterministic play.

```typescript
function scoreOption(option: CandidateOption, state: GameState, ai: PlayerState): number {
  let score = 0;
  for (const [factor, weight] of Object.entries(weights)) {
    score += evaluateFactor(factor, option, state, ai) * weight;
  }
  // Add ±5% noise for human-feeling unpredictability
  score *= (0.95 + Math.random() * 0.10);
  return score;
}
```

### 5.3 Strategy Weights by Game Phase

The Hard AI adjusts its scoring weights based on the current game phase. These weights multiply the raw factor scores.

| Factor | Early Weight | Mid Weight | Late Weight |
|--------|-------------|-----------|-------------|
| VP gain | 0.3 | 0.6 | 1.0 |
| Board expansion | 1.0 | 0.4 | 0.1 |
| Deck efficiency | 0.3 | 0.8 | 0.4 |
| Coin generation | 0.4 | 0.8 | 0.6 |
| Resource acquisition | 0.8 | 0.5 | 0.2 |
| Opponent disruption | 0.1 | 0.4 | 0.6 |
| Scarcity awareness | 0.2 | 0.5 | 0.8 |

### 5.4 Initial Placement

**First settlement:** Score each intersection using a multi-factor evaluation:

- **Production value** (sum of pip probabilities for adjacent hexes) — weight 1.0
- **Resource diversity** (number of distinct resource types from adjacent hexes) — weight 0.6. 3 distinct types is ideal.
- **Port adjacency** (is this intersection on a 2:1 or 3:1 harbor?) — weight 0.4. A 2:1 harbor matching an adjacent resource is particularly valuable.
- **Expansion potential** (how many valid settlement spots are reachable within 2–3 road segments, accounting for the distance rule?) — weight 0.5

Pick the highest-scoring intersection.

**Second settlement:** Same scoring, but add:

- **Complementarity bonus** — resources not covered by the first settlement get +0.8 weight bonus per missing type.
- **Ore/Grain bias** — if the first settlement lacks access to Ore or Grain (needed for cities), adjacent hexes producing those get +0.3 bonus.

**Road placement:** Evaluate each valid adjacent edge. Score by: how many high-value unoccupied intersections are reachable within 2 more road segments from the road's far end, weighted by their production value. Pick the road that opens the most valuable expansion path.

### 5.5 Production Choices

The Hard AI dynamically decides resource vs. coin based on what it needs this turn and next turn.

**Decision heuristic per production unit:**

1. **Calculate build plan:** Look at what the AI plans to build/buy this turn. Identify which resources are needed and how many coins.
2. **If the resource is needed for an affordable build this turn:** Take the resource.
3. **If the AI has an attached Province on this settlement and the resource is not needed for building:** Convert to coin.
4. **If the resource type is scarce in the supply** (≤ 5 remaining in pile): Take the resource — it's becoming a limited commodity.
5. **Default:** Convert to coin if Province is attached; take resource otherwise.

**Denomination choice:** Optimize for flexibility. If total = 3, prefer 1 Silver + 1 Copper over 1 Gold (two cards means more trading flexibility and less robber loss). If total ≥ 4, include at most 1 Gold and fill the rest with smaller denominations.

### 5.6 Action Phase

The Hard AI evaluates which Action card to play by scoring each candidate based on the current hand composition and game state.

**Sequencing logic:**

1. **Play +Action cards first** (Village, Festival, Market) to open action chains.
2. **Then play draw cards** (Smithy) to fill the hand before making spend decisions.
3. **Then play economy/disruption cards** (Militia, Witch) now that the hand is full and the AI knows what it has to work with.
4. **Then play manipulation cards** (Chapel, Remodel, Mine) with full information about the hand.

**Per-card scoring (within each priority tier, pick the highest score):**

**Village (+1 Card, +2 Actions):**
- Base score: 50 (always good to play first)
- Bonus +20 if the AI has 2+ other Action cards in hand (enables chain)

**Festival (+2 Actions, +1 Buy, +2 Coins):**
- Base score: 60
- Bonus +15 if the AI has a buy target this turn (the +Buy enables double purchase)

**Market (+1 Card, +1 Action, +1 Buy, +1 Coin):**
- Base score: 55
- Bonus +10 if the AI has other Action cards to chain

**Smithy (+3 Cards):**
- Base score: 40
- Bonus +15 if the AI's hand currently has < 5 cards (post-cleanup draws were thin)
- Penalty -10 if the AI has already drawn many extra cards this turn (diminishing returns)

**Militia (+2 Coins, opponents discard, move robber):**
- Base score: 30
- Bonus +25 if the leading opponent has > 5 cards in hand (maximizes discard pain)
- Bonus +15 if the leading opponent has many coins in hand (robber wipes them)
- Penalty -10 if all opponents have ≤ 3 cards in hand (discard effect is wasted)

**Witch (+2 Cards, opponents gain Curse):**
- Base score: 35
- Bonus +20 if the Curse pile still has cards
- Bonus +10 per opponent without Moat in their known play history (less likely to block)
- Penalty -30 if the Curse pile is empty (completely useless)

**Mine (trash Treasure, gain better Treasure):**
- Base score: 20
- Bonus +30 if the AI has a Copper in hand (Copper → Silver is high value)
- Bonus +20 if the AI has a Silver in hand (Silver → Gold is good)
- Penalty -20 if the AI has only Gold in hand (nothing to upgrade)

**Remodel (trash card, gain card costing up to 2 more):**
- Base score: 15
- Bonus +35 if the AI has a Curse in hand (trash Curse, gain a card costing up to 2)
- Bonus +25 if the AI has a card it wants to trash and there's a desirable card at cost+2
- See section 5.6.1 for what to trash/gain.

**Chapel (trash up to 4 cards):**
- Base score: 10
- Bonus +15 per Curse in hand (up to 4)
- Bonus +10 per Copper in hand (up to 4, but reduced in late game when coins matter)
- Bonus +10 if the AI's deck junk ratio > 25%
- Penalty -20 in late game (trashing is less valuable when the game is ending)

**Moat:** Never play proactively (score: -100). Only reveal as a Reaction.

#### 5.6.1 Remodel Target Selection

**What to trash (highest score first):**
- Curse → score 100 (always trash)
- Copper → score 50 (cheap, clogs deck)
- Resource card the AI has 3+ of in hand → score 40 (excess)
- Estate already in hand (not attached) in late game → score 30 (trade up to Duchy if Remodel allows)
- Lowest-value card in hand → score 20

**What to gain (scored by desirability):**
- Province (if cost allows, 8 coins) → score 100 (6 VP)
- Duchy (if cost allows, 5 coins) → score 70 (3 VP)
- Estate (if cost allows, 2 coins) → score 40 (1 VP, and can attach)
- Best Action card at or below cost → score 50
- Resource card the AI needs for a planned build → score 30

### 5.7 Trade & Build Phase

The Hard AI plans its build/buy sequence before executing, to avoid spending resources it needs for a higher-priority action.

**Planning algorithm:**

1. **Enumerate all affordable actions** this turn: buildings, card purchases, bank/harbor trades.
2. **Score each action** using the weighted factors (section 5.3).
3. **Check for conflicts:** If building a settlement and buying a Province both require resources/coins the AI has, compare scores and do the higher one first.
4. **Execute in score order**, re-evaluating after each action (the hand changes after spending).

**Build scoring:**

**City:**
- Base: 40
- Bonus +30 if the settlement being upgraded has attached Province(s) (city doubles production, amplifying coin conversion)
- Bonus +20 if the settlement has 3+ adjacent producing hexes
- Bonus +10 per filled attachment slot (city doubles capacity, opening more VP slots)
- Phase modifier: × early/mid/late weight for "board expansion"

**Settlement:**
- Base: 35
- Bonus +25 if the target intersection has 3 adjacent non-desert hexes with distinct resource types
- Bonus +15 if the target intersection is on a harbor
- Bonus +10 per pip of total adjacent production probability
- Penalty -20 if no Province is available to attach (settlement without Province has limited long-term value in the coin economy)
- Phase modifier: × early/mid/late weight for "board expansion"

**Road:**
- Base: 10
- Bonus +25 if the road is part of a 1–2 road path to a high-value settlement spot
- Bonus +15 if it extends the AI's longest road and the AI is within 2 of the Longest Road threshold (5) or within 1 of overtaking the current holder
- Penalty -10 if the road doesn't open any new settlement spots within 2 more roads
- Phase modifier: × early/mid/late weight for "board expansion"

**Buy scoring:**

**Province (8 coins):**
- Base: 80
- Bonus +20 if the AI has an open Province slot ready
- Bonus +30 in late game
- Penalty -30 if the AI has no open Province slot (buying a Province with nowhere to attach it is dead weight in the deck — still worth 6 VP at game end as unattached, but won't convert resources)

**Duchy (5 coins):**
- Base: 40
- Bonus +15 if the AI has an open Duchy slot
- Bonus +20 in late game
- Penalty -20 in early game (clogs the deck too early)

**Estate (2 coins):**
- Base: 15
- Bonus +10 if the AI has an open Estate slot
- Bonus +20 in late game
- Penalty -30 in early game

**Action cards — scored by strategic need:**

| Card | Base Score | Key Bonuses |
|------|-----------|-------------|
| Smithy (4) | 30 | +20 if AI has < 2 draw cards in deck |
| Village (3) | 25 | +20 if AI has ≥ 3 Action cards but < 2 +Action cards |
| Festival (5) | 35 | +15 if AI wants +Buy for double-purchase turns |
| Market (5) | 30 | +10 always (versatile) |
| Militia (4) | 25 | +15 if leading opponent is > 3 VP ahead |
| Witch (5) | 25 | +20 if Curse pile > 50% full |
| Chapel (2) | 20 | +25 if AI's deck junk ratio > 30% |
| Remodel (4) | 20 | +15 if AI has cards worth trashing |
| Mine (5) | 15 | +20 if AI has 3+ Coppers in deck |
| Moat (2) | 10 | +15 if Militia is in the Kingdom set and AI has been attacked recently |

**Bank/Harbor trades:**

The Hard AI evaluates trades when it's short on a resource for a high-priority build.

- **4:1 bank trade:** Score = (value of desired resource for the planned build) - (cost of losing 4 resources). Only do it if the build it enables scores > 50.
- **Harbor trade (2:1 or 3:1):** Same evaluation but with lower cost. Prefer harbor trades over bank trades. Factor in the permanent resource loss from harbor trades (they trash the resources) — only trade through harbors if the build is high priority or the traded resource is one the AI is overproducing.

### 5.8 Attach Phase

Score each possible attachment by:

- **VP per coin spent:** Estate = 1 VP / 2 coins = 0.50. Duchy = 3 VP / 5 coins = 0.60. Province = 6 VP / 8 coins = 0.75. Province is the most efficient, so prioritize attaching Provinces first.
- **Building selection:** Attach Province to the building with the most productive adjacent hexes (maximizes the coin conversion value). Attach Estates and Duchies to buildings with the most remaining capacity (keep options open).
- **Immediate vs. held:** In late game, attach everything immediately. In early/mid game, consider holding a Duchy or Estate for one more shuffle if the deck is small and the card will cycle back quickly — but this is a minor optimization. Default: attach immediately if a slot exists.

### 5.9 Robber Placement

**Target selection (which player to hurt):**

1. Calculate each opponent's "threat score": `VP + (coins in hand × 0.3) + (Province slots available × 2)`.
2. The player with the highest threat score is the primary target.
3. If the AI is the current VP leader, target the second-place player. If the AI is behind, target the leader.

**Hex selection (where to place the robber):**

Score each valid hex (excluding hexes adjacent only to the AI's own buildings):

- **Production value of hex** (pip count) — weight 1.0. Block high-probability hexes.
- **Target adjacency** — bonus +30 if the primary target has a building adjacent. Bonus +15 for each additional opponent building adjacent (collateral damage).
- **Avoid self-harm** — penalty -100 if the AI has any building adjacent. Never place on a self-adjacent hex.
- **Province disruption** — bonus +20 if the target has a Province attached to an adjacent building (blocking coin conversion is especially painful).
- **Resource scarcity** — bonus +10 if the hex produces a resource type that's running low in the supply (blocking a scarce resource hurts more).

Pick the highest-scoring hex.

**Militia-specific:** Since Militia steals before wiping coins, prefer placing adjacent to opponents with the most coins in hand (maximize the steal + wipe value).

### 5.10 Reactive Decisions

**Moat:** Always reveal Moat when attacked. (There is almost never a reason not to.)

**Militia discard (when another player plays Militia):**

Hard AI evaluates what to keep rather than what to discard. Score each card in hand by its immediate utility:

1. **Resources needed for an affordable build:** score 80
2. **Coins** (will survive this specific discard, but are at risk from the robber wipe — keep them anyway since wipe happens regardless): score 60
3. **Action cards** (playable next turn): score 50
4. **Victory cards in hand** (could attach next turn): score 40
5. **Unneeded resources:** score 10
6. **Curses:** score 0 (discard first, always)

Keep the top 3 by score. Discard the rest.

---

## 6. Decision Timing and UX

### 6.1 Turn Pacing

AI turns should feel natural, not instant. Apply artificial delays between decisions to create a rhythm that matches how a human player's turn unfolds.

| Decision | Delay Before Executing |
|----------|----------------------|
| Dice roll result appears | 400ms |
| Production choices (per unit) | 200ms |
| Action card play | 500ms |
| Action card effect resolution | 300ms |
| Build placement | 600ms (includes placement animation) |
| Card purchase | 400ms |
| Attachment | 400ms |
| Robber placement | 700ms (includes "thinking" pause) |
| Discard selection | 300ms |

Total AI turn should feel like 3–8 seconds depending on complexity, similar to a quick human player.

### 6.2 Telegraphing

To make the AI feel less opaque, the game log should narrate AI decisions with light flavor text:

**Easy AI log examples:**
- "Easy AI built a settlement."
- "Easy AI bought a Smithy."
- "Easy AI moved the robber to Mountains."

**Hard AI log examples:**
- "Hard AI built a city on the Ore-Grain-Lumber intersection."
- "Hard AI bought a Province and attached it to City 2."
- "Hard AI moved the robber to the 8-Forest — blocking Player 1's coin conversion."

The Hard AI log entries include a bit more strategic context so human players can see *why* the AI made a choice, which helps with playtesting and makes the AI feel more like a real opponent.

---

## 7. Testing Strategy

### 7.1 Unit Tests for AI Logic

Test each decision function independently with crafted game states.

**Production choice tests:**
- AI converts to coins when Province is attached and no build is planned
- AI takes resources when needed for an affordable build
- AI takes resources when supply is scarce
- Denomination selection produces valid combinations summing to correct total

**Action phase tests:**
- AI plays +Action cards before draw cards before economy cards
- AI plays Chapel and trashes Curses before Coppers
- AI doesn't play Moat proactively
- AI correctly sequences Village → Smithy → Militia in a chain

**Build/Buy tests:**
- AI prefers City over Settlement when affordable and upgradeable
- AI buys Province when affordable and slot is available
- Easy AI follows fixed priority list
- Hard AI adjusts buy priority by game phase
- AI doesn't attempt builds it can't afford
- AI uses bank trades only when they enable a high-priority build

**Robber tests:**
- AI never places robber on a hex adjacent to its own buildings
- AI targets the leading player
- Hard AI prefers hexes that block Province coin conversion

**Attach tests:**
- AI attaches Province to the most productive building
- AI attaches all Victory cards when slots are available

### 7.2 Simulation Tests

Run automated games (AI vs AI) to verify:

- **Games terminate:** Every game reaches an end condition within a reasonable turn count (< 100 turns).
- **No illegal moves:** The engine never accepts an invalid action from the AI.
- **Score distribution:** Hard AI beats Easy AI significantly more than 50% of the time over 100+ games.
- **Resource economy:** Resources deplete at a reasonable rate. Games don't stall because all resources are consumed.
- **Province pile empties:** The most common game-end trigger is Province depletion, not three-pile depletion (indicates healthy game pacing).

### 7.3 Balance Metrics

Track these metrics across simulation runs to tune AI weights and priority values:

| Metric | Target Range |
|--------|-------------|
| Average game length | 25–45 turns |
| Hard AI win rate vs Easy (1v1) | 65–80% |
| Average VP at game end (winner) | 15–25 VP |
| Average Province pile depletion turn | 30–40 |
| Games ending via three-pile | < 20% of games |
| Hard AI average decisions per turn | 3–6 |
| Robber placements on own hex | 0 (always) |

---

## 8. Implementation Notes

### 8.1 File Structure

```
src/lib/engine/ai/
  types.ts           # AIPlayer interface, AIDecision, AIAction types
  easy.ts            # Easy AI implementation
  hard.ts            # Hard AI implementation
  scoring.ts         # Shared scoring utilities (pip count, threat score, etc.)
  placement.ts       # Initial placement logic (shared evaluation, different weights)
  simulation.ts      # Automated game runner for testing
```

### 8.2 Determinism and Reproducibility

Both AIs use a seeded random number generator (not `Math.random()`). The seed is set at game start and logged. This allows replaying any game exactly for debugging. The Hard AI's ±5% noise is generated from this seeded RNG.

```typescript
import { createRNG } from './rng';

const rng = createRNG(gameSeed);
const noise = 0.95 + rng.next() * 0.10;
```

### 8.3 Extensibility

The scoring engine architecture (weighted factors × phase multipliers) is designed to be tunable without code changes. Weights can be extracted to a JSON config file, allowing rapid iteration:

```json
{
  "hard": {
    "early": { "vpGain": 0.3, "boardExpansion": 1.0, "deckEfficiency": 0.3 },
    "mid":   { "vpGain": 0.6, "boardExpansion": 0.4, "deckEfficiency": 0.8 },
    "late":  { "vpGain": 1.0, "boardExpansion": 0.1, "deckEfficiency": 0.4 }
  }
}
```

This makes it straightforward to add a "Medium" difficulty later (just a different weight profile) or to A/B test different Hard AI configurations in simulation.

### 8.4 Future: Claude AI as a Third Tier

If a "Genius" difficulty is desired later, the architecture supports adding a Claude-powered AI that uses the same interface. It would serialize the game state to a prompt, send it to the API, and parse the returned action. The scoring engine and heuristic AIs remain as free, instant fallbacks. The Claude AI would be opt-in and clearly labeled as costing API credits.
