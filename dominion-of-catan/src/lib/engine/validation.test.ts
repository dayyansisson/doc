import { describe, it, expect, beforeEach } from 'vitest';
import { createInitialGameState, resetIdCounter } from './setup.ts';
import type { GameState } from './state.ts';
import {
	satisfiesDistanceRule,
	validateBuildSettlement,
	validateBuildRoad,
	validateBuildCity,
	validateBuyCard,
	validateAttachVictoryCard,
	totalSpendableCoins
} from './validation.ts';
import { reducer } from './reducer.ts';

function seededRng(seed: number): () => number {
	let s = seed;
	return () => {
		s = (s * 9301 + 49297) % 233280;
		return s / 233280;
	};
}

function makeState(): GameState {
	return createInitialGameState({
		players: [
			{ id: 'p1', name: 'Alice', colorIndex: 0 },
			{ id: 'p2', name: 'Bob', colorIndex: 1 }
		],
		rng: seededRng(7)
	});
}

beforeEach(() => {
	resetIdCounter();
});

describe('satisfiesDistanceRule', () => {
	it('returns true for empty intersections with no nearby buildings', () => {
		const state = makeState();
		const intId = Array.from(state.board.intersections.keys())[0];
		expect(satisfiesDistanceRule(state, intId)).toBe(true);
	});

	it('returns false if the intersection is already occupied', () => {
		let state = makeState();
		const intId = Array.from(state.board.intersections.keys())[0];

		// Place a settlement directly
		state = reducer(state, { type: 'PLACE_INITIAL_SETTLEMENT', playerId: 'p1', intersectionId: intId });

		// The same intersection now has a building
		const intersection = state.board.intersections.get(intId)!;
		// Manually set building to test
		const testState: GameState = {
			...state,
			board: {
				...state.board,
				intersections: new Map(state.board.intersections)
			}
		};

		expect(satisfiesDistanceRule(testState, intId)).toBe(false);
	});
});

describe('validateBuildSettlement', () => {
	it('returns null for valid initial placement', () => {
		const state = makeState();
		const intId = Array.from(state.board.intersections.keys())[0];
		const err = validateBuildSettlement(state, 'p1', intId, true);
		expect(err).toBeNull();
	});

	it('returns error when settlement pieces are exhausted', () => {
		const state = makeState();
		// Manually deplete pieces
		const modState: GameState = {
			...state,
			players: state.players.map((p) =>
				p.id === 'p1'
					? { ...p, piecesRemaining: { ...p.piecesRemaining, settlements: 0 } }
					: p
			)
		};
		const intId = Array.from(state.board.intersections.keys())[0];
		expect(validateBuildSettlement(modState, 'p1', intId, true)).not.toBeNull();
	});
});

describe('totalSpendableCoins', () => {
	it('counts treasure card values plus tempCoins', () => {
		const state = makeState();
		const player = state.players[0];

		// Player starts with Coppers in hand
		const copperCount = player.hand.filter((c) => c.type === 'TREASURE' && c.name === 'Copper').length;
		expect(totalSpendableCoins(player)).toBe(copperCount * 1 + player.tempCoins);
	});
});

describe('validateBuyCard', () => {
	it('returns error when no buys remaining', () => {
		const state = makeState();
		const modState: GameState = {
			...state,
			players: state.players.map((p) =>
				p.id === 'p1' ? { ...p, buysRemaining: 0 } : p
			)
		};
		expect(validateBuyCard(modState, 'p1', 'Estate')).not.toBeNull();
	});

	it('returns error for unknown card name', () => {
		const state = makeState();
		expect(validateBuyCard(state, 'p1', 'FakeCard')).not.toBeNull();
	});

	it('returns null for Estate when player has enough copper', () => {
		const state = makeState();
		const player = state.players[0];
		// Estate costs 2. Player starts with coppers in hand.
		if (totalSpendableCoins(player) >= 2) {
			expect(validateBuyCard(state, 'p1', 'Estate')).toBeNull();
		}
	});

	it('returns error when supply pile is empty', () => {
		const state = makeState();
		const emptyState: GameState = {
			...state,
			supply: {
				...state.supply,
				victoryPiles: { ...state.supply.victoryPiles, estate: 0 }
			}
		};
		expect(validateBuyCard(emptyState, 'p1', 'Estate')).not.toBeNull();
	});
});

describe('validateBuildCity', () => {
	it('returns error when intersection has no building', () => {
		const state = makeState();
		const intId = Array.from(state.board.intersections.keys())[0];
		expect(validateBuildCity(state, 'p1', intId)).not.toBeNull();
	});
});
