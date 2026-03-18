# Dominion of Catan — Tech Stack Document

**Version:** 0.1.0-draft
**Companion to:** Technical Specification v0.1.0, Design Document v0.1.0

---

## 1. Project Context

This is a personal project — a custom board game played with a handful of friends, likely in the same room. The priorities are: zero cost to operate, built entirely by AI coding agents, thoroughly tested, and pleasant to develop in. There is no need for accounts, authentication services, or production-grade infrastructure. A simple password gate keeps the site private.

---

## 2. Stack Summary

| Layer | Technology | Version (as of March 2026) |
|-------|-----------|---------------------------|
| Framework | SvelteKit | 2.55+ (Svelte 5.49+) |
| Language | TypeScript | 5.x (bundled with SvelteKit) |
| Board Rendering | SVG (inline, Svelte-managed) | Native |
| Animations | Svelte transitions + CSS | Native |
| Styling | Hand-written CSS (custom properties) | Native |
| Unit & Integration Testing | Vitest + vitest-browser-svelte | Vitest 4.x |
| Component Testing | Vitest Browser Mode + Playwright provider | @vitest/browser-playwright |
| E2E Testing | Playwright | Latest |
| Hosting | Vercel (Hobby tier) | Free |
| Password Protection | SvelteKit server hook | Custom middleware |
| Package Manager | pnpm | Latest |
| AI Player | Anthropic API (Claude) | claude-sonnet-4-6 |

---

## 3. Frontend Framework: SvelteKit + Svelte 5

### Why SvelteKit

SvelteKit with Svelte 5 is the right choice for this project for several reasons. Svelte 5's runes-based reactivity (`$state`, `$derived`, `$effect`) maps naturally to a game state machine — the entire UI can be a reactive function of the game state object. SvelteKit's built-in transitions and animations (`transition:`, `animate:`, `in:`, `out:`) are a first-class feature, not an afterthought, which is critical given the design document's emphasis on buttery motion. SvelteKit compiles away the framework, producing minimal runtime JavaScript, which means fast load times on mobile. SvelteKit also provides server-side capabilities (hooks, server routes, form actions) needed for the password gate and potential AI player API endpoints.

Svelte 5 is mature and stable as of early 2026, with strong Vitest integration, TypeScript support, and well-documented patterns for both component and browser-mode testing. The Svelte ecosystem also has strong AI agent support — the Svelte MCP server exists for Claude Code, and Svelte's compiler-based approach produces straightforward, predictable output that agents can reason about.

### Project Setup

```bash
pnpm dlx sv@latest create dominion-of-catan
# Options:
#   Template: SvelteKit minimal
#   TypeScript: Yes
#   Add-ons: prettier, eslint, vitest, playwright
```

No UI library. All components are hand-written with custom CSS properties following the design document's token system. No Tailwind — the monochrome palette and Apple-level restraint are better served by a small, intentional stylesheet than utility classes.

---

## 4. Board Rendering: SVG

### Why SVG over Canvas

The Catan board has 19 hexes, ~54 intersections, ~72 edges, a robber, and player pieces. This is well under the ~3,000 element threshold where SVG performance degrades. SVG is the better choice because:

**DOM integration.** SVG elements are part of the DOM, which means Svelte can manage them directly — bind event handlers, apply transitions, and reactively update attributes. A hex tile is just a `<polygon>` component with reactive fills, click handlers, and Svelte `transition:` directives. No need for a separate rendering loop or hit-testing math.

**Accessibility.** SVG elements can carry `aria-label`, `role`, and `tabindex` attributes. The design document requires accessible tooltips and keyboard navigation — SVG gives this for free. Canvas would require building a parallel accessibility tree.

**Resolution independence.** SVG scales perfectly on retina displays and across zoom levels, which matters for the pan-and-zoom board view on mobile.

**Svelte transitions.** The design document specifies animations on hex pulses, building placement, robber movement, and dice overlays. Svelte's `transition:` and `animate:` directives work natively on SVG elements. With Canvas, all animation would need to be hand-rolled in requestAnimationFrame loops.

**Agent-friendliness.** SVG markup is declarative and readable. An AI agent can inspect, modify, and debug an SVG hex grid far more easily than imperative Canvas drawing code.

### Pan and Zoom

Implement pan and zoom via SVG `viewBox` manipulation. Wrap the board in an `<svg>` with a reactive `viewBox` attribute. Handle touch/pointer events to translate and scale the viewBox. This is lightweight, performant, and doesn't require a library. For more polished gesture handling, consider `d3-zoom` (available via the d3 package already popular in the Svelte ecosystem), which handles pinch, wheel, and drag with momentum.

### Hex Grid Geometry

Use the standard hex math from Red Blob Games' hex grid reference (the canonical resource for hex game development). Flat-top hexagons, axial coordinates. Precompute vertex positions, intersection points, and edge midpoints during board generation. Store as constants — the board geometry never changes after setup.

---

## 5. Animations and Transitions

### Svelte Native Transitions

Svelte provides `transition:`, `in:`, `out:`, and `animate:` directives that work on both HTML and SVG elements. Use these for:

- **Card draws:** `in:fly` with staggered delays (80–120ms per card).
- **Card removals:** `out:fade` with short duration (200ms).
- **Building placement:** `in:scale` with overshoot easing.
- **View transitions:** `transition:slide` between board and deck tab panels.
- **Tooltip appearance:** `in:fade` with 150ms duration.

### CSS Animations

For continuous or complex animations (dice roll number cycling, hex production pulse, robber movement along an arc path), use CSS `@keyframes` with Svelte's `class:` directive to trigger them. Define animation durations and easings as CSS custom properties matching the design document's motion tokens.

### Custom Spring/Tween

Svelte 5 provides `tweened` and `spring` stores for physics-based motion. Use these for the robber's arc movement (tween along a bezier path) and card lift animations (spring with slight overshoot on selection).

---

## 6. Styling: Hand-Written CSS with Custom Properties

No UI library. No Tailwind. The design document defines a complete token system (colors, typography, spacing, shadows, radii, motion). Implement these as CSS custom properties in a single `tokens.css` file imported at the layout level.

```css
:root {
  --surface-primary: #FFFFFF;
  --text-primary: #1D1D1F;
  --radius-md: 12px;
  --shadow-card: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);
  /* ... all tokens from design doc section 2 */
}

:root.dark {
  --surface-primary: #000000;
  --text-primary: #F5F5F7;
  /* ... dark mode overrides */
}
```

Each component uses scoped `<style>` blocks referencing these tokens. This keeps styles co-located with components (Svelte's default) while maintaining a single source of truth for the design system.

**Font loading:** Import Inter and Inter Tight via `@fontsource/inter` and `@fontsource/inter-tight` (npm packages, self-hosted, no external CDN calls). This keeps the app dependency-free from Google Fonts and works offline.

---

## 7. Game Engine Architecture

### State Machine

The game engine should be a pure TypeScript module with zero framework dependencies. It takes a game state object and an action, validates the action, and returns a new state. This makes it trivially testable — no DOM, no Svelte, no browser needed.

```
src/
  lib/
    engine/
      state.ts          # GameState type definitions
      actions.ts         # Action type union
      reducer.ts         # (state, action) → state
      validation.ts      # Action validation rules
      production.ts      # Dice roll + resource distribution logic
      robber.ts          # Robber movement + effects
      scoring.ts         # VP calculation, longest road, largest army
      setup.ts           # Board generation, starting decks
      ai/
        player.ts        # AI player interface
        claude.ts        # Claude API integration
        random.ts        # Random/heuristic fallback AI
```

The Svelte layer is a thin reactive wrapper: a `$state` rune holding the `GameState`, and event handlers that dispatch actions to the reducer. The UI is a pure function of state.

### Pass-and-Play Module

Implement as an isolated `PassAndPlayProvider.svelte` wrapper component. It manages turn handoffs, blur overlays, and sequential production prompts for off-turn players. The wrapper injects an `isActivePlayer` flag into the context. When multiplayer is added later, this component is simply swapped for a `NetworkSessionProvider` — no game logic changes.

---

## 8. AI Players

### Architecture

AI players plug into the same action interface as human players. The engine exposes a function: given a `GameState` and a `playerId`, return the next `Action`. Two implementations:

**Random/Heuristic AI** (`random.ts`): A local, zero-cost fallback. Makes random valid moves with basic heuristics (prefer building settlements over roads, buy Province when affordable, etc.). No API calls. Useful for rapid playtesting and when you don't want to burn API credits.

**Claude AI** (`claude.ts`): Calls the Anthropic API via a SvelteKit server endpoint (`/api/ai/move`). Sends the current game state as a structured prompt, asks Claude to select an action, parses the response. Uses `claude-sonnet-4-6` for cost efficiency. The prompt includes the game rules summary and current state serialized as JSON.

```typescript
// /api/ai/move/+server.ts
import Anthropic from '@anthropic-ai/sdk';

export async function POST({ request }) {
  const { gameState, playerId } = await request.json();
  const client = new Anthropic(); // Uses ANTHROPIC_API_KEY env var
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: GAME_RULES_PROMPT,
    messages: [{ role: 'user', content: formatGameState(gameState, playerId) }]
  });
  const action = parseAction(message.content[0].text);
  return Response.json({ action });
}
```

The API key is stored as a Vercel environment variable. The server endpoint is protected by the same password middleware as the rest of the app.

### Cost

Claude Sonnet is inexpensive for this use case. Each AI move decision is a single API call with ~2K input tokens (game state) and ~200 output tokens (action). At current Sonnet pricing, a full game with 2 AI players making ~100 moves each would cost roughly $0.10–0.30. Well within personal project budget. The random AI is the default; Claude AI is opt-in per game.

---

## 9. Testing Strategy

### Philosophy

Three testing tiers, each with a clear role. The game engine (pure logic) is tested exhaustively with unit tests. Components are tested in real browsers via Vitest browser mode. Full game flows are tested end-to-end with Playwright.

### Unit Tests: Vitest

Test the game engine module in isolation. No DOM, no browser, no Svelte. Pure function-in, function-out.

**What to test:**
- Board generation (correct hex count, number token distribution, harbor placement)
- Action validation (distance rule, resource costs, attachment capacity)
- State transitions (build road → resources trashed, buy card → coins to bank, etc.)
- Production logic (conversion tiers, robber blocking, empty supply edge cases)
- Scoring (VP calculation, longest road algorithm, largest army tracking)
- Game end detection (Province pile empty, three piles empty)

**File pattern:** `src/lib/engine/**/*.test.ts`

```bash
pnpm vitest run --project=unit
```

### Component Tests: Vitest Browser Mode + vitest-browser-svelte

Test Svelte components in a real Chromium browser via Vitest's browser mode with the Playwright provider. This replaces jsdom/happy-dom with actual browser rendering, which matters for SVG-heavy components, CSS custom properties, and animation behavior.

**What to test:**
- Card component renders correctly for each type (resource, treasure, action, victory, curse)
- Hex tile renders correct icon, number, and terrain shade
- Building placement shows ghost targets when in build phase
- Hand component allows card selection and multi-select
- Supply panel shows correct counts, scarcity indicators, and disabled states
- Tooltip appears on hover/tap with correct content
- Tab switching works between board and deck views

**File pattern:** `src/**/*.svelte.test.ts`

**Setup:**

```typescript
// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/lib/engine/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        extends: true,
        test: {
          name: 'client',
          include: ['src/**/*.svelte.test.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
```

### E2E Tests: Playwright

Test full game flows in a real browser against the running SvelteKit dev server.

**What to test:**
- Full game setup flow (player count → name entry → board generation → initial placement)
- A complete game turn cycle (roll → action → trade/build → attach → cleanup)
- Pass-and-play handoff (blur appears, correct player's hand shown after ready)
- Password gate (blocked without password, accessible with password)
- Game end conditions trigger correctly and show final scores
- Mobile viewport: tab switching, pan/zoom, card selection
- Desktop viewport: side-by-side layout renders correctly

**File pattern:** `tests/**/*.spec.ts`

```bash
pnpm playwright test
```

### Test Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:unit": "vitest run --project=unit",
    "test:client": "vitest run --project=client",
    "test:e2e": "playwright test",
    "test:all": "vitest run && playwright test"
  }
}
```

---

## 10. Password Protection

Implement as a SvelteKit server hook (`hooks.server.ts`). No auth service, no database, no cookies beyond a simple session token.

```typescript
// src/hooks.server.ts
import { env } from '$env/static/private';

export async function handle({ event, resolve }) {
  const password = env.SITE_PASSWORD;

  // Allow the login page and API routes for the login action
  if (event.url.pathname === '/login' || event.url.pathname === '/api/login') {
    return resolve(event);
  }

  // Check for valid session cookie
  const session = event.cookies.get('session');
  if (session !== password) {
    return new Response(null, {
      status: 302,
      headers: { location: '/login' }
    });
  }

  return resolve(event);
}
```

The `/login` page is a minimal form: a single password input and a submit button. On correct password, set a cookie. On incorrect, show an error. The password is stored as `SITE_PASSWORD` in Vercel environment variables.

This is deliberately simple. It's not secure against determined attackers — it's a "keep strangers out" lock, not a vault door.

---

## 11. Hosting: Vercel Hobby Tier

### Why Vercel

Vercel's free Hobby tier provides everything this project needs: zero-config SvelteKit deployment (auto-detects the framework), preview deployments on every git push, HTTPS, a global CDN, and serverless functions for the AI player API endpoint. The Hobby tier includes 100GB bandwidth and generous serverless invocation limits — far more than a game played by a few friends.

Vercel employs Rich Harris (Svelte's creator) and several Svelte team members, so SvelteKit support is first-class and near-zero-configuration. The default `adapter-auto` detects Vercel and configures everything.

### Alternatives Considered

**Cloudflare Pages** has a more generous free tier (unlimited bandwidth) and would work well for the static parts. However, Cloudflare Workers use a non-Node.js runtime (V8 isolates) which can cause compatibility issues with npm packages like the Anthropic SDK. For a personal project where bandwidth is irrelevant (a handful of users), Vercel's better DX and SvelteKit integration wins.

**Netlify** would also work but offers no advantage over Vercel for SvelteKit projects, and its free tier recently reduced build minutes.

### Deployment

```bash
# Install Vercel CLI
pnpm add -g vercel

# Link and deploy
vercel

# Set environment variables
vercel env add SITE_PASSWORD
vercel env add ANTHROPIC_API_KEY
```

Or connect the GitHub repo directly through the Vercel dashboard for automatic deployments on push.

---

## 12. Project Structure

```
dominion-of-catan/
├── src/
│   ├── lib/
│   │   ├── engine/                # Pure game logic (no framework deps)
│   │   │   ├── state.ts           # GameState, Player, Card, Board types
│   │   │   ├── actions.ts         # Action type definitions
│   │   │   ├── reducer.ts         # Main state reducer
│   │   │   ├── validation.ts      # Move validation
│   │   │   ├── production.ts      # Dice + resource production
│   │   │   ├── robber.ts          # Robber logic
│   │   │   ├── scoring.ts         # VP, longest road, largest army
│   │   │   ├── setup.ts           # Board gen, deck init, initial placement
│   │   │   ├── hex-math.ts        # Hex grid geometry utilities
│   │   │   └── ai/
│   │   │       ├── player.ts      # AI interface
│   │   │       ├── claude.ts      # Claude API AI
│   │   │       └── random.ts      # Heuristic AI
│   │   ├── components/
│   │   │   ├── board/
│   │   │   │   ├── Board.svelte        # Main board SVG container
│   │   │   │   ├── HexTile.svelte      # Individual hex
│   │   │   │   ├── NumberToken.svelte   # Number + pip dots
│   │   │   │   ├── Building.svelte      # Settlement/city
│   │   │   │   ├── Road.svelte          # Road segment
│   │   │   │   ├── Robber.svelte        # Robber overlay
│   │   │   │   ├── Harbor.svelte        # Harbor label
│   │   │   │   ├── DiceOverlay.svelte   # Dice roll animation
│   │   │   │   └── GhostTarget.svelte   # Build placement targets
│   │   │   ├── deck/
│   │   │   │   ├── DeckView.svelte      # Deck tab container
│   │   │   │   ├── Hand.svelte          # Scrollable card row
│   │   │   │   ├── Card.svelte          # Individual card
│   │   │   │   ├── PlayArea.svelte      # Played actions display
│   │   │   │   ├── SupplyPanel.svelte   # Purchasable cards grid
│   │   │   │   └── SupplyCard.svelte    # Supply pile cell
│   │   │   ├── ui/
│   │   │   │   ├── PhaseBar.svelte      # Turn phase indicator
│   │   │   │   ├── Tooltip.svelte       # Contextual tooltip
│   │   │   │   ├── Toast.svelte         # Notification toast
│   │   │   │   ├── TabBar.svelte        # Mobile tab navigation
│   │   │   │   ├── Modal.svelte         # Generic modal/sheet
│   │   │   │   └── GameLog.svelte       # Action log overlay
│   │   │   └── passplay/
│   │   │       ├── PassAndPlayProvider.svelte  # Turn handoff wrapper
│   │   │       └── HandoffOverlay.svelte       # Blur + prompt
│   │   ├── stores/
│   │   │   └── game.svelte.ts     # Reactive game state ($state rune)
│   │   └── styles/
│   │       ├── tokens.css         # Design system custom properties
│   │       ├── typography.css     # Font faces and type scale
│   │       └── reset.css          # Minimal CSS reset
│   ├── routes/
│   │   ├── +layout.svelte        # Root layout (imports global styles)
│   │   ├── +layout.server.ts     # Server-side layout (auth check)
│   │   ├── +page.svelte          # Game page
│   │   ├── login/
│   │   │   └── +page.svelte      # Password entry
│   │   └── api/
│   │       ├── login/+server.ts   # Password validation endpoint
│   │       └── ai/
│   │           └── move/+server.ts # Claude AI move endpoint
│   └── hooks.server.ts           # Password middleware
├── tests/
│   └── e2e/
│       ├── setup.spec.ts         # Game setup flow
│       ├── turn-cycle.spec.ts    # Full turn phases
│       ├── pass-and-play.spec.ts # Handoff behavior
│       └── game-end.spec.ts      # End conditions
├── static/
│   └── icons/                    # SVG icon files (if not inline)
├── vite.config.ts                # Vitest + SvelteKit config
├── playwright.config.ts          # Playwright E2E config
├── svelte.config.js              # SvelteKit config
├── package.json
├── pnpm-lock.yaml
└── tsconfig.json
```

---

## 13. Dependencies

### Production

| Package | Purpose |
|---------|---------|
| `@sveltejs/kit` | Framework |
| `svelte` | Compiler + runtime |
| `@fontsource/inter` | Inter font (self-hosted) |
| `@fontsource/inter-tight` | Inter Tight font (self-hosted) |
| `@anthropic-ai/sdk` | Claude API client (for AI players) |

### Development

| Package | Purpose |
|---------|---------|
| `typescript` | Type checking |
| `vitest` | Unit + component test runner |
| `@vitest/browser-playwright` | Browser mode provider for component tests |
| `vitest-browser-svelte` | Svelte component rendering in browser tests |
| `playwright` | E2E testing + component test browser |
| `eslint` | Linting |
| `prettier` | Formatting |
| `prettier-plugin-svelte` | Svelte formatting support |

Total production dependencies: 5. Total dev dependencies: 8. This is an intentionally minimal dependency footprint, which reduces agent confusion, build times, and maintenance burden.

---

## 14. Development Workflow

### Local Development

```bash
pnpm install
pnpm dev          # Start dev server at localhost:5173
```

### Testing

```bash
pnpm test:unit    # Run engine unit tests (fast, no browser)
pnpm test:client  # Run component tests in Chromium
pnpm test:e2e     # Run Playwright E2E tests
pnpm test:all     # Run everything
```

### Deployment

Push to `main` branch → Vercel auto-deploys. Preview URLs generated for all other branches.

### Agent Workflow

The project is designed for AI agents (Claude Code) to work on autonomously. Key considerations:

- **Pure engine module** with no framework deps means agents can write and test game logic without touching Svelte.
- **Svelte 5 runes** are the required reactivity pattern — no legacy `$:` reactive statements, no stores API.
- **SVG components** are declarative markup that agents can reason about directly.
- **Vitest** provides instant feedback — agents can run tests after every change.
- **Minimal dependencies** mean fewer APIs to learn and fewer compatibility issues.
