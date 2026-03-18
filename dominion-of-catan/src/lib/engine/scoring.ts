/**
 * VP calculation, Longest Road, and Largest Army.
 */

import type { GameState, Player, AnyCard, VictoryCard } from './state.ts';
import { longestRoad } from './hex-math.ts';

// ============================================================
// VP calculation
// ============================================================

export function calculateVP(state: GameState, playerId: string): number {
	let vp = 0;

	// Attached Victory cards (on buildings)
	for (const intersection of state.board.intersections.values()) {
		if (!intersection.building || intersection.building.playerId !== playerId) continue;
		for (const attached of intersection.building.attachedCards) {
			vp += attached.vpValue;
		}
	}

	const player = state.players.find((p) => p.id === playerId)!;

	// VP Kingdom cards in deck/hand/discard (any card with type VICTORY that is not attached)
	// Per spec: unattached Victory cards (Estate/Duchy/Province) do NOT score.
	// Only VP Kingdom cards (if any were selected) score from the deck.
	// In the starter set, no VP-only Kingdom cards exist, so this is a no-op for now.
	// Future: filter for ACTION-type cards with a vpValue property if added.

	// Curses
	const allDeckCards: AnyCard[] = [...player.deck, ...player.hand, ...player.discardPile];
	const curseCount = allDeckCards.filter((c) => c.type === 'CURSE').length;
	vp -= curseCount;

	// Longest Road
	if (state.longestRoadHolder === playerId) vp += 2;

	// Largest Army
	if (state.largestArmyHolder === playerId) vp += 2;

	return vp;
}

export function allVPs(state: GameState): Map<string, number> {
	const result = new Map<string, number>();
	for (const player of state.players) {
		result.set(player.id, calculateVP(state, player.id));
	}
	return result;
}

// ============================================================
// Longest Road
// ============================================================

export function recalculateLongestRoad(state: GameState): GameState {
	// Build edge endpoint map and intersection owner map
	const edgeEndpoints = new Map<string, [string, string]>();
	for (const edge of state.board.edges.values()) {
		edgeEndpoints.set(edge.id, edge.adjacentIntersectionIds);
	}

	const intersectionOwner = new Map<string, string | null>();
	for (const intersection of state.board.intersections.values()) {
		intersectionOwner.set(intersection.id, intersection.building?.playerId ?? null);
	}

	// Calculate road lengths for all players
	const roadLengths = new Map<string, number>();
	for (const player of state.players) {
		const playerRoads = new Set<string>();
		for (const edge of state.board.edges.values()) {
			if (edge.road?.playerId === player.id) playerRoads.add(edge.id);
		}
		roadLengths.set(player.id, longestRoad(playerRoads, edgeEndpoints, intersectionOwner, player.id));
	}

	// Determine holder
	let maxLength = 0;
	let holder: string | null = state.longestRoadHolder;

	// Find the maximum length
	for (const [, length] of roadLengths) {
		if (length > maxLength) maxLength = length;
	}

	if (maxLength < 5) {
		// No one qualifies
		holder = null;
	} else {
		// Find who has the longest
		const qualifiers = state.players.filter((p) => (roadLengths.get(p.id) ?? 0) === maxLength);

		if (qualifiers.length === 1) {
			// Clear winner
			holder = qualifiers[0].id;
		} else {
			// Tie — current holder retains if still tied at max
			if (holder && roadLengths.get(holder) === maxLength) {
				// Keep current holder
			} else {
				// No one holds it on a tie
				holder = null;
			}
		}
	}

	return { ...state, longestRoadHolder: holder };
}

// ============================================================
// Largest Army
// ============================================================

export function recalculateLargestArmy(state: GameState): GameState {
	const MINIMUM = 3;
	let maxMilitia = 0;
	for (const player of state.players) {
		if (player.militiaPlays > maxMilitia) maxMilitia = player.militiaPlays;
	}

	if (maxMilitia < MINIMUM) {
		return { ...state, largestArmyHolder: null };
	}

	const leaders = state.players.filter((p) => p.militiaPlays === maxMilitia);
	if (leaders.length === 1) {
		return { ...state, largestArmyHolder: leaders[0].id };
	}

	// On a tie, keep the current holder if they're still tied
	if (state.largestArmyHolder) {
		const holder = state.players.find((p) => p.id === state.largestArmyHolder);
		if (holder && holder.militiaPlays === maxMilitia) {
			return state; // no change
		}
	}

	return state; // no change on unresolvable tie
}

// ============================================================
// Game end detection
// ============================================================

export function checkGameEnd(state: GameState): GameState {
	if (state.gameOver) return state;

	// Condition 1: Province pile empty
	const provinceEmpty = state.supply.victoryPiles.province === 0;

	// Condition 2: Any 3 supply piles empty
	let emptyPileCount = 0;
	if (state.supply.victoryPiles.estate === 0) emptyPileCount++;
	if (state.supply.victoryPiles.duchy === 0) emptyPileCount++;
	if (state.supply.victoryPiles.province === 0) emptyPileCount++;
	if (state.supply.cursePile === 0) emptyPileCount++;
	for (const count of state.supply.kingdomPiles.values()) {
		if (count === 0) emptyPileCount++;
	}
	for (const count of Object.values(state.supply.resourcePiles)) {
		if (count === 0) emptyPileCount++;
	}
	if (state.supply.treasureBank.copper === 0) emptyPileCount++;
	if (state.supply.treasureBank.silver === 0) emptyPileCount++;
	if (state.supply.treasureBank.gold === 0) emptyPileCount++;

	if (!provinceEmpty && emptyPileCount < 3) return state;

	// Game over — calculate final scores
	const vps = allVPs(state);
	let maxVP = -Infinity;
	let winner: string | null = null;
	let minTurns = Infinity;

	for (const player of state.players) {
		const vp = vps.get(player.id) ?? 0;
		const turns = state.turnCount.get(player.id) ?? 0;
		if (
			vp > maxVP ||
			(vp === maxVP && turns < minTurns)
		) {
			maxVP = vp;
			minTurns = turns;
			winner = player.id;
		}
	}

	return {
		...state,
		gameOver: true,
		currentPhase: 'GAME_OVER',
		winner
	};
}
