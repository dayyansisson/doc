# Dominion of Catan

## A Deck-Building Strategy Game for 2–4 Players

Dominion of Catan is a hybrid game that combines the spatial settlement-building of Catan with the deck-building engine of Dominion. Players compete on a shared island, building roads, settlements, and cities to expand their resource production and economic reach. Meanwhile, each player manages a personal deck of resource cards, coin cards, and action cards — buying powerful Kingdom cards from a shared supply and attaching Victory cards to their settlements to score points.

The board is your engine. The deck is your tool. Victory belongs to the player who builds the most prosperous kingdom.

---

## Components

### From Catan

- 19 hexagonal terrain tiles (Hills, Forests, Mountains, Fields, Pastures, Desert)
- 18 number tokens (2–12)
- Ocean frame with harbor pieces (3:1 generic harbors and 2:1 resource-specific harbors)
- 1 robber pawn
- 2 dice
- Player pieces in 4 colors: 5 settlements, 4 cities, 15 roads each

### From Dominion (adapted)

- Treasure cards: Copper (1 coin), Silver (2 coins), Gold (3 coins) — shared bank supply
- Victory cards: Estate (1 VP, cost 2 coins), Duchy (3 VP, cost 5 coins), Province (6 VP, cost 8 coins)
- 10 Kingdom card piles (selected from the available sets before each game, 10 copies each)
- Curse cards (−1 VP each): 10 for 2 players, 20 for 3 players, 30 for 4 players

### Additional

- Resource cards in five types: Brick, Lumber, Ore, Grain, Wool — shared supply

---

## Definitions

**Province:** Provinces are worth 6 VP and serve a dual purpose — each Province attached to a settlement or city allows the owning player to convert **any** resource produced by adjacent hexes into coins during production. Your starting Province defines your kingdom's coin conversion engine, so its placement matters.

**Victory Card Slots:** Settlements and cities have limited capacity for attached Victory cards. Settlements hold up to 1 Province, 2 Duchies, and 3 Estates. Cities hold up to 2 Provinces, 4 Duchies, and 6 Estates.

**Coin Conversion:** When a hex adjacent to a settlement or city with an attached Province produces, the owning player may choose to receive a coin card instead of the resource card — regardless of the resource type. A Province only enables conversion at the settlement or city it is attached to.

---

## Setup

### The Board

Assemble the island exactly as in standard Catan. Randomize the terrain tiles and number tokens within the ocean frame. Place harbors around the coast. Place the robber on the Desert tile.

### The Supply

Place the following card piles in the center of the table.

**Treasure Piles:** Copper, Silver, and Gold — large supply, available throughout the game.

**Victory Piles:** Estates, Duchies, and Provinces. For 2 players, each pile contains 8 cards. For 3–4 players, each pile contains 12 cards.

**Curse Pile:** 10 Curses for 2 players, 20 for 3, 30 for 4.

**Kingdom Piles:** Choose 10 Kingdom card sets for the game. Place 10 copies of each in the supply (Victory-type Kingdom cards follow standard Victory pile counts instead).

**Resource Piles:** Brick, Lumber, Ore, Grain, and Wool — **finite shared supply**. The recommended starting quantity is 19 cards per resource type (76 total for a 4-player game). Resources spent on building are **trashed** (removed from the game), so this supply will shrink over the course of play. When a resource pile is empty, that resource can no longer be gained through production — only through trading with other players.

### Starting Decks

Each player receives a starting deck of 10 cards: **1 Province** and **9 Coppers**. The Province is not yet attached to a settlement; it begins in the player's deck and should be attached to a settlement as early as possible. Once attached, it enables coin conversion for any resource produced by adjacent hexes at that location.

Shuffle your deck face down and draw 7 cards as your starting hand.

### Initial Placement

Following standard Catan rules, each player places settlements and roads in two rounds.

**First round (in turn order):** Each player places one settlement at any valid intersection and one road adjacent to it.

**Second round (in reverse turn order):** Each player places a second settlement and one adjacent road.

The standard **distance rule** applies — no settlement may be placed within two intersections of any existing settlement or city.

After initial placement, each player gains one resource card for each terrain hex adjacent to their **second** settlement. These resource cards go directly into the player's hand (not their discard pile) as a one-time starting bonus.

---

## Turn Structure

Each turn follows five phases in order: **Roll, Action, Trade & Build, Attach, Clean-up.**

### Phase 1 — Roll

The active player rolls both dice and adds the results.

**Production (any number except 7):** Every terrain hex with a matching number token produces. **All players** with a settlement or city adjacent to a producing hex gain cards. For each card gained, the player chooses one of the following:

- Take one **resource card** of the hex's type into their **discard pile**.
- If the producing hex is adjacent to a settlement or city that has an **attached Province**, the player may take one **coin card** into their **discard pile** instead, regardless of the resource type. The coin tier depends on how many resources the player converts in this single production event:
  - 1 resource converted → 1 Copper (1 coin)
  - 2 resources converted → 2 Coppers, or 1 Silver (player's choice)
  - 3 resources converted → 3 Coppers, 1 Silver + 1 Copper, or 1 Gold (player's choice)
  - 4+ resources → continue the pattern, mixing denominations freely up to the total coin value.

A Province only enables conversion at the settlement or city it is attached to. All production at settlements without Provinces always produces resource cards.

Cities produce **double** — two cards per adjacent producing hex instead of one. Each card is chosen independently (the player could take one resource and convert the other to a coin).

Harbors and bank trades are available during Phase 3. **2:1 harbors** and **3:1 harbors** offer efficient conversion but **trash the resources** traded through them. The universal **4:1 bank trade** returns resources to the supply. See Phase 3 for full details.

**Rolling a 7:**

No hexes produce. The active player must move the robber to a different terrain hex. When the robber is placed:

- Every player with a settlement or city adjacent to the robber's new hex **loses all coin cards currently in their hand**. Those coins return to the bank.
- **No stealing occurs** on a natural 7. The robber simply blocks and discards coins.

The robber **blocks production** on its hex. As long as the robber sits on a terrain hex, that hex does not produce when its number is rolled.

### Phase 2 — Action

The active player may play **one Action card** from their hand. Follow the card's instructions. If the card grants +Action(s), the player may play additional Action cards accordingly.

Action cards that have been played remain in front of the player (in the "play area") until Clean-up.

**Militia and the Robber:** When a player plays a Militia card, in addition to its normal card effect, the player **moves the robber** to a different terrain hex. The Militia robber is more powerful than a natural 7:

1. **Steal first:** The player who played the Militia **steals one random coin or resource card** (not Action cards) from **each** player who has a settlement or city adjacent to the robber's new hex.
2. **Then discard:** Every player with a settlement or city adjacent to the robber's new hex **loses all remaining coin cards in their hand**. Those coins return to the bank.
3. The robber blocks production on its hex as usual.

### Phase 3 — Trade & Build

The active player may perform any of the following actions, in any order, as many times as they can afford.

**Build on the board** by spending resource cards from hand:

| Structure  | Cost                                   | Notes                                                                 |
| ---------- | -------------------------------------- | --------------------------------------------------------------------- |
| Road       | 1 Brick + 1 Lumber                    | Place on an edge adjacent to your existing road, settlement, or city. |
| Settlement | 1 Brick + 1 Lumber + 1 Grain + 1 Wool | Must connect to your road network. Distance rule applies.             |
| City       | 2 Grain + 3 Ore                       | Replaces an existing settlement. Doubles production and VP capacity.  |

**Spent resource cards are trashed** — removed from the game permanently. They do not return to the shared supply. This means the total pool of resources in the game is finite. As players build, the available resources shrink, making production, trading, and timing increasingly critical.

If a hex produces but its resource type has no cards remaining in the supply, the player receives nothing (unless converting to coins via a Province).

**Buy cards from the supply** by spending coin cards from hand:

Spend coins whose total value meets or exceeds the card's cost. Purchased cards go to the player's **discard pile**. Spent coin cards return to the **bank** (coins are not trashed — they recirculate). By default, a player may make **one purchase per turn** (additional purchases require +Buy from Action cards).

**Trade with other players:**

The active player may negotiate and execute trades with any other player. **Any cards in hand may be traded**, including resource cards, coin cards, and Action cards. Traded cards go into the receiving player's **discard pile** (not their hand). Only the active player may initiate trades. Trading does not trash cards — resources change hands but remain in the game.

**Bank trades (4:1):**

Any player may trade 4 identical resource cards from their hand to the bank for any 1 resource of their choice. **Resources traded to the bank return to the supply** — they are not trashed and can be gained again through future production.

**Harbor trades (2:1 or 3:1):**

Players with settlements or cities on harbors may use them: 2:1 (specific resource) or 3:1 (any matching resources). **Resources traded through a harbor are trashed** — they are removed from the game permanently, not returned to the supply. The received resource comes from the supply into the player's **hand** (not discard pile — this is an immediate-use conversion). Harbor trades are efficient but costly in a resource-scarce game.

### Phase 4 — Attach

The active player may attach any number of Victory cards (Estates, Duchies, or Provinces) from their **hand** to their settlements and cities on the board, provided the settlement or city has open slots of the appropriate type.

**Settlement capacity:** 3 Estates, 2 Duchies, 1 Province.

**City capacity:** 6 Estates, 4 Duchies, 2 Provinces.

When attaching a **Province**, it immediately enables coin conversion for any resource produced by hexes adjacent to that settlement or city. No resource type declaration is needed.

Attached cards are **permanently removed from the player's deck**. They sit physically on or beside the settlement/city on the board and count toward the player's VP total at the end of the game.

*Note: The physical method for representing attached cards (tucking under pieces, player tableau, numbered tokens, etc.) is left to player preference. Use whatever is clearest for your group.*

### Phase 5 — Clean-up

The active player places all cards from their **hand** and from the **play area** (played Action cards) into their discard pile. Then draw **7 cards** from the top of their deck. If the deck runs out mid-draw, shuffle the discard pile to form a new deck and continue drawing.

---

## Scoring and Victory Points

**Settlements and cities do not directly score victory points.** They serve as infrastructure — providing resource production, coin conversion, and VP card capacity.

Victory points come exclusively from:

- **Attached Estates:** 1 VP each
- **Attached Duchies:** 3 VP each
- **Attached Provinces:** 6 VP each
- **Victory Point Kingdom cards** (if any are in the selected set): 1 VP each
- **Longest Road:** 2 VP (first player to build a continuous road of at least 5 segments)
- **Largest Army:** 2 VP (first player to play 3 Militia cards — track cumulative Militia plays per player)
- **Curse cards:** −1 VP each (count Curses remaining in the player's deck, hand, and discard pile)

Longest Road and Largest Army are **free-standing awards** — they do not require settlement slots.

---

## Game End

The game ends immediately after the completion of any player's turn in which **one** of the following conditions is met:

1. **The Province pile is empty.**
2. **Any three supply piles are empty.** This includes any combination of Kingdom, Treasure, Victory, Resource, or Curse piles.

When the game ends, each player totals their victory points from all attached Victory cards, any VP Kingdom cards in their deck/hand/discard, Longest Road, Largest Army, and Curses. **The player with the most victory points wins.** In case of a tie, the tied player who took fewer turns wins. If still tied, the players share the victory.

---

## Special Rules Summary

### The Robber

The robber moves when a 7 is rolled or when a Militia card is played.

**On a natural 7:**
- All players adjacent to the robber's new hex lose all coin cards in their hand (returned to bank).
- No stealing occurs.
- The hex is blocked from producing until the robber moves again.

**On a Militia:**
- The Militia player steals one random coin or resource card (not Actions) from **each** adjacent player first.
- Then all adjacent players lose all remaining coin cards in their hand (returned to bank).
- The hex is blocked from producing until the robber moves again.

### Provinces and Coin Conversion

- Each player starts with one Province in their deck. It should be attached to a settlement as early as possible.
- A Province attached to a settlement or city allows the owning player to convert **any** resource produced by adjacent hexes into coins. No resource type declaration is needed.
- Multiple Provinces on different settlements give a player coin conversion at multiple locations. A city with two Province slots has double conversion capacity at that location.
- An unattached Province still in a player's deck/hand counts as 6 VP at end of game but provides no conversion benefit. (A player's **starting** Province, before it is attached, still provides conversion as a special exception during the early game.)

### Harbors and Bank Trades

Harbors and bank trades are separate systems from Provinces. Harbors trade resources for resources; Provinces convert resources to coins.

- **Harbor trades (2:1 and 3:1)** trash the resources traded — they are removed from the game permanently. Harbors are efficient but accelerate resource scarcity.
- **Bank trades (4:1)** return the traded resources to the supply, preserving the resource pool. Less efficient, but sustainable.

---

## Kingdom Cards

Select 10 Kingdom card sets before each game. The base Dominion Kingdom card pool can be used with the following adaptations.

### Recommended Starter Set

The following 10 Kingdom cards are recommended for your first games. They test the most important interactions between the board economy and the deck engine.

**Chapel** (cost 2) — Trash up to 4 cards from your hand. *Tests deck-thinning in a hybrid economy — do you trash early Coppers when they came from production? Can you trim unwanted resource cards to sharpen your draws?*

**Moat** (cost 2) — +2 Cards. Reaction: reveal from hand when another player plays an Attack card to negate its effect on you. **Also negates robber coin loss** if the robber is moved by a Militia and you reveal Moat. *Essential defensive counter to Militia and Witch.*

**Village** (cost 3) — +1 Card, +2 Actions. *The basic action chain enabler. Tests whether multi-action turns work with the hybrid economy.*

**Militia** (cost 4) — +2 Coins. Each other player discards down to 3 cards in hand. **Additionally, move the robber:** steal one random coin or resource card from each adjacent player, then all adjacent players lose remaining coins in hand. *The centerpiece conflict card — it does triple duty as economy, disruption, and board control.*

**Remodel** (cost 4) — Trash a card from your hand. Gain a card costing up to 2 coins more than the trashed card. *Gets interesting with the dual economy — can you Remodel resources into Victory cards? Tests the cost relationships between card types.*

**Smithy** (cost 4) — +3 Cards. *Clean engine card. Drawing 3 extra cards from a deck full of mixed resources and coins means bigger, more flexible turns.*

**Festival** (cost 5) — +2 Actions, +1 Buy, +2 Coins. *Pure acceleration. Two bonus coins plus a buy means you could grab an Estate off just a Festival with no coins in hand.*

**Market** (cost 5) — +1 Card, +1 Action, +1 Buy, +1 Coin. *Tests the +Buy mechanic — buying a Kingdom card and a Victory card in the same turn opens up powerful plays.*

**Mine** (cost 5) — You may trash a Treasure from your hand. Gain a Treasure to your hand costing up to 3 coins more than the trashed card. *Upgrades Copper→Silver→Gold, accelerating buying power. Interesting tension with the robber — a Gold is a bigger target but more efficient.*

**Witch** (cost 5) — +2 Cards. Each other player gains a Curse. *Curses are −1 VP and clog your deck. In this game, a clogged deck means fewer resources and coins reaching your hand. Tests whether Curses are manageable or devastating alongside the larger deck sizes.*

### Adaptations for All Kingdom Cards

**Militia** moves the robber in addition to its normal effect. The Militia player steals one random coin or resource card from each adjacent player, then all adjacent players lose remaining coins in hand (see above).

**Moat** negates both the stealing and robber coin loss from Militia in addition to its normal Reaction (see above).

All other base Dominion Kingdom cards function as written, with the understanding that "+X Coins" on Action cards provides temporary spending power for that turn only (it does not generate physical coin cards).

Some Kingdom cards may need minor thematic adjustments for the hybrid context. These can be refined through playtesting.

---

## Quick Reference

### Turn Phases

| Phase          | What Happens                                                              |
| -------------- | ------------------------------------------------------------------------- |
| 1. Roll        | Roll dice. All players produce resources or coins into their discard pile. |
| 2. Action      | Play Action cards from your hand.                                         |
| 3. Trade & Build | Spend resources to build, coins to buy, negotiate trades.              |
| 4. Attach      | Socket Victory cards from your hand into settlements/cities.              |
| 5. Clean-up    | Discard hand and play area. Draw 7 cards.                                 |

### Building Costs (Resource Cards)

| Structure  | Brick | Lumber | Grain | Wool | Ore |
| ---------- | ----- | ------ | ----- | ---- | --- |
| Road       | 1     | 1      | —     | —    | —   |
| Settlement | 1     | 1      | 1     | 1    | —   |
| City       | —     | —      | 2     | —    | 3   |

### Victory Card Costs (Coin Cards) and Capacity

| Card    | Cost    | VP  | Per Settlement | Per City |
| ------- | ------- | --- | -------------- | -------- |
| Estate  | 2 coins | 1   | up to 3        | up to 6  |
| Duchy   | 5 coins | 3   | up to 2        | up to 4  |
| Province | 8 coins | 6   | up to 1        | up to 2  |

### Maximum VP Per Structure (fully loaded)

| Structure  | Estates | Duchies | Provinces | Total VP |
| ---------- | ------- | ------- | -------- | -------- |
| Settlement | 3 (3 VP) | 2 (6 VP) | 1 (6 VP) | 15 VP   |
| City       | 6 (6 VP) | 4 (12 VP) | 2 (12 VP) | 30 VP  |

---

## Design Notes (for playtesting)

- **Hand size of 7** may need adjustment. If turns feel starved for options, consider 8. If turns drag with too many choices, consider 6.
- **Coin conversion scaling** (1→Copper, 2→Silver, 3→Gold) may need tuning. If coins accumulate too fast, reduce conversion efficiency. If too slow, consider letting harbors also convert resources to coins at a poor rate.
- **Kingdom card pool:** Not all 25 base Dominion cards may work cleanly in this hybrid. Cards that reference "gaining cards costing up to X" work fine. Cards that trash Treasures (Mine, Moneylender) interact interestingly with the coin economy and should be tested. Cards that reference "Victory cards in your deck" (like Gardens-style effects) need clarification since many Victory cards will be attached to the board rather than in the deck.
- **Game length:** With the dual economy and board expansion, games may run longer than either parent game. Monitor whether the Province pile empties at a satisfying pace or if an alternative timer is needed.
- **Starting Province exception** (providing conversion before attachment) prevents a dead early game but adds a rules wrinkle. Playtest whether this is necessary or if players naturally attach on turn 1 anyway.
- **Province conversion speed:** Since Provinces convert any adjacent resource (not just a declared type), a single Province on a settlement touching three productive hexes could convert all incoming production to coins. This is self-balancing (no resources means no building), but monitor whether players snowball too quickly into the Dominion economy. If coin generation is too fast, consider reverting to the declared-type variant where each Province only converts one resource type.
- **Robber split** (no stealing on natural 7, stealing on Militia) makes Militia very strong. If Militia feels oppressive, consider removing the steal and keeping only the coin wipe for both triggers.
- **Resource scarcity** is a major lever. The recommended 19 cards per resource type is a starting point. If the game ends before meaningful scarcity kicks in, reduce the supply. If players feel strangled too early, increase it. Note that harbor trades (2:1 and 3:1) trash resources permanently while bank trades (4:1) return them to the supply — this split means harbors are efficient but accelerate scarcity, while bank trades are wasteful but preserve the resource pool. Chapel trashing resource cards is also permanent loss — this may need a special rule or simply serve as an interesting risk/reward choice.
- **Empty resource piles as game-end trigger:** Since resources are finite, a resource pile running out could count toward the "any three supply piles empty" end condition. This creates an alternate path to ending the game through aggressive building rather than Province buying.
