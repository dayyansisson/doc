# Dominion of Catan — UI/UX Design Document

**Version:** 0.1.0-draft
**Status:** Pre-implementation
**Companion to:** Technical Specification v0.1.0

---

## 1. Design Philosophy

The visual identity of Dominion of Catan is defined by restraint. The interface should feel like a premium tool — quiet, confident, and invisible until you need it. Every element earns its place. If something can be removed without losing function, remove it.

**Core principles:**

Monochrome by default. The entire UI lives in grayscale — whites, grays, and blacks. The only color in the application is player identity. When you see color, it means "this belongs to a player." Everything else recedes.

Information on demand. The board and cards show the minimum needed at a glance. Details reveal themselves through hover (desktop) or tap (mobile). Tooltips, expanded panels, and contextual overlays provide depth without clutter.

Motion with purpose. Every animation communicates state change. Nothing moves for decoration. Transitions are snappy with flair — fast enough to not slow gameplay, polished enough to feel premium. Target duration: 300–600ms with easing.

Mobile first, desktop enhanced. The canonical experience is a phone held in one hand. Desktop gets more space but not a different mental model.

---

## 2. Visual Foundation

### 2.1 Color System

#### Monochrome Palette

The application uses a semantic grayscale palette that inverts between light and dark mode. All values reference CSS custom properties.

**Light mode:**

| Token | Value | Usage |
|-------|-------|-------|
| `--surface-primary` | `#FFFFFF` | App background, card faces |
| `--surface-secondary` | `#F5F5F7` | Panels, trays, inactive areas |
| `--surface-tertiary` | `#E8E8ED` | Borders, dividers, subtle fills |
| `--surface-elevated` | `#FFFFFF` | Cards, modals (with shadow) |
| `--text-primary` | `#1D1D1F` | Headings, primary labels |
| `--text-secondary` | `#6E6E73` | Descriptions, counts, metadata |
| `--text-tertiary` | `#AEAEB2` | Placeholder, disabled states |
| `--border-default` | `#D2D2D7` | Card borders, input outlines |
| `--border-subtle` | `#E8E8ED` | Dividers, grid lines |

**Dark mode:**

| Token | Value | Usage |
|-------|-------|-------|
| `--surface-primary` | `#000000` | App background |
| `--surface-secondary` | `#1C1C1E` | Panels, trays |
| `--surface-tertiary` | `#2C2C2E` | Borders, dividers |
| `--surface-elevated` | `#1C1C1E` | Cards, modals (with shadow) |
| `--text-primary` | `#F5F5F7` | Headings, primary labels |
| `--text-secondary` | `#8E8E93` | Descriptions, counts |
| `--text-tertiary` | `#48484A` | Placeholder, disabled |
| `--border-default` | `#38383A` | Card borders, input outlines |
| `--border-subtle` | `#2C2C2E` | Dividers, grid lines |

#### Player Colors

These are the only chromatic colors in the application. They are saturated and bold — they need to read clearly against both the monochrome UI and each other on the hex grid.

| Player | Color | Hex | Usage |
|--------|-------|-----|-------|
| Player 1 | Electric Blue | `#2979FF` | Buildings, roads, card tints, UI accents when active |
| Player 2 | Coral Red | `#FF5252` | Buildings, roads, card tints, UI accents when active |
| Player 3 | Amber | `#FFD740` | Buildings, roads, card tints, UI accents when active |
| Player 4 | Emerald | `#69F0AE` | Buildings, roads, card tints, UI accents when active |

Player color appears on: board pieces (settlements, cities, roads), the active player indicator in the phase bar, the player's name/avatar in the scoreboard, and as a subtle tint on the tab bar during that player's turn. Player color does **not** tint card borders or hand elements — cards are always monochrome.

### 2.2 Typography

**Font family:** Inter for all UI text. Inter Tight for numbers, counters, and compact labels where space is constrained (hex number tokens, card costs, VP counts, supply pile counts).

**Scale:**

| Token | Size | Weight | Font | Usage |
|-------|------|--------|------|-------|
| `--type-display` | 32px | 600 (Semi) | Inter | Phase titles, game-over screen |
| `--type-heading` | 20px | 600 (Semi) | Inter | Section headers, player names |
| `--type-body` | 15px | 400 (Regular) | Inter | Card descriptions, log entries |
| `--type-label` | 13px | 500 (Medium) | Inter | Button labels, tab labels, metadata |
| `--type-caption` | 11px | 500 (Medium) | Inter | Tooltips, badge counts, subtle info |
| `--type-number` | 18px | 700 (Bold) | Inter Tight | Hex tokens, card costs, VP counts |
| `--type-number-sm` | 13px | 600 (Semi) | Inter Tight | Supply counts, deck/discard counts |

**Line height:** 1.4 for body text, 1.2 for headings and numbers.

**Letter spacing:** Default for body. -0.01em for headings. +0.02em for `--type-caption` and `--type-label`.

### 2.3 Spacing and Layout

**Base unit:** 4px. All spacing derives from multiples of 4.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | 4px | Icon-to-label gaps, tight padding |
| `--space-sm` | 8px | Inline element gaps, card inner padding |
| `--space-md` | 16px | Section padding, card margins |
| `--space-lg` | 24px | Panel padding, major section gaps |
| `--space-xl` | 32px | Screen margins, hero spacing |
| `--space-2xl` | 48px | Major layout gaps |

**Border radius:**

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 6px | Buttons, badges, small elements |
| `--radius-md` | 12px | Cards, panels, inputs |
| `--radius-lg` | 20px | Modals, sheets, large containers |
| `--radius-full` | 9999px | Pills, circular badges, settlement icons |

### 2.4 Shadows and Elevation

Shadows are used sparingly — only for elements that float above the surface (cards in hand, modals, tooltips).

| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| `--shadow-card` | `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)` | `0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)` |
| `--shadow-elevated` | `0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)` | `0 4px 12px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.2)` |
| `--shadow-modal` | `0 12px 40px rgba(0,0,0,0.15)` | `0 12px 40px rgba(0,0,0,0.5)` |

### 2.5 Motion

**Easing:** `cubic-bezier(0.25, 0.1, 0.25, 1.0)` (Apple-style ease) for most transitions. `cubic-bezier(0.34, 1.56, 0.64, 1)` (slight overshoot) for playful interactions like card draws and building placement.

**Duration tiers:**

| Tier | Duration | Usage |
|------|----------|-------|
| Micro | 150ms | Hover states, button presses, selection highlights |
| Standard | 300ms | View transitions, panel slides, card movements |
| Expressive | 500–600ms | Dice roll, building placement, robber movement |
| Sequence | 80–120ms stagger | Drawing multiple cards, production events across hexes |

**Rules:**
- Never animate and delay simultaneously. If something takes time, show progress.
- Stagger sequential items (e.g., drawing 7 cards) with 80–120ms delays between each.
- Exiting elements animate faster than entering elements (exit at 200ms, enter at 400ms).
- Reduce motion: respect `prefers-reduced-motion`. Replace all kinetic animations with simple fades.

---

## 3. Iconography

All game elements are represented by custom monochrome icons. Icons are designed on a 24x24 grid with 1.5px stroke weight. They should feel geometric, precise, and part of a cohesive family.

### 3.1 Resource Icons

Each resource type has a distinct, instantly recognizable silhouette. These appear on hex tiles, resource cards, and anywhere a resource type is referenced.

| Resource | Icon Description | Notes |
|----------|-----------------|-------|
| Brick | Two stacked rectangles (bricks) | Horizontal orientation, slight offset |
| Lumber | Simple tree silhouette | Triangular/geometric pine, not organic |
| Ore | Faceted gem / crystal | Angular, 3–4 facets |
| Grain | Single wheat stalk | Vertical, with seed head |
| Wool | Stylized cloud / sheep silhouette | Rounded, soft geometry |

### 3.2 Treasure Icons

| Treasure | Icon Description | Notes |
|----------|-----------------|-------|
| Copper | Single circle with "1" | Thin stroke, number centered |
| Silver | Single circle with "2" | Slightly thicker stroke or double ring |
| Gold | Single circle with "3" | Filled circle or triple ring |

### 3.3 Card Type Icons

Used in card headers and as type indicators in the supply.

| Card Type | Icon Description |
|-----------|-----------------|
| Action | Lightning bolt |
| Treasure | Circle (coin) |
| Victory | Star |
| Resource | Hexagon |
| Curse | Skull or broken circle |

### 3.4 Building Icons

| Building | Icon | Board Representation |
|----------|------|---------------------|
| Settlement | Small filled circle | 10px diameter, player-colored, positioned at intersection |
| City | Filled octagon | 14px diameter, player-colored, positioned at intersection |
| Road | Thick line segment | 3px stroke, player-colored, positioned along edge |

### 3.5 Game State Icons

| Element | Icon |
|---------|------|
| Robber | Filled dark circle with mask/bandit silhouette, or simple "X" overlay |
| Dice | Two rounded squares with dot patterns |
| Deck (draw pile) | Stacked rectangles |
| Discard | Stacked rectangles, slightly fanned |
| Trash | Circle with diagonal line |
| Harbor (generic) | Anchor |
| Harbor (specific) | Anchor + resource icon |

### 3.6 Attachment Indicator Dots

When Victory cards are attached to a building, tiny dots (4px diameter) ring the building icon on the board. Dots are monochrome (`--text-secondary`) and arranged in a circular pattern around the building center.

| Attached Count | Dot Layout |
|---------------|------------|
| 1 | Single dot above |
| 2 | Two dots, left and right |
| 3 | Three dots, evenly spaced at 120° |
| 4 | Four dots, evenly spaced at 90° |
| 5+ | Five dots at 72° spacing, then a small number badge if more |

Tapping (mobile) or hovering (desktop) over a building with dots reveals a tooltip showing the full breakdown: attached Estates, Duchies, Provinces, remaining capacity, and total VP from that building.

---

## 4. Board View

The board is the primary view. It renders the hex grid, all buildings, roads, harbors, the robber, and the dice.

### 4.1 Hex Grid

**Layout:** The standard Catan 3-4-5-4-3 hex arrangement. Hexes are rendered as flat-top hexagons with **no border strokes**. Adjacent hexes are separated by a small gap (2–3px) creating a clean, airy grid.

**Terrain shading:** Each terrain type is assigned a subtle grayscale fill to provide visual differentiation without color. The fills should be close enough to feel monochrome at a glance, but distinct enough to tell apart when looking carefully.

| Terrain | Light Mode Fill | Dark Mode Fill | Notes |
|---------|----------------|----------------|-------|
| Forest | `#E2E2E7` | `#2A2A2E` | Mid-light |
| Pasture | `#EBEBF0` | `#252528` | Lightest |
| Fields | `#E7E7EB` | `#282830` | Light-mid |
| Hills | `#D8D8DD` | `#323236` | Mid-dark |
| Mountains | `#CECED3` | `#3A3A3E` | Darkest |
| Desert | `#F2F2F5` | `#1E1E22` | Near-background, almost empty |

**Hex contents:** Each non-desert hex displays two elements, vertically stacked and centered:
1. **Resource icon** — 20px, `--text-secondary` color.
2. **Number token** — Rendered as a filled circle (28px diameter, `--surface-elevated` fill, subtle shadow) containing the number in `--type-number` and pip dots below. The circle sits on the hex center.

**Number token pip dots:** Faithful to Catan probability. The number of dots equals the number of ways to roll that number (e.g., 6 and 8 get 5 dots, 2 and 12 get 1 dot). Dots are 3px circles, `--text-tertiary`, spaced 5px apart in a horizontal row beneath the number.

**Desert hex:** No icon, no number token. Just the flat fill. The robber's default home.

**Robber:** A dark filled circle (18px) with a subtle icon or "X" mark, overlaid on the hex center. It obscures the number token when present. Should feel heavy and blocking.

### 4.2 Harbors

Harbors appear on the ocean border outside the hex grid. Each harbor connects to two coastal intersections.

**Rendering:** A small pill-shaped label positioned along the coast between its two intersections. Contains: the harbor type icon (anchor for generic, anchor + resource icon for specific) and the ratio text ("3:1" or "2:1").

**Styling:** `--surface-secondary` background, `--border-default` outline, `--text-secondary` text and icon. Should feel subtle — harbors are important but shouldn't compete with the hex grid for attention.

### 4.3 Buildings and Roads

**Settlements:** Small filled circles (10px diameter) in the player's color, centered on the intersection point. When the building has attached Victory cards, arrangement dots (section 3.6) appear around the circle.

**Cities:** Filled octagons (14px) in the player's color. Same attachment dot behavior as settlements, but the dots orbit at a slightly larger radius to account for the larger shape.

**Roads:** Thick line segments (3px stroke) in the player's color, drawn along the hex edge between two intersections. Roads should have rounded line caps.

**Empty intersections and edges:** Invisible by default. During the `TRADE_BUILD` phase, valid placement targets appear as ghost elements — faint dashed circles (intersections) or dashed lines (edges) in `--border-subtle`. These highlight on hover/tap to indicate they are interactive.

### 4.4 Interaction Layer

**Pan and zoom:** The board is pannable (drag/swipe) and zoomable (pinch on mobile, scroll wheel on desktop). Default zoom should fit the full board with comfortable margins. Minimum zoom shows the full board; maximum zoom shows roughly 5–7 hexes filling the screen.

**Tap/click targets:** Intersections and edges have invisible hit areas larger than their visual representation (minimum 44px tap target on mobile per accessibility guidelines). During build phases, tapping a valid target shows a contextual action: "Build Settlement here?" / "Place Road here?" with a confirm/cancel.

**Hex tap:** Tapping a hex during robber placement highlights it. Tapping a building on the board reveals the attachment tooltip (section 3.6).

### 4.5 Dice Display

The dice result appears as a brief overlay on the board view during the Roll phase. Two dice icons animate (subtle rotation + number cycling for 400ms, then land). The sum appears as a large number below the dice, then the entire overlay fades out over 300ms.

For a roll of 7, the dice overlay could flash with a subtle warning treatment (brief pulse, slightly heavier shadow) before transitioning to the robber placement prompt.

### 4.6 Phase Bar

A persistent thin bar at the top of the board view showing:
- The active player's name and color indicator (small colored dot or line).
- The current phase label ("Roll", "Action", "Trade & Build", "Attach", "Clean-up").
- A progress indicator showing the five phases as dots, with the current one filled.

The bar should be minimal — it's always-on information that shouldn't distract from the board. Height: ~44px. Background: `--surface-primary` with a subtle bottom border.

**Pass-and-play addition:** During pass-and-play, the phase bar also shows a small "End Turn" button (appears during Attach and lingers into Clean-up as a manual trigger).

---

## 5. Deck View

The deck view is the second tab. It contains everything card-related: the player's hand, discard pile, play area, deck count, and the supply/shop.

### 5.1 Layout (Mobile)

From top to bottom:

1. **Player header** — Player name, color indicator, VP count, deck count, discard count. Compact single row.
2. **Play area** — Horizontal row of Action cards played this turn. Only visible during a turn when cards have been played. Collapsed/hidden otherwise.
3. **Hand** — Horizontal scrollable row of cards. This is the primary interactive zone.
4. **Divider / section label** — "Supply"
5. **Supply grid** — Scrollable grid of purchasable card piles.

### 5.2 Layout (Desktop — Side Panel)

On desktop, the deck view occupies the right panel (~380px wide) beside the board. Same content hierarchy as mobile but in a vertical scrollable column. The hand may display as a 2–3 column grid instead of a horizontal scroll if the panel is wide enough.

### 5.3 Card Design

Cards are compact rectangular elements styled to resemble physical cards. All cards share a base frame, with distinct visual treatments per type.

**Base card dimensions (mobile):** 72px wide × 100px tall. Rounded corners (`--radius-md`). Subtle shadow (`--shadow-card`). Background: `--surface-elevated`.

**Card anatomy (front face):**
- **Top-left corner:** Cost badge (coin icon + number) in a small circle. Not shown on resource cards (they have no cost).
- **Center:** Card type icon (large, 28px).
- **Below icon:** Card name (Inter, `--type-caption`, centered).
- **Bottom edge:** Subtle type indicator strip (2px tall) differentiating the card type.

**Type-specific treatments:**

| Card Type | Border Treatment | Background | Type Strip |
|-----------|-----------------|------------|------------|
| Resource | Solid 1px `--border-default` | `--surface-elevated` | None (default) |
| Treasure | Solid 1.5px `--text-secondary` | `--surface-elevated` | Dotted line pattern |
| Action | Dashed 1px `--text-secondary` | `--surface-elevated` | Solid dark line |
| Victory | Double-line border (1px gap 1px) | `--surface-elevated` | Small star at center |
| Curse | Solid 1px, slightly thinner | `--surface-secondary` (dimmed) | Broken/jagged line |

**Card interaction states:**
- **Default:** Card sits in row with `--shadow-card`.
- **Hover (desktop):** Card lifts slightly (translateY -2px), shadow intensifies. A tooltip appears after 300ms showing the full card description.
- **Tap/selected:** Card lifts (translateY -8px), a subtle glow or outline in `--text-primary` appears. Subsequent taps on action buttons (Spend, Attach, Trash, Trade) operate on the selected card(s).
- **Multi-select:** Multiple cards can be selected (e.g., for spending resources on building). Each selected card lifts. A count badge appears near the action button.

### 5.4 Hand Display

A horizontally scrollable row positioned in the lower-mid portion of the deck view. Cards overlap slightly (60% visible) when the hand is large, spreading out when the hand is small. Scroll indicators (subtle gradient fade on left/right edges) appear when the hand extends beyond the viewport.

**Contextual grouping:** Cards in hand are auto-sorted by type: Resources (grouped by resource type), then Treasures, then Action cards, then Victory cards, then Curses. Within each group, identical cards are adjacent. A small type divider (thin vertical line, 1px, `--border-subtle`) separates groups.

### 5.5 Play Area

A compact horizontal row above the hand. Only visible when Action cards have been played this turn. Cards here are slightly dimmed (opacity 0.7) to indicate they've been used. Label: "Played this turn" in `--type-caption`.

### 5.6 Deck and Discard Indicators

Displayed in the player header row as compact elements:

- **Deck:** Stacked-card icon + count number. Tapping does nothing (deck is face-down / private).
- **Discard:** Fanned-card icon + count number. Tapping opens a scrollable overlay showing all cards in the discard pile (read-only, for strategic review).

### 5.7 Supply Panel

Below the hand, after a labeled divider ("Supply"). Displays all purchasable card piles in a grid.

**Grid layout (mobile):** 2 columns. Each cell shows: card icon, card name, cost, and remaining count. Cells are tappable — during `TRADE_BUILD` phase, tapping a supply pile initiates a purchase flow (select coins to spend → confirm).

**Grid layout (desktop):** 3 columns in the side panel.

**Section grouping within the supply:**
1. Victory cards (Estate, Duchy, Province) — always shown.
2. Kingdom cards (the 10 selected for this game) — main section.
3. Treasure cards — shown for reference (not directly purchasable, but players need to see bank counts).
4. Curse pile — shown with count.
5. Resource piles — shown with remaining counts. **Scarcity indicator:** when a resource pile drops below 5, the count turns bold. When it hits 0, the cell dims and shows "Depleted."

**Empty pile treatment:** The cell remains visible but dims to `--text-tertiary` with a strikethrough on the name or a "0" badge. This is important for tracking the three-empty-piles game end condition.

---

## 6. Responsive Layout

### 6.1 Mobile (< 768px)

**Structure:** Full-screen single-view with a bottom tab bar.

```
┌─────────────────────────┐
│ Phase Bar               │
├─────────────────────────┤
│                         │
│   Active View           │
│   (Board or Deck)       │
│                         │
│                         │
├─────────────────────────┤
│ [Board]    [Deck]       │
└─────────────────────────┘
```

**Tab bar:** Two tabs at the bottom. Icons + labels. The active tab has a filled icon and a subtle player-color underline during the current player's turn. Height: 56px. Background: `--surface-primary` with top border.

**Auto-switching behavior:** Certain game events trigger an automatic tab switch with a brief transition animation. The player can always manually switch back.

| Event | Auto-switch to | Reason |
|-------|---------------|--------|
| Dice roll | Board | Player needs to see which hexes fired |
| Robber placement prompt | Board | Spatial decision required |
| Production choices (your hexes) | Deck | Player needs to choose resource vs. coin for each card |
| Opponent plays Attack | Deck | Player may need to react (Moat) or discard |
| Your Action phase starts | Deck | Player needs to see Action cards in hand |
| Build phase starts | Board | Player needs to see the board for placement |
| Attach phase starts | Deck | Player needs to see Victory cards in hand |
| Clean-up / draw | Deck | Player sees new hand forming |

**Transition animation:** Horizontal slide (board slides left, deck slides right, or vice versa). Duration: 300ms, standard ease. A brief toast appears at the top: "Building phase — tap a location" or "Your turn — choose actions" providing context for the switch.

### 6.2 Desktop (≥ 1024px)

**Structure:** Side-by-side layout. No tab bar.

```
┌────────────────────────────────────────────────┐
│ Phase Bar                                      │
├──────────────────────────┬─────────────────────┤
│                          │ Player Header       │
│                          ├─────────────────────┤
│   Board View             │ Play Area           │
│   (pannable, zoomable)   ├─────────────────────┤
│                          │ Hand                │
│                          ├─────────────────────┤
│                          │ Supply              │
│                          │                     │
└──────────────────────────┴─────────────────────┘
```

**Board panel:** Fills remaining horizontal space (fluid). Minimum width: 600px.

**Deck panel:** Fixed width: 380px. Right-aligned. Vertically scrollable. Contains the same content as the mobile deck view in a single column.

**No auto-switching needed** since both views are visible simultaneously. Contextual highlights (glowing borders, attention pulses) guide the player's eye to the relevant panel.

### 6.3 Tablet (768px – 1023px)

Use the mobile tab-bar layout but with larger card sizes and more generous spacing. If the device is in landscape orientation, consider the desktop side-by-side layout with a narrower deck panel (320px).

---

## 7. Interactive Flows

### 7.1 Dice Roll

1. Phase bar updates to "Roll." Board view is active.
2. Two dice icons appear centered on the board overlay. They animate: brief rotation (200ms) + number faces cycling (3–4 rapid changes over 300ms) + land on final values with a subtle bounce (100ms overshoot).
3. The sum appears below the dice in `--type-display` size. Holds for 400ms.
4. Overlay fades out (200ms).
5. Producing hexes briefly pulse (a subtle radial glow expanding outward, one staggered animation per hex at 80ms intervals) to show which hexes fired.
6. If the roll is 7, the sum is displayed with a heavier visual weight (larger, slightly bolder). After the overlay fades, the board enters robber-placement mode (section 7.5).

### 7.2 Production Choices

After dice roll resolves and producing hexes are identified:

1. If the current player has production choices (Province enables coin conversion), auto-switch to deck view (mobile).
2. For each unit of production, show a compact choice card: the resource icon on the left, a divider, and a coin icon on the right. The player taps one side. A checkmark appears on the chosen side, and the card briefly pulses.
3. If multiple units are being converted to coins, a denomination picker appears after all choices are confirmed: "You converted 3 resources. Choose denominations:" with pill-shaped options (e.g., "3× Copper", "1 Silver + 1 Copper", "1 Gold"). The selected option animates: coins slide into the discard pile icon.
4. Gained cards (resources or coins) animate into the discard pile with a staggered slide-down effect (80ms between each).

### 7.3 Playing Action Cards

1. During Action phase, the deck view highlights Action cards in hand with a subtle pulsing border.
2. Player taps an Action card. It lifts and a "Play" button appears (or the card can be dragged upward into the play area).
3. On confirmation, the card animates from the hand to the play area row (300ms slide + slight rotation).
4. Card effects resolve with appropriate UI: "+3 Cards" triggers three cards animating from the deck icon into the hand. "+2 Coins" shows a coin counter incrementing in the player header.
5. Actions remaining counter decrements visually.

### 7.4 Building on the Board

1. During `TRADE_BUILD` phase on mobile, the board view shows ghost placement targets (dashed outlines at valid intersections/edges).
2. Player taps a valid target. A contextual popup appears near the tap point: "Build Settlement — 1 Brick, 1 Lumber, 1 Grain, 1 Wool" with a "Build" button. Required resources are shown with icons. If the player has them, icons are `--text-primary`. If missing any, the missing ones are `--text-tertiary` and the Build button is disabled.
3. On "Build" confirmation:
   a. The required resource cards animate out of the hand (deck view) toward a trash icon (300ms, staggered).
   b. On the board, the settlement/city/road animates into place: a scale-up from 0 to full size with the overshoot easing (400ms). A brief circular ripple emanates from the placement point.
   c. The ghost targets update to reflect the new board state.

### 7.5 Robber Placement

1. The board dims slightly except for hex tiles (overlay at 20% opacity over non-hex elements).
2. A prompt appears at the top: "Move the robber."
3. All hexes except the current robber hex become tappable (highlighted on hover with a subtle border). The current robber hex is excluded (dimmed further).
4. Player taps a hex. The robber animates from its current position to the new hex (a smooth arc path, 500ms, standard ease). The hex briefly shakes or pulses on landing.
5. If triggered by Militia: after robber placement, steal and coin wipe resolve. Affected players' coin cards in hand animate out (flying toward the Militia player for steals, dissolving for wipes). A toast confirms: "Stole 1 Silver from Player 2. Player 3 lost 2 coins."

### 7.6 Buying from Supply

1. In deck view during `TRADE_BUILD` phase, supply cards with affordable costs are highlighted (full opacity). Unaffordable cards are dimmed.
2. Player taps a supply card. A purchase confirmation sheet slides up from the bottom: card name, description, cost, and available coins in hand. Coin cards in hand that will be spent are pre-selected (auto-selecting optimal combination). The player can tap to adjust which coins to spend.
3. On "Buy" confirmation:
   a. Spent coin cards animate out of the hand and shrink/fade (returning to bank).
   b. The purchased card animates from the supply into the discard pile icon (an arc path, 400ms).
   c. Supply pile count decrements. If the pile is now empty, the cell dims with a "Depleted" label.
   d. Buys remaining counter decrements.

### 7.7 Attaching Victory Cards

1. During Attach phase in the deck view, Victory cards in hand are highlighted.
2. Player taps a Victory card. The view auto-switches to the board (mobile). Buildings with open capacity for that card type glow with a subtle pulse.
3. Player taps a building. The card animates from the bottom of the screen (representing the hand) into the building's position on the board, shrinking to a dot as it arrives. The new attachment dot appears with a pop-in animation.
4. VP counter increments with a brief highlight.

### 7.8 Trading with Players

1. During `TRADE_BUILD` phase, a "Trade" button is available in the deck view.
2. Tapping it opens a trade sheet: two columns — "You offer" (left) and "You request" (right). The player drags cards from their hand into the "offer" column, and taps card types/amounts for the "request" column.
3. A "Propose" button sends the offer. In pass-and-play, this shows the trade proposal on screen and the other player(s) can accept or reject by tapping.
4. On acceptance, cards animate between the two players' zones.

### 7.9 Clean-up and Draw

1. All cards in hand and play area animate out simultaneously — sliding down and fading (300ms).
2. Brief pause (200ms).
3. Seven cards animate in from the deck icon, one at a time with staggered timing (80ms apart), sliding into the hand row. Each card flips from face-down (a plain `--surface-tertiary` card back) to face-up as it arrives.
4. The hand auto-sorts into type groups after all cards are drawn (a quick 200ms shuffle animation).

---

## 8. Pass-and-Play Mode

Pass-and-play is a temporary mode for early playtesting where all players share one device. It requires hiding each player's private information (hand) between turns.

### 8.1 Turn Handoff

At the end of a player's turn (after Clean-up), the screen transitions to a handoff state:

1. The entire UI blurs (backdrop-filter: blur(20px)) with a dark overlay (40% opacity).
2. A centered prompt appears over the blur:
   - Player color dot + "Pass to [Player Name]"
   - A "Ready" button below.
   - Optionally: a small scoreboard summary showing all players' VP (public information).
3. The device is passed to the next player. They tap "Ready."
4. The blur lifts (300ms fade), and the new player's turn begins with their hand visible.

### 8.2 Secret Information During Others' Turns

In pass-and-play, when it's not your turn, you shouldn't see other players' hands. Since all players are on one device, the handoff screen solves this — the previous player's cards are cleared before the next player sees anything.

**During simultaneous events** (e.g., production choices for multiple players after a dice roll): show each player's choices sequentially. After the active player makes their production choices, a mini-handoff appears: "Pass to [Player 2] for production choices" → blur → Ready → Player 2 makes choices → blur → repeat → return to active player.

### 8.3 Removable Architecture

All pass-and-play logic should be isolated in a dedicated module/component layer:
- A `PassAndPlayProvider` context/wrapper that manages turn handoffs.
- The handoff overlay is a single component conditionally rendered.
- Player hand visibility is controlled via a `isActivePlayer` flag.
- When multiplayer networking is implemented, the `PassAndPlayProvider` is simply removed and replaced with a network session manager. No game logic changes.

---

## 9. Toasts, Tooltips, and Overlays

### 9.1 Toasts

Brief, non-blocking messages that appear at the top of the screen and auto-dismiss after 3 seconds. Used for confirmations and events that don't require action.

**Styling:** Pill-shaped container, `--surface-elevated` background, `--shadow-card`, centered horizontally. Text in `--type-label`. Slides down from top (200ms), holds, slides up to dismiss (150ms).

**Examples:**
- "Player 2 built a settlement."
- "You gained 2 Lumber and 1 Brick."
- "Robber moved to Mountains (hex 7). You lost 3 coins."
- "Province pile is empty — final turn!"

### 9.2 Tooltips

Appear on hover (desktop, 300ms delay) or tap-and-hold (mobile, 200ms). Used for detailed information about any game element.

**Styling:** Compact container, `--surface-elevated` background, `--shadow-elevated`, `--radius-md`. Arrow/caret pointing to the source element. Max width: 240px. Text in `--type-body` for descriptions, `--type-caption` for metadata.

**Tooltip content by element:**

| Element | Tooltip Shows |
|---------|--------------|
| Hex tile | Terrain type, resource type, number token, probability (X/36), robber status |
| Building (with attachments) | Owner, type, attached cards list, VP from this building, remaining capacity per slot type |
| Building (empty) | Owner, type, "No cards attached", full capacity listing |
| Harbor | Type, trade ratio, which intersections it services |
| Supply pile card | Full card name, cost, complete effect description, remaining count |
| Card in hand | Full card name, type, cost, complete effect description |
| Player name/score | Full VP breakdown: attached VP, Longest Road, Largest Army, Curses |

### 9.3 Game Log Overlay

Accessed via a small icon button in the phase bar (a list/scroll icon). Tapping it opens a slide-up sheet (mobile) or slide-out panel (desktop) showing the full game log.

**Log entry format:** Each entry is a single line: `[Player dot] [Player name] [action description]`. Timestamps are omitted for cleanliness. Entries are in reverse chronological order (newest at top).

**Log granularity:** One entry per meaningful game action. Summarized, not exhaustive. Examples:
- "Player 1 rolled an 8."
- "Player 1 gained 1 Lumber, converted 1 Ore to Silver."
- "Player 2 played Militia. Robber moved to Hills (hex 4). Stole 1 Brick from Player 3. Player 3 lost 2 coins."
- "Player 1 built a settlement at intersection 22."
- "Player 1 bought a Smithy (4 coins)."
- "Player 1 attached a Province to settlement at intersection 22."
- "Longest Road transferred to Player 3 (7 segments)."
- "Lumber pile depleted."

---

## 10. Accessibility

### 10.1 Requirements

- All interactive elements have minimum 44px tap targets on mobile.
- Color is never the sole differentiator for information. Player identity uses both color and position/name. Card types use distinct border treatments in addition to icons.
- All icons have accessible labels (aria-label / alt text).
- Tooltips are accessible via keyboard focus (Tab) on desktop.
- The game log provides a text-based record of all state changes for screen reader users.
- `prefers-reduced-motion`: replace all kinetic animations with 150ms opacity fades. Remove dice roll animation, card flip animation, and staggered draws — use instant transitions instead.
- `prefers-color-scheme`: auto-detect and apply light/dark mode. Provide a manual toggle in settings.
- Contrast ratios: all text meets WCAG AA (4.5:1 for body, 3:1 for large text). Monochrome palette inherently supports this, but verify player colors against both light and dark backgrounds.

### 10.2 Colorblind Considerations

Player colors are chosen to be distinguishable under common colorblind conditions (protanopia, deuteranopia, tritanopia). Additionally, each player has a distinct shape marker that appears alongside their color in the scoreboard and optionally on the board:

| Player | Color | Shape Marker |
|--------|-------|-------------|
| Player 1 | Electric Blue | Circle |
| Player 2 | Coral Red | Triangle |
| Player 3 | Amber | Square |
| Player 4 | Emerald | Diamond |

These shape markers appear in the scoreboard, turn indicators, and can optionally overlay building icons on the board (toggle in settings).

---

## 11. Settings

Accessed via a gear icon in the phase bar or a separate settings screen from the main menu.

| Setting | Options | Default |
|---------|---------|---------|
| Theme | Light / Dark / System | System |
| Reduced motion | On / Off / System | System |
| Colorblind markers | On / Off | Off |
| Card sort order | Type / Manual | Type |
| Auto-view switching | On / Off | On |
| Sound effects | On / Off | On |
| Confirm builds | Always / Never / Expensive only | Expensive only |
| Game log detail | Summarized / Verbose | Summarized |

---

## 12. Screen Inventory

A complete list of screens and states the application must support.

### 12.1 Pre-Game

| Screen | Description |
|--------|-------------|
| Main menu | Game title, "New Game" button, "Settings" button, "How to Play" link |
| Game setup | Player count selector (2–4), player name inputs, player color selection, Kingdom card set selector (start with "Recommended Starter Set" only) |
| Board setup | Animated board generation (hexes tile in, tokens place, harbors appear). "Shuffle" button to re-randomize. "Start" button to confirm. |
| Initial placement | Two rounds of settlement + road placement. Phase bar shows "Placement Round 1/2" and the active player. Ghost targets on valid intersections/edges. |

### 12.2 In-Game

| Screen/State | Description |
|-------------|-------------|
| Board view (idle) | Board with all placed pieces. Phase bar showing current phase and player. |
| Board view (building) | Ghost placement targets visible. Contextual build popups. |
| Board view (robber) | Dimmed overlay, hex selection for robber placement. |
| Deck view (hand) | Hand row, play area, deck/discard counts, supply grid. |
| Deck view (buying) | Purchase confirmation sheet for a selected supply card. |
| Production choice overlay | Per-unit resource-or-coin selector. Denomination picker. |
| Trade proposal sheet | Two-column trade builder. Propose/accept/reject flow. |
| Pass-and-play handoff | Blur + centered prompt between turns. |
| Game log overlay | Scrollable log of all game actions. |

### 12.3 Post-Game

| Screen | Description |
|--------|-------------|
| Game over | Winner announcement. Full scoreboard with VP breakdowns per player. Board snapshot. "Play Again" and "Main Menu" buttons. |

---

## 13. Sound Design Notes

Sound is secondary to visuals and should be subtle, almost subliminal. Think muted clicks, soft chimes, and gentle thuds — never attention-grabbing or annoying.

| Event | Sound Character |
|-------|----------------|
| Dice roll | Soft rattle, brief, two-tone landing |
| Card draw | Quiet paper slide |
| Card play | Soft tap/click |
| Build placement | Gentle thud, slightly reverbed |
| Coin gained | Soft metallic clink |
| Coin lost (robber) | Muted descending tone |
| Purchase | Register-like soft ding |
| Attack card played | Brief low tone |
| Turn start | Barely perceptible chime |
| Game end | Subtle ascending chord |

All sounds must be individually toggleable and respect the system mute/volume setting.

---

## 14. Implementation Notes

### 14.1 Technology Recommendations

This document is platform-agnostic, but the following stack aligns with the design requirements:

- **Rendering:** Canvas (for the hex board — better performance for pan/zoom/animations) + DOM (for cards, UI chrome, overlays). Alternatively, a full WebGL approach for the board with DOM overlays.
- **Framework:** A reactive component framework (Svelte, React, or Vue) for the UI layer. The pass-and-play module should be an isolated provider/context that can be swapped for a network layer later.
- **Animation:** CSS transitions and animations for UI elements. RequestAnimationFrame for board rendering animations. A spring-based animation library (e.g., Svelte motion, Framer Motion, or similar) for physics-feeling card movements.
- **State management:** The game state machine (section 4 of the technical spec) should drive all UI updates. The UI should be a pure function of game state — no UI-only state that contradicts the game engine.

### 14.2 Asset Requirements

| Asset Type | Count | Notes |
|-----------|-------|-------|
| Resource icons (5) | SVG, 24x24 grid | Brick, Lumber, Ore, Grain, Wool |
| Treasure icons (3) | SVG, 24x24 grid | Copper, Silver, Gold |
| Card type icons (5) | SVG, 24x24 grid | Action, Treasure, Victory, Resource, Curse |
| Building shapes (2) | SVG, inline | Circle (settlement), Octagon (city) |
| Game state icons (6+) | SVG, 24x24 grid | Robber, dice, deck, discard, trash, harbors |
| Kingdom card illustrations (10) | SVG or raster, 48x48 | One per starter set card, optional — can launch with icon-only |
| Sound effects (10+) | Short audio clips, <1s each | See section 13 |

### 14.3 Performance Targets

| Metric | Target |
|--------|--------|
| First meaningful paint | < 2s |
| Board render (19 hexes + pieces) | < 16ms (60fps) |
| Animation frame rate | 60fps sustained during transitions |
| Card draw stagger (7 cards) | Complete in < 1s total |
| Tap-to-response (any interaction) | < 100ms to visual feedback |
| Memory (mobile) | < 100MB active |
