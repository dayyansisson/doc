# Dominion of Catan — Technical Specification

**Version:** 0.1.0-draft
**Status:** Pre-playtest
**Players:** 2–4
**Platform Target:** Web application (multiplayer, real-time)

---

## 1. Overview

Dominion of Catan is a hybrid board/card game combining Catan's spatial settlement-building with Dominion's deck-building engine. Players build infrastructure on a shared hex board to generate resources and coins, then use a personal deck-cycling system to buy action cards and attach victory cards to settlements for points.

This document specifies the game's data model, state machine, rules engine, and UI requirements at the level of detail needed to implement a fully functional web application.

---

## 2. Data Model

### 2.1 Board

The board is a static hex grid assembled during game setup. It does not change during play.

#### 2.1.1 Hex Tiles

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique hex identifier (e.g., `hex_0` through `hex_18`) |
| `terrain` | `enum` | One of: `HILLS`, `FOREST`, `MOUNTAINS`, `FIELDS`, `PASTURE`, `DESERT` |
| `resource` | `enum \| null` | Mapped from terrain: `BRICK`, `LUMBER`, `ORE`, `GRAIN`, `WOOL`, or `null` (desert) |
| `numberToken` | `int \| null` | 2–12, or `null` for desert. Determines which dice roll triggers production. |
| `hasRobber` | `bool` | Whether the robber currently occupies this hex. Exactly one hex has `true` at any time. |

**Terrain-to-resource mapping:**

| Terrain | Resource |
|---------|----------|
| `HILLS` | `BRICK` |
| `FOREST` | `LUMBER` |
| `MOUNTAINS` | `ORE` |
| `FIELDS` | `GRAIN` |
| `PASTURE` | `WOOL` |
| `DESERT` | `null` |

#### 2.1.2 Intersections (Vertices)

Each hex has 6 vertices. Adjacent hexes share vertices. The board contains 54 unique intersections.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique intersection identifier |
| `adjacentHexes` | `string[]` | IDs of the 2–3 hexes touching this intersection |
| `adjacentEdges` | `string[]` | IDs of the 2–3 edges connected to this intersection |
| `building` | `Building \| null` | Settlement or city placed here, or `null` |

#### 2.1.3 Edges

Each hex has 6 edges. Adjacent hexes share edges. The board contains 72 unique edges.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique edge identifier |
| `adjacentIntersections` | `string[2]` | The two intersection IDs at either end |
| `road` | `Road \| null` | Road placed here, or `null` |

#### 2.1.4 Harbors

Harbors are placed on specific coastal edges during board setup.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique harbor identifier |
| `type` | `enum` | `GENERIC_3_1` or one of `BRICK_2_1`, `LUMBER_2_1`, `ORE_2_1`, `GRAIN_2_1`, `WOOL_2_1` |
| `intersectionIds` | `string[2]` | The two coastal intersections this harbor services |

### 2.2 Player State

Each player maintains the following state:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique player identifier |
| `deck` | `Card[]` | Face-down draw pile (ordered, top = index 0) |
| `hand` | `Card[]` | Current hand |
| `discardPile` | `Card[]` | Discard pile (ordered, most recent = index 0) |
| `playArea` | `Card[]` | Action cards played this turn (awaiting clean-up) |
| `buildings` | `Building[]` | All settlements and cities on the board |
| `roads` | `Road[]` | All roads on the board |
| `militiaPlays` | `int` | Cumulative count of Militia cards played (for Largest Army) |
| `actionsRemaining` | `int` | Actions available this turn (reset to 1 each turn) |
| `buysRemaining` | `int` | Buys available this turn (reset to 1 each turn) |
| `tempCoins` | `int` | Temporary coin value from Action card effects (reset to 0 each turn) |

### 2.3 Building

| Field | Type | Description |
|-------|------|-------------|
| `type` | `enum` | `SETTLEMENT` or `CITY` |
| `playerId` | `string` | Owning player |
| `intersectionId` | `string` | Board position |
| `attachedCards` | `AttachedCard[]` | Victory cards socketed into this building |

#### 2.3.1 Attached Cards

| Field | Type | Description |
|-------|------|-------------|
| `cardType` | `enum` | `ESTATE`, `DUCHY`, or `PROVINCE` |
| `vpValue` | `int` | 1, 3, or 6 respectively |

#### 2.3.2 Attachment Capacity

| Building Type | Max Estates | Max Duchies | Max Provinces |
|---------------|-------------|-------------|---------------|
| `SETTLEMENT` | 3 | 2 | 1 |
| `CITY` | 6 | 4 | 2 |

Validation: reject any attach action that would exceed these limits for the given card type.

### 2.4 Road

| Field | Type | Description |
|-------|------|-------------|
| `playerId` | `string` | Owning player |
| `edgeId` | `string` | Board position |

### 2.5 Cards

All cards in the game share a base schema. Cards exist in multiple zones: supply piles, player decks, player hands, player discard piles, player play areas, attached to buildings, the trash, or the coin bank.

#### 2.5.1 Card Schema

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique instance identifier |
| `type` | `enum` | `RESOURCE`, `TREASURE`, `VICTORY`, `ACTION`, `CURSE` |
| `name` | `string` | Display name (e.g., `"Lumber"`, `"Copper"`, `"Militia"`) |
| `coinCost` | `int` | Cost to purchase from supply (in coins). `0` for resources and Curses. |
| `zone` | `enum` | Current location: `SUPPLY`, `HAND`, `DECK`, `DISCARD`, `PLAY_AREA`, `ATTACHED`, `TRASH`, `BANK` |
| `ownerId` | `string \| null` | Player who owns this card, or `null` if in supply/trash/bank |

#### 2.5.2 Resource Cards

| Name | Terrain Source |
|------|---------------|
| `Brick` | Hills |
| `Lumber` | Forest |
| `Ore` | Mountains |
| `Grain` | Fields |
| `Wool` | Pasture |

Resource cards have no coin cost (they are produced, not purchased). When spent on building, they are **permanently trashed** — moved to the `TRASH` zone and never returned to supply.

#### 2.5.3 Treasure Cards

| Name | Coin Value | Cost to Purchase |
|------|-----------|-----------------|
| `Copper` | 1 | 0 (not purchasable — gained via production conversion) |
| `Silver` | 2 | 0 (not purchasable — gained via production conversion) |
| `Gold` | 3 | 0 (not purchasable — gained via production conversion) |

Treasure cards are gained through Province coin conversion during production. When spent to buy cards from the supply, they return to the `BANK` zone (not trashed). They recirculate.

#### 2.5.4 Victory Cards

| Name | VP Value | Coin Cost |
|------|----------|-----------|
| `Estate` | 1 | 2 |
| `Duchy` | 3 | 5 |
| `Province` | 6 | 8 |

Victory cards are purchased from the supply with coins. They enter the player's discard pile, cycle through the deck, and can be attached to buildings during the Attach phase. Attached Victory cards move to the `ATTACHED` zone permanently.

**Province special behavior:** A Province attached to a building enables coin conversion for **any resource type** produced by hexes adjacent to that building. See section 4.1 (Production) for conversion logic.

#### 2.5.5 Action Cards (Starter Set)

The following 10 Kingdom cards constitute the recommended starter set. Each pile contains 10 copies in the supply.

| Name | Cost | Effects |
|------|------|---------|
| `Chapel` | 2 | Trash up to 4 cards from hand |
| `Moat` | 2 | +2 Cards. **Reaction:** reveal from hand when attacked to negate the attack. Also negates Militia robber effects (steal + coin wipe). |
| `Village` | 3 | +1 Card, +2 Actions |
| `Militia` | 4 | +2 Coins. Each other player discards down to 3 cards. **Also triggers robber movement** (see section 4.3). |
| `Remodel` | 4 | Trash a card from hand. Gain a card costing up to 2 more than the trashed card. |
| `Smithy` | 4 | +3 Cards |
| `Festival` | 5 | +2 Actions, +1 Buy, +2 Coins |
| `Market` | 5 | +1 Card, +1 Action, +1 Buy, +1 Coin |
| `Mine` | 5 | Trash a Treasure from hand. Gain a Treasure to hand costing up to 3 more. |
| `Witch` | 5 | +2 Cards. Each other player gains a Curse from the supply to their discard pile. |

**"+X Coins" from Action cards** add to the player's `tempCoins` for the current turn only. They do not generate physical Treasure card instances.

#### 2.5.6 Curse Cards

| Name | VP Value | Cost |
|------|----------|------|
| `Curse` | -1 | 0 (not purchasable — gained via Witch) |

Curses count as negative VP at end of game. Count all Curses in the player's deck, hand, and discard pile.

### 2.6 Supply State

The supply is a global shared state tracking available card piles.

| Field | Type | Description |
|-------|------|-------------|
| `treasureBank` | `{ copper: int, silver: int, gold: int }` | Available treasure cards. Large pool; effectively unlimited but tracked. |
| `victoryPiles` | `{ estate: int, duchy: int, province: int }` | Cards remaining. 8 each (2p) or 12 each (3–4p). |
| `cursePile` | `int` | Cards remaining. 10 (2p), 20 (3p), 30 (4p). |
| `kingdomPiles` | `Map<string, int>` | Cards remaining per Kingdom card type. 10 each at start. |
| `resourcePiles` | `{ brick: int, lumber: int, ore: int, grain: int, wool: int }` | **Finite.** 19 each at start. Decremented on production gain. Never replenished from building (trashed). Replenished only from 4:1 bank trades. |

### 2.7 Game State

| Field | Type | Description |
|-------|------|-------------|
| `players` | `Player[]` | 2–4 players in turn order |
| `activePlayerIndex` | `int` | Index of the player whose turn it is |
| `currentPhase` | `enum` | `ROLL`, `ACTION`, `TRADE_BUILD`, `ATTACH`, `CLEANUP` |
| `diceResult` | `int \| null` | Sum of current roll, or `null` before roll |
| `board` | `Board` | The hex grid, intersections, edges, harbors |
| `supply` | `Supply` | Global supply state |
| `trash` | `Card[]` | All permanently removed cards |
| `longestRoadHolder` | `string \| null` | Player ID or `null` |
| `largestArmyHolder` | `string \| null` | Player ID or `null` |
| `gameOver` | `bool` | Whether an end condition has been met |
| `turnCount` | `Map<string, int>` | Turns taken per player (for tiebreaking) |

---

## 3. Game Setup Sequence

The following steps must execute in order before the first turn.

### 3.1 Board Generation

1. **Generate hex grid.** Place 19 hex tiles in the standard Catan layout (3-4-5-4-3 row pattern). Randomly assign terrain types using the standard distribution: 4 Forest, 4 Pasture, 4 Fields, 3 Hills, 3 Mountains, 1 Desert.
2. **Assign number tokens.** Randomly distribute tokens 2–12 across non-desert hexes using the standard Catan distribution (one each of 2 and 12; two each of 3–6 and 8–11). The desert receives no token.
3. **Place harbors.** Assign 9 harbors to coastal edge pairs: four generic 3:1 harbors and one each of the five 2:1 resource-specific harbors. Randomize positions.
4. **Place robber.** Set `hasRobber = true` on the desert hex.

### 3.2 Supply Initialization

| Pile | 2 Players | 3 Players | 4 Players |
|------|-----------|-----------|-----------|
| Estates | 8 | 12 | 12 |
| Duchies | 8 | 12 | 12 |
| Provinces | 8 | 12 | 12 |
| Curses | 10 | 20 | 30 |
| Each Kingdom card | 10 | 10 | 10 |
| Each Resource type | 19 | 19 | 19 |
| Copper | 60 | 60 | 60 |
| Silver | 40 | 40 | 40 |
| Gold | 30 | 30 | 30 |

Treasure bank quantities are recommendations. The system should treat them as effectively unlimited (auto-expand if needed) but track counts for UI display.

### 3.3 Kingdom Card Selection

Before play begins, 10 Kingdom card types are selected from the available pool. For the initial implementation, hardcode the recommended starter set (section 2.5.5). Future versions should support random selection, preset configurations, and player drafting.

### 3.4 Starting Deck Construction

For each player, create a deck of 10 cards: 1 Province and 9 Coppers. Shuffle the deck. Draw 7 cards into the player's hand.

**Important:** The starting Province begins in the deck (zone `DECK` or `HAND`), not attached to a building. It provides no coin conversion benefit until attached, with one exception: during the early game (before it is attached), the starting Province still provides coin conversion at any settlement the player owns. This exception is tracked via a `startingProvinceActive` flag on the player. The flag is set to `false` once the Province is attached.

*Design note: This exception may be removed after playtesting. Monitor whether players naturally attach on turn 1, making the exception irrelevant.*

### 3.5 Initial Placement

Execute two rounds of settlement + road placement.

**Round 1 (forward order, player 0 → player N):** Each player places one settlement on a valid intersection and one road on an adjacent edge.

**Round 2 (reverse order, player N → player 0):** Each player places a second settlement and adjacent road.

**Validation rules for settlement placement:**
- The intersection must be empty.
- No adjacent intersection (connected by one edge) may contain any building from any player. This is the **distance rule**.
- In round 2, the intersection does not need to connect to the player's existing road network (same as standard Catan).

**Validation rules for road placement:**
- The edge must be empty.
- The edge must be adjacent to the settlement just placed in the same round.

**Starting resource bonus:** After round 2 completes, each player gains one resource card for each non-desert hex adjacent to their **second** settlement. These go directly into the player's `hand` (not discard pile).

**Validation:** If a resource pile is empty (should not happen at game start), the player receives nothing for that resource type.

---

## 4. Turn State Machine

Each turn cycles through five phases in fixed order. The active player is `players[activePlayerIndex]`.

```
ROLL → ACTION → TRADE_BUILD → ATTACH → CLEANUP → (next player's ROLL)
```

### 4.1 Phase: ROLL

**Trigger:** Automatic on turn start.

**Input:** None (dice roll is server-generated).

**Process:**

1. Generate `diceResult = random(1,6) + random(1,6)`.
2. If `diceResult !== 7`, execute **Production** (section 4.1.1).
3. If `diceResult === 7`, execute **Robber Activation** (section 4.1.2).
4. Transition to `ACTION` phase.

#### 4.1.1 Production

For each hex where `numberToken === diceResult` AND `hasRobber === false`:

1. Identify all intersections adjacent to the hex.
2. For each intersection with a building:
   a. Determine the building owner (`playerId`).
   b. Determine production count: 1 for `SETTLEMENT`, 2 for `CITY`.
   c. For each unit of production, the player **chooses** one of:
      - **Take resource:** If `supply.resourcePiles[hex.resource] > 0`, create a resource card and add to player's `discardPile`. Decrement the supply pile.
      - **Convert to coin:** Only available if the building has at least one attached Province, OR if the player's `startingProvinceActive` flag is `true`. If available, the player receives a Treasure card from the bank to their `discardPile` instead of a resource card. The resource supply is **not** decremented (no resource card was taken).

**Coin conversion tiers:** The conversion tier is determined by how many resources the player converts in a **single production event** (i.e., from a single dice roll). The player accumulates a conversion count across all hexes that fire on this roll and all buildings, then chooses denominations:

| Resources Converted | Total Coin Value | Denomination Options |
|---------------------|-----------------|---------------------|
| 1 | 1 | 1 Copper |
| 2 | 2 | 2 Coppers, or 1 Silver |
| 3 | 3 | 3 Coppers, or 1 Silver + 1 Copper, or 1 Gold |
| 4 | 4 | 4 Coppers, or 2 Silvers, or 1 Gold + 1 Copper, etc. |
| N | N | Any combination of Copper (1), Silver (2), Gold (3) summing to N |

**Implementation:** After all production choices are made, prompt the converting player to select denominations from valid combinations summing to their total conversion count. All resulting Treasure cards go to `discardPile`.

**Edge case — empty resource supply:** If a hex produces but `supply.resourcePiles[hex.resource] === 0`, the player cannot take a resource card. They may still convert to a coin if a Province is attached. If no Province is attached, the player receives nothing.

**All players produce**, not just the active player. The system must prompt each player with buildings adjacent to producing hexes.

#### 4.1.2 Robber Activation (Rolling a 7)

No production occurs.

1. **Prompt the active player** to move the robber to a different hex (`hasRobber` must change from one hex to another).
2. **Coin wipe:** For every player (other than the active player) who has a building adjacent to the robber's new hex, move all Treasure cards from their `hand` to the `BANK` zone. This is not stealing — the active player does not receive them.
3. **No stealing occurs** on a natural 7.

#### 4.1.3 Production Prompt UX

Production involves decisions from potentially all players simultaneously. Two implementation approaches:

**Option A — Sequential prompts:** Process each player's production choices in turn order, starting with the active player. Simpler to implement but slower.

**Option B — Simultaneous prompts:** Present all production choices to all affected players at once. Each player independently selects resource or coin for each unit. Resolve once all players have submitted. Faster gameplay but requires synchronization.

Recommend Option B for production (since players' choices are independent) and sequential for robber-related actions.

### 4.2 Phase: ACTION

**Initial state:** `player.actionsRemaining = 1`, `player.tempCoins = 0`, `player.buysRemaining = 1`.

**Player may:**
- Play one Action card from `hand` (if `actionsRemaining > 0`).
- After playing, decrement `actionsRemaining` by 1.
- Resolve the card's effects immediately.
- Move the played card to `playArea`.
- If the card grants `+X Actions`, add X to `actionsRemaining`.
- Repeat (play another Action card) if `actionsRemaining > 0`.
- Pass (end Action phase) at any time, even with actions remaining.

**Effect resolution for "+X Cards":** Draw X cards from `deck` into `hand`. If `deck` is empty mid-draw, shuffle `discardPile` to form a new `deck`, then continue drawing. If both are empty, draw stops.

**Effect resolution for "+X Coins":** Add X to `player.tempCoins`.

**Effect resolution for "+X Buys":** Add X to `player.buysRemaining`.

**Militia special resolution:** See section 4.3.

**Moat reaction:** When any Attack card is played, before resolving the attack, prompt each other player: if they have a Moat in `hand`, they may reveal it. Revealing Moat negates all effects of that Attack on the revealing player, including Militia robber effects.

**Transition:** When the player passes or has no more actions/Action cards, move to `TRADE_BUILD`.

### 4.3 Robber Movement via Militia

When a Militia card is played, after resolving the standard Militia effects (+2 Coins, opponents discard down to 3), the following additional sequence executes:

1. **Prompt the Militia player** to move the robber to a different hex.
2. **Steal:** For each player (other than the Militia player) who has a building adjacent to the robber's new hex and did not reveal a Moat:
   a. Randomly select one card from their `hand` that is either a `RESOURCE` or `TREASURE` type (not `ACTION`, `VICTORY`, or `CURSE`).
   b. Move it to the Militia player's `hand`.
   c. If the target has no eligible cards, skip.
3. **Coin wipe:** For each player (other than the Militia player) adjacent to the robber's new hex who did not reveal a Moat, move all remaining Treasure cards from their `hand` to the `BANK`.
4. The robber blocks production on its new hex going forward.

**Order matters:** Steal happens before coin wipe. The steal could take a Treasure card; the wipe clears whatever Treasures remain after the steal.

### 4.4 Phase: TRADE_BUILD

The active player may perform the following actions in any order, any number of times, within the constraints of their resources, coins, and buy count.

#### 4.4.1 Build Road

**Cost:** 1 Brick + 1 Lumber from `hand`.

**Validation:**
- The player has the required resource cards in `hand`.
- The target edge is empty (no existing road).
- The target edge is adjacent to an intersection containing one of the player's buildings, OR adjacent to another of the player's roads.
- The player has road pieces remaining (max 15 per player).

**Resolution:**
1. Move the Brick and Lumber cards from `hand` to `TRASH` zone. **These are permanently removed from the game.** Do not return to supply.
2. Create a Road on the target edge.
3. Recalculate Longest Road (section 5.2).

#### 4.4.2 Build Settlement

**Cost:** 1 Brick + 1 Lumber + 1 Grain + 1 Wool from `hand`.

**Validation:**
- The player has the required resource cards in `hand`.
- The target intersection is empty.
- The **distance rule** is satisfied: no adjacent intersection has any building.
- The target intersection is adjacent to at least one of the player's roads.
- The player has settlement pieces remaining (max 5 per player).

**Resolution:**
1. Move the four resource cards from `hand` to `TRASH`.
2. Create a Settlement on the target intersection.
3. Recalculate Longest Road (section 5.2) — a new settlement could break an opponent's road continuity.

#### 4.4.3 Build City

**Cost:** 2 Grain + 3 Ore from `hand`.

**Validation:**
- The player has the required resource cards in `hand`.
- The target intersection contains one of the player's Settlements (not already a City).
- The player has city pieces remaining (max 4 per player).

**Resolution:**
1. Move the five resource cards from `hand` to `TRASH`.
2. Change the building type from `SETTLEMENT` to `CITY`. The settlement piece returns to the player's available pieces.
3. Attachment capacity doubles. Existing attached cards remain; new slots open.

#### 4.4.4 Buy Card from Supply

**Cost:** Coin cards from `hand` + `tempCoins` totaling at least the card's `coinCost`.

**Validation:**
- `player.buysRemaining > 0`.
- The target supply pile has cards remaining.
- The total coin value available (sum of Treasure `coinValue` in `hand` + `tempCoins`) meets or exceeds the card's `coinCost`.

**Resolution:**
1. The player selects which Treasure cards from `hand` to spend. The total value of selected Treasures + `tempCoins` must be >= `coinCost`. Overpayment is allowed; no change is given.
2. Move spent Treasure cards from `hand` to `BANK` zone. **Coins return to the bank. They are not trashed.**
3. Deduct spent value from `tempCoins` if applicable (deduct Treasure card values first, then `tempCoins`).
4. Decrement the supply pile count.
5. Create the purchased card and add to player's `discardPile`.
6. Decrement `buysRemaining` by 1.
7. Check game-end conditions (section 6).

#### 4.4.5 Trade with Players

**Initiator:** Active player only.

**Mechanic:** The active player proposes a trade to one or more other players. **Any cards in hand may be traded**, including Resource, Treasure, Action, Victory, and Curse cards. Both parties must agree.

**Resolution:**
1. Move traded cards from each player's `hand` to the other player's `discardPile`.
2. **Trading does not trash cards.** Resources change hands but remain in the game.

**Implementation note:** Provide a trade proposal UI where the active player selects cards to offer and cards requested. Other players accept/reject/counter. Only the active player may initiate.

#### 4.4.6 Bank Trade (4:1)

**Cost:** 4 identical Resource cards from `hand`.

**Validation:**
- The player has 4 cards of the same resource type in `hand`.

**Resolution:**
1. Move the 4 Resource cards from `hand` to `SUPPLY` — **resources traded to the bank return to the resource supply piles.** They are not trashed.
2. Take 1 Resource card of the player's choice from the supply to the player's `hand` (immediate, not discard).

#### 4.4.7 Harbor Trade (2:1 or 3:1)

**Prerequisite:** The player has a building on an intersection serviced by a harbor.

**Cost:**
- **2:1 specific harbor:** 2 Resource cards matching the harbor's type.
- **3:1 generic harbor:** 3 identical Resource cards of any type.

**Validation:**
- The player has a building on one of the harbor's `intersectionIds`.
- The player has the required cards in `hand`.

**Resolution:**
1. Move the traded Resource cards from `hand` to `TRASH`. **Resources traded through harbors are permanently removed from the game.**
2. Take 1 Resource card of the player's choice from the supply to the player's `hand` (immediate, not discard).

### 4.5 Phase: ATTACH

The active player may attach Victory cards from `hand` to their buildings on the board.

**For each attachment:**

**Validation:**
- The card is a Victory card (`ESTATE`, `DUCHY`, or `PROVINCE`) in the player's `hand`.
- The target building belongs to the player.
- The target building has capacity remaining for that card type (see section 2.3.2).

**Resolution:**
1. Remove the card from `hand`.
2. Add it to the building's `attachedCards` array.
3. Set the card's `zone` to `ATTACHED`.
4. **Province attachment:** If the card is a Province, the building now enables coin conversion for any adjacent resource production. If this is the player's starting Province, set `startingProvinceActive = false`.
5. **The card is permanently removed from the deck cycle.** It will never enter the discard pile or be drawn again.
6. Recalculate VP totals.

### 4.6 Phase: CLEANUP

**Resolution:**
1. Move all cards from `hand` to `discardPile`.
2. Move all cards from `playArea` to `discardPile`.
3. Reset `tempCoins = 0`.
4. Reset `actionsRemaining = 1`.
5. Reset `buysRemaining = 1`.
6. Draw 7 cards from `deck` to `hand`. If `deck` runs out, shuffle `discardPile` into `deck` and continue drawing. If both are empty, draw stops.
7. Increment `turnCount` for the active player.
8. Check game-end conditions (section 6).
9. If game is not over, advance `activePlayerIndex = (activePlayerIndex + 1) % players.length`. Transition to `ROLL`.

---

## 5. Scoring System

### 5.1 Victory Point Calculation

VP is calculated from the following sources. **Settlements and cities do not directly score VP.**

| Source | VP Value | Notes |
|--------|----------|-------|
| Attached Estate | +1 | Per card attached to any building |
| Attached Duchy | +3 | Per card attached to any building |
| Attached Province | +6 | Per card attached to any building |
| VP Kingdom cards | +1 each | Cards in deck, hand, or discard pile (if the selected Kingdom set includes any) |
| Longest Road | +2 | Awarded to one player (section 5.2) |
| Largest Army | +2 | Awarded to one player (section 5.3) |
| Curse | -1 | Per Curse in deck, hand, or discard pile |

**Unattached Victory cards** in a player's deck, hand, or discard pile **do not score VP** (except VP Kingdom cards, which always score). Only attached Victory cards count.

### 5.2 Longest Road

**Calculation:** For each player, find the longest continuous path of connected roads. A road chain is broken if an opponent's building sits on an intermediate intersection.

**Award rules:**
- First player to reach a continuous road length of 5 or more receives Longest Road (+2 VP).
- If another player builds a longer continuous road, the award transfers.
- If the current holder's road is broken (e.g., by an opponent's settlement on a shared intersection) and their longest continuous path drops below 5, remove the award. If another player qualifies (>= 5), they receive it. If multiple players tie at the longest length >= 5, no one holds it until the tie is broken.

**Recalculate on:** road placement, settlement placement, city placement.

### 5.3 Largest Army

**Calculation:** Track cumulative `militiaPlays` per player.

**Award rules:**
- First player to reach 3 Militia plays receives Largest Army (+2 VP).
- If another player surpasses the current holder's count, the award transfers.

**Recalculate on:** Militia card play.

---

## 6. Game End Conditions

Check after every card purchase (4.4.4) and at the end of every cleanup phase (4.6).

The game ends immediately when **any one** of the following is true:

1. **Province pile is empty:** `supply.victoryPiles.province === 0`.
2. **Three supply piles are empty:** Count all piles (Kingdom, Victory, Curse, Resource, Treasure) where remaining count === 0. If count >= 3, game ends.

### 6.1 Final Scoring

1. For each player, calculate VP per section 5.1.
2. Rank players by VP descending.
3. **Tiebreaker:** Fewer turns taken wins. If still tied, shared victory.

### 6.2 End-of-Game UI

Display final scores with a breakdown: attached card VP, Longest Road, Largest Army, Curses. Show each player's board position and deck contents for review.

---

## 7. Validation Rules Reference

This section consolidates all validation checks the rules engine must enforce.

### 7.1 Distance Rule

When placing a settlement, no adjacent intersection (connected by one edge) may contain any building from any player.

### 7.2 Road Connectivity

A road must be placed on an edge adjacent to one of the player's buildings or existing roads. Exception: during initial placement, the road must be adjacent to the settlement placed in the same round.

### 7.3 Settlement Connectivity

Outside of initial placement, a settlement must be placed on an intersection adjacent to at least one of the player's roads.

### 7.4 Resource Availability

Before granting a resource card during production, verify `supply.resourcePiles[type] > 0`. If the pile is empty, the player receives nothing (unless converting to a coin via Province).

### 7.5 Attachment Capacity

Before attaching a Victory card, verify the building has not exceeded its type-specific limit (section 2.3.2).

### 7.6 Piece Limits

| Piece | Max per Player |
|-------|---------------|
| Roads | 15 |
| Settlements | 5 |
| Cities | 4 |

When a settlement is upgraded to a city, the settlement piece returns to the player's available pool.

---

## 8. Card Effect Resolution Reference

This section provides implementation-level pseudocode for each Action card in the starter set.

### Chapel (Cost 2)
```
prompt player to select 0–4 cards from hand
for each selected card:
    move card from hand to TRASH
```

### Moat (Cost 2)
```
draw 2 cards from deck to hand
// Reaction (passive): when an Attack card is played by another player,
// before attack resolves, prompt this player:
//   "Reveal Moat to block?" → if yes, skip all attack effects for this player
//   including Militia robber steal and coin wipe
```

### Village (Cost 3)
```
draw 1 card from deck to hand
player.actionsRemaining += 2
```

### Militia (Cost 4)
```
player.tempCoins += 2
for each other player (who did not reveal Moat):
    prompt them to discard from hand until hand.length <= 3
// Then execute robber movement (section 4.3):
prompt Militia player to move robber to a new hex
for each non-Moat player adjacent to new robber hex:
    steal 1 random RESOURCE or TREASURE card from their hand → Militia player's hand
for each non-Moat player adjacent to new robber hex:
    move all TREASURE cards from their hand → BANK
```

### Remodel (Cost 4)
```
prompt player to select 1 card from hand to trash
trashedCost = card.coinCost  // (resource cards have coinCost 0)
move card from hand to TRASH
prompt player to select a card from supply where card.coinCost <= trashedCost + 2
move selected card from supply to player's discardPile
```

### Smithy (Cost 4)
```
draw 3 cards from deck to hand
```

### Festival (Cost 5)
```
player.actionsRemaining += 2
player.buysRemaining += 1
player.tempCoins += 2
```

### Market (Cost 5)
```
draw 1 card from deck to hand
player.actionsRemaining += 1
player.buysRemaining += 1
player.tempCoins += 1
```

### Mine (Cost 5)
```
prompt player to select a TREASURE card from hand
trashedValue = selectedCard.coinValue
move selected card from hand to TRASH
prompt player to select a TREASURE from supply where coinCost <= trashedValue + 3
// Note: Copper=0, Silver=3, Gold=6 for purchase cost purposes
// Practically: Copper→Silver or Gold, Silver→Gold
move selected card from supply to player's HAND (not discard)
```

### Witch (Cost 5)
```
draw 2 cards from deck to hand
for each other player (who did not reveal Moat):
    if supply.cursePile > 0:
        create Curse card, add to their discardPile
        supply.cursePile -= 1
```

---

## 9. Resource Lifecycle

This section clarifies where cards go when they leave a player's hand, since the game has three distinct disposal behaviors.

### 9.1 Trashed (Permanent Removal)

Cards moved to the `TRASH` zone are gone forever. They cannot be recovered.

**Triggers:**
- Resource cards spent on building (roads, settlements, cities)
- Resource cards traded through harbors (2:1, 3:1)
- Cards trashed by Action card effects (Chapel, Remodel, Mine)

### 9.2 Returned to Bank (Recirculation)

Treasure cards spent to buy from the supply return to the `BANK` zone and can be gained again through future production conversion.

**Triggers:**
- Coins spent to purchase supply cards
- Coins wiped by robber (natural 7 or Militia)

### 9.3 Returned to Supply (Replenishment)

Resource cards traded 4:1 to the bank go back into the resource supply piles. They can be gained again through future production.

**Triggers:**
- 4:1 bank trade only

### 9.4 Summary Table

| Action | Resource Cards | Treasure Cards |
|--------|---------------|----------------|
| Spend on building | → TRASH | N/A |
| Spend on supply purchase | N/A | → BANK |
| Trade with players | → other player's discard | → other player's discard |
| 4:1 bank trade | → SUPPLY (replenished) | N/A |
| Harbor trade (2:1/3:1) | → TRASH | N/A |
| Trashed by Action card | → TRASH | → TRASH (Mine only) |
| Robber coin wipe | N/A | → BANK |

---

## 10. UI Requirements

### 10.1 Board View

- Render hex grid with terrain types, number tokens, and robber position.
- Display buildings (settlements/cities) at intersections with player color coding.
- Display roads along edges with player color coding.
- Harbors should be visible along the coast with type labels.
- Clicking an intersection or edge should contextually offer build actions when in `TRADE_BUILD` phase.
- The robber must be draggable/selectable when the player is prompted to move it.

### 10.2 Player Dashboard

- **Hand:** Display all cards in the player's hand. Cards should be selectable for spending, trading, attaching, or trashing.
- **Deck/Discard:** Show card counts (not contents) for the player's own deck and discard pile. Optional: show contents of discard pile on hover/click.
- **Play Area:** Show Action cards played this turn.
- **Attached Cards:** For each building, show attached Victory cards and remaining capacity. This can be displayed as a sidebar, tooltip on hover over the building, or a dedicated player board panel.
- **Turn Indicators:** Display current `actionsRemaining`, `buysRemaining`, `tempCoins`, and total spendable coins (Treasures in hand + tempCoins).
- **VP Counter:** Live VP total per player, visible to all.

### 10.3 Supply View

- Show all supply piles with remaining counts.
- Purchasable cards should be clickable during `TRADE_BUILD` phase when the player has sufficient coins and buys remaining.
- **Resource piles** should visually indicate scarcity (e.g., color shift as counts decrease, depletion warning below 5).
- Empty piles should be clearly marked.

### 10.4 Trade Interface

- Active player can drag cards to a trade proposal area and specify desired cards.
- Other players see incoming proposals and can accept, reject, or counter.
- Show both sides of the trade clearly before confirmation.
- Both parties must confirm to execute.

### 10.5 Production Choice UI

- When a player's hex produces, present a per-unit choice: "Take [Resource]" or "Convert to Coin" (if Province is attached).
- For coin conversions, after all choices are made, present denomination selection.
- If multiple hexes fire for a player, group all choices together.

### 10.6 Phase Indicator

- Clearly display the current phase and active player.
- Show a "Done" / "End Phase" button for phases where the player may pass.
- Auto-advance phases when no actions are possible (e.g., Action phase with no Action cards in hand).

### 10.7 Game Log

- Maintain a scrollable log of all game actions: dice rolls, production, builds, purchases, trades, attacks, robber moves, attachments.
- Each entry should include the acting player, the action, and any targets.
- Log entries should link to relevant board positions where applicable.

---

## 11. Open Questions and Playtest Notes

The following items are flagged for resolution during playtesting. They represent tuning parameters and design decisions that cannot be finalized without live play data.

| ID | Question | Current Default | Alternatives |
|----|----------|----------------|-------------|
| PT-01 | Hand size | 7 | 6 or 8. If turns feel starved, increase. If turns drag, decrease. |
| PT-02 | Resource supply per type | 19 | Increase for longer games, decrease for tighter scarcity. |
| PT-03 | Starting Province early-game exception | Enabled (provides conversion before attachment) | Disable and force attachment before conversion. May cause dead early turns. |
| PT-04 | Province conversion scope | Any adjacent resource | Revert to declared single type if coin generation is too fast. |
| PT-05 | Militia robber power | Steal + coin wipe | Remove steal, keep only coin wipe if Militia is too oppressive. |
| PT-06 | Harbor trade resource disposal | Trashed permanently | Return to supply (same as bank trade) if scarcity is too aggressive. |
| PT-07 | Empty resource piles as game-end trigger | Count toward "three empty piles" condition | Exclude resource piles from count if games end too quickly. |
| PT-08 | Mine card — Treasure cost mapping | Copper=0, Silver=3, Gold=6 | May need custom cost values for this hybrid since Treasures aren't purchasable. |
| PT-09 | Remodel — Resource card cost | Resource cards have coinCost 0 | Consider giving resource cards a nominal cost (1–2) to make Remodel more interesting with them. |
| PT-10 | Physical card attachment representation | Unspecified (playtest decision) | Tuck under pieces, player tableau, or numbered tokens with off-board groups. |
