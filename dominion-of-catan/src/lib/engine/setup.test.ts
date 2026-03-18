import { describe, it, expect, beforeEach } from 'vitest';
import {
	generateBoard,
	initializeSupply,
	createPlayer,
	createInitialGameState,
	STARTER_KINGDOM_CARDS,
	resetIdCounter
} from './setup.ts';
import { SUPPLY_COUNTS } from './state.ts';

// Use a seeded pseudo-random for deterministic tests
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

describe('generateBoard', () => {
	it('creates exactly 19 hexes', () => {
		const board = generateBoard(seededRng(42));
		expect(board.hexes.size).toBe(19);
	});

	it('has exactly one desert hex with the robber', () => {
		const board = generateBoard(seededRng(42));
		const desertHexes = Array.from(board.hexes.values()).filter((h) => h.terrain === 'DESERT');
		expect(desertHexes).toHaveLength(1);
		expect(desertHexes[0].hasRobber).toBe(true);
		expect(desertHexes[0].numberToken).toBeNull();
	});

	it('has correct terrain distribution', () => {
		const board = generateBoard(seededRng(42));
		const counts: Record<string, number> = {};
		for (const hex of board.hexes.values()) {
			counts[hex.terrain] = (counts[hex.terrain] ?? 0) + 1;
		}
		expect(counts['FOREST']).toBe(4);
		expect(counts['PASTURE']).toBe(4);
		expect(counts['FIELDS']).toBe(4);
		expect(counts['HILLS']).toBe(3);
		expect(counts['MOUNTAINS']).toBe(3);
		expect(counts['DESERT']).toBe(1);
	});

	it('has non-desert hexes with number tokens 2–12', () => {
		const board = generateBoard(seededRng(42));
		for (const hex of board.hexes.values()) {
			if (hex.terrain === 'DESERT') {
				expect(hex.numberToken).toBeNull();
			} else {
				expect(hex.numberToken).toBeGreaterThanOrEqual(2);
				expect(hex.numberToken).toBeLessThanOrEqual(12);
			}
		}
	});

	it('generates intersections', () => {
		const board = generateBoard(seededRng(42));
		expect(board.intersections.size).toBeGreaterThan(0);
	});

	it('generates edges', () => {
		const board = generateBoard(seededRng(42));
		expect(board.edges.size).toBeGreaterThan(0);
	});

	it('each edge has exactly 2 adjacent intersections', () => {
		const board = generateBoard(seededRng(42));
		for (const edge of board.edges.values()) {
			expect(edge.adjacentIntersectionIds).toHaveLength(2);
		}
	});

	it('each intersection references existing hexes', () => {
		const board = generateBoard(seededRng(42));
		for (const intersection of board.intersections.values()) {
			for (const hexId of intersection.adjacentHexIds) {
				expect(board.hexes.has(hexId)).toBe(true);
			}
		}
	});

	it('all intersections start with no building', () => {
		const board = generateBoard(seededRng(42));
		for (const intersection of board.intersections.values()) {
			expect(intersection.building).toBeNull();
		}
	});

	it('all edges start with no road', () => {
		const board = generateBoard(seededRng(42));
		for (const edge of board.edges.values()) {
			expect(edge.road).toBeNull();
		}
	});
});

describe('initializeSupply', () => {
	it('sets correct victory pile sizes for 2 players', () => {
		const supply = initializeSupply(2, STARTER_KINGDOM_CARDS);
		expect(supply.victoryPiles.estate).toBe(8);
		expect(supply.victoryPiles.duchy).toBe(8);
		expect(supply.victoryPiles.province).toBe(8);
	});

	it('sets correct victory pile sizes for 3–4 players', () => {
		const supply3 = initializeSupply(3, STARTER_KINGDOM_CARDS);
		const supply4 = initializeSupply(4, STARTER_KINGDOM_CARDS);
		expect(supply3.victoryPiles.province).toBe(12);
		expect(supply4.victoryPiles.province).toBe(12);
	});

	it('sets correct curse pile sizes', () => {
		expect(initializeSupply(2, STARTER_KINGDOM_CARDS).cursePile).toBe(10);
		expect(initializeSupply(3, STARTER_KINGDOM_CARDS).cursePile).toBe(20);
		expect(initializeSupply(4, STARTER_KINGDOM_CARDS).cursePile).toBe(30);
	});

	it('initializes 10 copies of each kingdom card', () => {
		const supply = initializeSupply(2, STARTER_KINGDOM_CARDS);
		for (const [, count] of supply.kingdomPiles) {
			expect(count).toBe(10);
		}
	});

	it('initializes 19 of each resource', () => {
		const supply = initializeSupply(2, STARTER_KINGDOM_CARDS);
		expect(supply.resourcePiles.brick).toBe(19);
		expect(supply.resourcePiles.lumber).toBe(19);
		expect(supply.resourcePiles.ore).toBe(19);
		expect(supply.resourcePiles.grain).toBe(19);
		expect(supply.resourcePiles.wool).toBe(19);
	});
});

describe('createPlayer', () => {
	it('creates a player with a 10-card starting deck (drawn + remaining)', () => {
		const player = createPlayer('p1', 'Alice', 0, seededRng(1));
		const totalCards = player.hand.length + player.deck.length;
		expect(totalCards).toBe(10);
	});

	it('starts with 7 cards in hand', () => {
		const player = createPlayer('p1', 'Alice', 0, seededRng(1));
		expect(player.hand).toHaveLength(7);
	});

	it('starts with 3 cards in deck', () => {
		const player = createPlayer('p1', 'Alice', 0, seededRng(1));
		expect(player.deck).toHaveLength(3);
	});

	it('starting deck contains 1 Province and 9 Coppers', () => {
		const player = createPlayer('p1', 'Alice', 0, seededRng(1));
		const allCards = [...player.hand, ...player.deck];
		const provinces = allCards.filter((c) => c.type === 'VICTORY' && c.name === 'Province');
		const coppers = allCards.filter((c) => c.type === 'TREASURE' && c.name === 'Copper');
		expect(provinces).toHaveLength(1);
		expect(coppers).toHaveLength(9);
	});

	it('has startingProvinceActive = true', () => {
		const player = createPlayer('p1', 'Alice', 0);
		expect(player.startingProvinceActive).toBe(true);
	});

	it('starts with max piece counts', () => {
		const player = createPlayer('p1', 'Alice', 0);
		expect(player.piecesRemaining.roads).toBe(15);
		expect(player.piecesRemaining.settlements).toBe(5);
		expect(player.piecesRemaining.cities).toBe(4);
	});
});

describe('createInitialGameState', () => {
	it('creates a valid game state for 2 players', () => {
		const state = createInitialGameState({
			players: [
				{ id: 'p1', name: 'Alice', colorIndex: 0 },
				{ id: 'p2', name: 'Bob', colorIndex: 1 }
			],
			rng: seededRng(99)
		});

		expect(state.players).toHaveLength(2);
		expect(state.currentPhase).toBe('INITIAL_PLACEMENT');
		expect(state.gameOver).toBe(false);
		expect(state.activePlayerIndex).toBe(0);
		expect(state.initialPlacement).not.toBeNull();
		expect(state.initialPlacement?.round).toBe(1);
	});

	it('throws for invalid player counts', () => {
		expect(() =>
			createInitialGameState({ players: [{ id: 'p1', name: 'Solo', colorIndex: 0 }] })
		).toThrow();
	});
});
