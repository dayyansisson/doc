/**
 * Mock mid-game GameState for Phase 2 UI development.
 * Uses a seeded RNG so the board is deterministic.
 */
import { createInitialGameState } from '$lib/engine/setup';
import { reducer } from '$lib/engine/reducer';
import type { GameState } from '$lib/engine/state';

// Simple seeded PRNG (mulberry32)
function mulberry32(seed: number) {
	return function () {
		seed |= 0;
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function buildMockState(): GameState {
	const rng = mulberry32(42);

	let state = createInitialGameState({
		players: [
			{ id: 'p1', name: 'Alice', colorIndex: 0 },
			{ id: 'p2', name: 'Bob', colorIndex: 1 },
			{ id: 'p3', name: 'Carol', colorIndex: 2 }
		],
		kingdomCards: ['Village', 'Smithy', 'Market', 'Festival', 'Militia', 'Mine', 'Moat', 'Remodel', 'Chapel', 'Witch'],
		rng
	});

	// Helper: get the first N intersections from the board
	const intersectionIds = [...state.board.intersections.keys()];
	const edgeIds = [...state.board.edges.keys()];

	// Place initial settlements via reducer actions
	// Round 1: p1 → p2 → p3
	state = reducer(state, { type: 'PLACE_INITIAL_SETTLEMENT', playerId: 'p1', intersectionId: intersectionIds[5] });
	state = reducer(state, { type: 'PLACE_INITIAL_ROAD', playerId: 'p1', edgeId: edgeIds[3] });
	state = reducer(state, { type: 'PLACE_INITIAL_SETTLEMENT', playerId: 'p2', intersectionId: intersectionIds[20] });
	state = reducer(state, { type: 'PLACE_INITIAL_ROAD', playerId: 'p2', edgeId: edgeIds[15] });
	state = reducer(state, { type: 'PLACE_INITIAL_SETTLEMENT', playerId: 'p3', intersectionId: intersectionIds[40] });
	state = reducer(state, { type: 'PLACE_INITIAL_ROAD', playerId: 'p3', edgeId: edgeIds[30] });
	// Round 2: p3 → p2 → p1
	state = reducer(state, { type: 'PLACE_INITIAL_SETTLEMENT', playerId: 'p3', intersectionId: intersectionIds[45] });
	state = reducer(state, { type: 'PLACE_INITIAL_ROAD', playerId: 'p3', edgeId: edgeIds[35] });
	state = reducer(state, { type: 'PLACE_INITIAL_SETTLEMENT', playerId: 'p2', intersectionId: intersectionIds[25] });
	state = reducer(state, { type: 'PLACE_INITIAL_ROAD', playerId: 'p2', edgeId: edgeIds[20] });
	state = reducer(state, { type: 'PLACE_INITIAL_SETTLEMENT', playerId: 'p1', intersectionId: intersectionIds[10] });
	state = reducer(state, { type: 'PLACE_INITIAL_ROAD', playerId: 'p1', edgeId: edgeIds[8] });

	return state;
}

// Build once and freeze — used as the mock state throughout Phase 2
let _cachedMock: GameState | null = null;

export function getMockState(): GameState {
	if (!_cachedMock) {
		try {
			_cachedMock = buildMockState();
		} catch {
			// If reducer actions fail (wrong IDs), fall back to fresh initial state
			_cachedMock = createInitialGameState({
				players: [
					{ id: 'p1', name: 'Alice', colorIndex: 0 },
					{ id: 'p2', name: 'Bob', colorIndex: 1 },
					{ id: 'p3', name: 'Carol', colorIndex: 2 }
				],
				kingdomCards: ['Village', 'Smithy', 'Market', 'Festival', 'Militia', 'Mine', 'Moat', 'Remodel', 'Chapel', 'Witch'],
				rng: mulberry32(42)
			});
		}
	}
	return _cachedMock;
}
