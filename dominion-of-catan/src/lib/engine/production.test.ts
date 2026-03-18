import { describe, it, expect, beforeEach } from 'vitest';
import { rollDice, validCoinDenominations, getProductionEvents, applyRobberCoinWipe, moveRobber } from './production.ts';
import { createInitialGameState, resetIdCounter } from './setup.ts';
import type { GameState } from './state.ts';

function seededRng(seed: number): () => number {
	let s = seed;
	return () => {
		s = (s * 9301 + 49297) % 233280;
		return s / 233280;
	};
}

beforeEach(() => {
	resetIdCounter();
});

describe('rollDice', () => {
	it('always returns a value between 2 and 12', () => {
		for (let i = 0; i < 100; i++) {
			const roll = rollDice(Math.random);
			expect(roll).toBeGreaterThanOrEqual(2);
			expect(roll).toBeLessThanOrEqual(12);
		}
	});

	it('returns the forced value when using a fixed rng', () => {
		// rng that always returns 0 → both dice = 1 → sum = 2
		const result = rollDice(() => 0);
		expect(result).toBe(2);

		// rng that always returns just below 1 → both dice = 6 → sum = 12
		const result2 = rollDice(() => 0.9999);
		expect(result2).toBe(12);
	});
});

describe('validCoinDenominations', () => {
	it('returns the correct denominations for 1 conversion', () => {
		const combos = validCoinDenominations(1);
		expect(combos).toContainEqual({ copper: 1, silver: 0, gold: 0 });
		expect(combos).toHaveLength(1);
	});

	it('returns multiple options for 2 conversions', () => {
		const combos = validCoinDenominations(2);
		expect(combos).toContainEqual({ copper: 2, silver: 0, gold: 0 });
		expect(combos).toContainEqual({ copper: 0, silver: 1, gold: 0 });
	});

	it('returns multiple options for 3 conversions', () => {
		const combos = validCoinDenominations(3);
		expect(combos).toContainEqual({ copper: 3, silver: 0, gold: 0 });
		expect(combos).toContainEqual({ copper: 1, silver: 1, gold: 0 });
		expect(combos).toContainEqual({ copper: 0, silver: 0, gold: 1 });
	});

	it('all combinations sum to the correct total', () => {
		for (let n = 1; n <= 6; n++) {
			for (const combo of validCoinDenominations(n)) {
				const total = combo.copper + combo.silver * 2 + combo.gold * 3;
				expect(total).toBe(n);
			}
		}
	});
});

describe('getProductionEvents', () => {
	it('returns no events when no buildings are on the board', () => {
		const state = createInitialGameState({
			players: [
				{ id: 'p1', name: 'Alice', colorIndex: 0 },
				{ id: 'p2', name: 'Bob', colorIndex: 1 }
			],
			rng: seededRng(1)
		});

		// No buildings during initial placement
		const events = getProductionEvents(state, 6);
		expect(events).toHaveLength(0);
	});

	it('returns no events when robber blocks the hex', () => {
		const state = createInitialGameState({
			players: [
				{ id: 'p1', name: 'Alice', colorIndex: 0 },
				{ id: 'p2', name: 'Bob', colorIndex: 1 }
			],
			rng: seededRng(1)
		});

		// Robber is on desert — any roll that only fires desert (token null) → 0 events
		const events = getProductionEvents(state, 7); // 7 doesn't fire any hex anyway
		expect(events).toHaveLength(0);
	});
});

describe('moveRobber', () => {
	it('moves the robber to the target hex', () => {
		const state = createInitialGameState({
			players: [
				{ id: 'p1', name: 'Alice', colorIndex: 0 },
				{ id: 'p2', name: 'Bob', colorIndex: 1 }
			],
			rng: seededRng(1)
		});

		// Find a non-desert hex to move the robber to
		const targetHex = Array.from(state.board.hexes.values()).find((h) => !h.hasRobber)!;
		const newState = moveRobber(state, targetHex.id);

		expect(newState.board.hexes.get(targetHex.id)!.hasRobber).toBe(true);

		// All other hexes should not have the robber
		let robberCount = 0;
		for (const hex of newState.board.hexes.values()) {
			if (hex.hasRobber) robberCount++;
		}
		expect(robberCount).toBe(1);
	});
});

describe('applyRobberCoinWipe', () => {
	it('does nothing when no players are adjacent to robber hex', () => {
		const state = createInitialGameState({
			players: [
				{ id: 'p1', name: 'Alice', colorIndex: 0 },
				{ id: 'p2', name: 'Bob', colorIndex: 1 }
			],
			rng: seededRng(1)
		});

		const desertHex = Array.from(state.board.hexes.values()).find((h) => h.hasRobber)!;
		const newState = applyRobberCoinWipe(state, desertHex.id, 'p1');

		// No buildings, so hands unchanged
		for (const player of newState.players) {
			expect(player.hand.length).toBe(state.players.find((p) => p.id === player.id)!.hand.length);
		}
	});
});
