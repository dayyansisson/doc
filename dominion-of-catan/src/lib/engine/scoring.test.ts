import { describe, it, expect, beforeEach } from 'vitest';
import { createInitialGameState, resetIdCounter } from './setup.ts';
import { calculateVP, recalculateLongestRoad, recalculateLargestArmy, checkGameEnd } from './scoring.ts';
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

function makeState(): GameState {
	return createInitialGameState({
		players: [
			{ id: 'p1', name: 'Alice', colorIndex: 0 },
			{ id: 'p2', name: 'Bob', colorIndex: 1 }
		],
		rng: seededRng(5)
	});
}

describe('calculateVP', () => {
	it('returns 0 for a player with no attached cards and no awards', () => {
		const state = makeState();
		expect(calculateVP(state, 'p1')).toBe(0);
	});

	it('counts curses as negative VP', () => {
		const state = makeState();
		const modState: GameState = {
			...state,
			players: state.players.map((p) => {
				if (p.id !== 'p1') return p;
				return {
					...p,
					hand: [
						...p.hand,
						{ id: 'curse_test', type: 'CURSE', name: 'Curse', coinCost: 0, zone: 'HAND', ownerId: 'p1' }
					]
				};
			})
		};
		expect(calculateVP(modState, 'p1')).toBe(-1);
	});

	it('awards +2 for Longest Road holder', () => {
		const state = { ...makeState(), longestRoadHolder: 'p1' };
		expect(calculateVP(state, 'p1')).toBe(2);
		expect(calculateVP(state, 'p2')).toBe(0);
	});

	it('awards +2 for Largest Army holder', () => {
		const state = { ...makeState(), largestArmyHolder: 'p1' };
		expect(calculateVP(state, 'p1')).toBe(2);
	});

	it('counts attached victory card VP from buildings', () => {
		const state = makeState();
		const firstIntId = Array.from(state.board.intersections.keys())[0];

		// Manually place a building with an attached estate
		const board = {
			...state.board,
			intersections: new Map(state.board.intersections)
		};
		const intersection = board.intersections.get(firstIntId)!;
		board.intersections.set(firstIntId, {
			...intersection,
			building: {
				type: 'SETTLEMENT',
				playerId: 'p1',
				intersectionId: firstIntId,
				attachedCards: [{ cardType: 'ESTATE', vpValue: 1 }]
			}
		});

		const modState: GameState = { ...state, board };
		expect(calculateVP(modState, 'p1')).toBe(1);
	});
});

describe('recalculateLargestArmy', () => {
	it('no one holds it when no one has 3 militia plays', () => {
		const state = makeState();
		const result = recalculateLargestArmy(state);
		expect(result.largestArmyHolder).toBeNull();
	});

	it('awards to the first player with 3+ militia plays', () => {
		const state = makeState();
		const modState: GameState = {
			...state,
			players: state.players.map((p) =>
				p.id === 'p1' ? { ...p, militiaPlays: 3 } : p
			)
		};
		const result = recalculateLargestArmy(modState);
		expect(result.largestArmyHolder).toBe('p1');
	});

	it('transfers to player with more militia plays', () => {
		const state = {
			...makeState(),
			largestArmyHolder: 'p1',
			players: makeState().players.map((p) => {
				if (p.id === 'p1') return { ...p, militiaPlays: 3 };
				if (p.id === 'p2') return { ...p, militiaPlays: 4 };
				return p;
			})
		};
		const result = recalculateLargestArmy(state);
		expect(result.largestArmyHolder).toBe('p2');
	});
});

describe('checkGameEnd', () => {
	it('does not end the game during normal play', () => {
		const state = makeState();
		const result = checkGameEnd(state);
		expect(result.gameOver).toBe(false);
	});

	it('ends the game when the Province pile is empty', () => {
		const state = makeState();
		const modState: GameState = {
			...state,
			supply: {
				...state.supply,
				victoryPiles: { ...state.supply.victoryPiles, province: 0 }
			}
		};
		const result = checkGameEnd(modState);
		expect(result.gameOver).toBe(true);
	});

	it('ends the game when 3 supply piles are empty', () => {
		const state = makeState();
		const modState: GameState = {
			...state,
			supply: {
				...state.supply,
				victoryPiles: {
					estate: 0,
					duchy: 0,
					province: 0
				}
			}
		};
		const result = checkGameEnd(modState);
		expect(result.gameOver).toBe(true);
	});

	it('sets a winner on game end', () => {
		const state = makeState();
		const modState: GameState = {
			...state,
			supply: {
				...state.supply,
				victoryPiles: { ...state.supply.victoryPiles, province: 0 }
			}
		};
		const result = checkGameEnd(modState);
		expect(result.winner).not.toBeNull();
	});
});

describe('recalculateLongestRoad', () => {
	it('no one holds it when no roads exist', () => {
		const state = makeState();
		const result = recalculateLongestRoad(state);
		expect(result.longestRoadHolder).toBeNull();
	});
});
