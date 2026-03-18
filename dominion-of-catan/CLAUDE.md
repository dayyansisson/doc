# Dominion of Catan — Developer Guide

A hybrid board/card game combining Catan's spatial settlement-building with Dominion's deck-building engine. Built with SvelteKit + Svelte 5, TypeScript, and tested with Vitest + Playwright.

## Quick Start

```bash
pnpm install
pnpm dev          # Dev server at http://localhost:5173
```

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server (localhost:5173) |
| `pnpm build` | Production build |
| `pnpm preview` | Preview production build |
| `pnpm check` | TypeScript + Svelte type checking |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier |
| `pnpm test:unit` | Unit tests (game engine, no browser) |
| `pnpm test:client` | Component tests (happy-dom) |
| `pnpm test:e2e` | Playwright E2E tests (requires browser) |
| `pnpm test` | All unit + client tests |

## Project Structure

```
dominion-of-catan/
├── src/
│   ├── lib/
│   │   ├── engine/            # Pure game logic — no framework deps
│   │   │   ├── state.ts       # All type definitions
│   │   │   ├── actions.ts     # Action type union
│   │   │   ├── reducer.ts     # (state, action) → state
│   │   │   ├── validation.ts  # Move validation rules
│   │   │   ├── production.ts  # Dice + resource/coin distribution
│   │   │   ├── robber.ts      # Robber logic (re-exports production.ts)
│   │   │   ├── scoring.ts     # VP, longest road, largest army
│   │   │   ├── setup.ts       # Board gen, deck init, initial placement
│   │   │   ├── hex-math.ts    # Hex grid geometry utilities
│   │   │   └── ai/            # AI player implementations
│   │   ├── components/
│   │   │   ├── board/         # SVG board components
│   │   │   ├── deck/          # Card and hand components
│   │   │   ├── ui/            # Chrome: PhaseBar, Toast, TabBar, etc.
│   │   │   └── passplay/      # Pass-and-play handoff overlay
│   │   ├── stores/
│   │   │   └── game.svelte.ts # Reactive game state ($state rune)
│   │   └── styles/
│   │       ├── tokens.css     # Design system custom properties
│   │       ├── typography.css # Font faces and type scale
│   │       └── reset.css      # Minimal CSS reset
│   └── routes/
│       ├── +layout.svelte     # Root layout (imports global styles)
│       ├── +page.svelte       # Main game page
│       ├── login/             # Password entry page
│       └── api/               # Server endpoints (login, AI moves)
├── tests/e2e/                 # Playwright E2E tests
├── specs/                     # Game design specifications
│   ├── spec-gameplay.md       # Full game rules
│   ├── spec-design.md         # UI/UX design document
│   ├── spec-tech-stack.md     # Technology choices and rationale
│   └── spec-technical.md      # Data model and state machine spec
├── vite.config.ts             # Vitest + SvelteKit config
├── playwright.config.ts       # E2E test config
└── svelte.config.js           # SvelteKit config
```

## Architecture Principles

### Game Engine
- **Pure TypeScript, zero framework deps.** The engine lives in `src/lib/engine/` and has no imports from Svelte, SvelteKit, or browser APIs.
- **Reducer pattern.** `reducer(state, action) → state`. Immutable state updates throughout.
- **Tested exhaustively.** Every validation rule, state transition, and scoring calculation has unit tests. Run with `pnpm test:unit`.

### Svelte Layer
- **Svelte 5 runes only.** Use `$state`, `$derived`, `$effect`. No legacy `$:` reactive statements, no writable stores.
- **UI is a pure function of game state.** The reactive store in `game.svelte.ts` holds a `GameState` and dispatches actions to the reducer.
- **SVG board, DOM UI.** The hex board is rendered as inline SVG (Svelte-managed). Cards, panels, and overlays are DOM.

### Styling
- **No UI library, no Tailwind.** All styles are hand-written CSS using custom properties from `tokens.css`.
- **Design tokens.** Every color, spacing, shadow, and motion value is a CSS custom property. Never hard-code values.

### Testing
- **Unit tests:** `src/lib/engine/**/*.test.ts` — run in Node, no browser.
- **Component tests:** `src/**/*.svelte.test.ts` — run in happy-dom.
- **E2E tests:** `tests/e2e/**/*.spec.ts` — require a browser (Playwright).

## Key Game Concepts

See `../specs/spec-gameplay.md` for full rules. Quick reference:

- **Turn phases:** Roll → Action → Trade & Build → Attach → Clean-up
- **Deck:** Each player has a deck of cards (Resources, Treasures, Actions, Victory cards, Curses)
- **Victory points:** Come ONLY from attached Victory cards, Longest Road, Largest Army, and Curses (negative)
- **Resources are finite and trash on building** — unlike coins which recirculate
- **Province:** Attaching a Province to a building enables coin conversion for adjacent production

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SITE_PASSWORD` | Password gate for the app (optional in dev) |
| `ANTHROPIC_API_KEY` | For Claude AI player (optional) |

Set these in a `.env` file locally or as Vercel env vars in production.
