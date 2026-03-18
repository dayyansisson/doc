/**
 * Dice roll production: determines which hexes fire, distributes
 * resources and coins, and handles the robber.
 */

import type { GameState, Player, AnyCard, TreasureCard } from './state.ts';
import { makeTreasureCard, makeResourceCard } from './setup.ts';

// ============================================================
// Dice roll
// ============================================================

export function rollDice(rng: () => number = Math.random): number {
	return Math.floor(rng() * 6) + 1 + Math.floor(rng() * 6) + 1;
}

// ============================================================
// Determine producing hexes and players
// ============================================================

export interface ProductionEvent {
	hexId: string;
	playerId: string;
	intersectionId: string;
	unitCount: number; // 1 for settlement, 2 for city
	canConvertToCoin: boolean;
}

/**
 * Returns all production events for a given dice roll.
 * Does not include hexes blocked by the robber.
 */
export function getProductionEvents(state: GameState, diceResult: number): ProductionEvent[] {
	const events: ProductionEvent[] = [];

	for (const hex of state.board.hexes.values()) {
		if (hex.hasRobber) continue;
		if (hex.numberToken !== diceResult) continue;
		if (hex.resource === null) continue;

		for (const intersection of state.board.intersections.values()) {
			if (!intersection.building) continue;
			if (!intersection.adjacentHexIds.includes(hex.id)) continue;

			const building = intersection.building;
			const player = state.players.find((p) => p.id === building.playerId);
			if (!player) continue;

			const unitCount = building.type === 'CITY' ? 2 : 1;

			// Can convert if building has an attached Province OR player's starting Province is active
			const hasAttachedProvince = building.attachedCards.some((c) => c.cardType === 'PROVINCE');
			const canConvert = hasAttachedProvince || player.startingProvinceActive;

			events.push({
				hexId: hex.id,
				playerId: building.playerId,
				intersectionId: intersection.id,
				unitCount,
				canConvertToCoin: canConvert
			});
		}
	}

	return events;
}

// ============================================================
// Coin denomination calculation
// ============================================================

/**
 * Given a total coin value to distribute, return all valid denomination
 * combinations (Copper=1, Silver=2, Gold=3).
 */
export function validCoinDenominations(
	total: number
): Array<{ copper: number; silver: number; gold: number }> {
	const results: Array<{ copper: number; silver: number; gold: number }> = [];
	for (let gold = 0; gold * 3 <= total; gold++) {
		for (let silver = 0; silver * 2 + gold * 3 <= total; silver++) {
			const copper = total - gold * 3 - silver * 2;
			if (copper >= 0) {
				results.push({ copper, silver, gold });
			}
		}
	}
	return results;
}

// ============================================================
// Apply production to a player's discard pile
// ============================================================

/**
 * Apply production for a single player, given their choices.
 * Returns updated state.
 */
export function applyProduction(
	state: GameState,
	playerId: string,
	choices: Array<{ hexId: string; takeResource: boolean }>,
	denominations: { copper: number; silver: number; gold: number } | null
): GameState {
	const playerIndex = state.players.findIndex((p) => p.id === playerId);
	if (playerIndex === -1) return state;

	const player = { ...state.players[playerIndex] };
	const newSupply = {
		...state.supply,
		resourcePiles: { ...state.supply.resourcePiles },
		treasureBank: { ...state.supply.treasureBank }
	};

	const newDiscardPile = [...player.discardPile];
	let totalConversions = 0;

	for (const choice of choices) {
		const hex = state.board.hexes.get(choice.hexId);
		if (!hex || hex.resource === null) continue;

		if (!choice.takeResource) {
			// Convert to coin (resource supply not affected)
			totalConversions++;
		} else {
			// Take resource card
			const resource = hex.resource;
			const resourceKey = resource.toLowerCase() as keyof typeof newSupply.resourcePiles;
			if (newSupply.resourcePiles[resourceKey] > 0) {
				newSupply.resourcePiles[resourceKey]--;
				const card = makeResourceCard(resource, playerId, 'DISCARD');
				newDiscardPile.push(card);
			}
			// If supply empty, player gets nothing
		}
	}

	// Distribute coins if any conversions
	if (totalConversions > 0 && denominations) {
		// Validate total
		const total = denominations.copper + denominations.silver * 2 + denominations.gold * 3;
		if (total === totalConversions) {
			for (let i = 0; i < denominations.copper; i++) {
				if (newSupply.treasureBank.copper > 0) {
					newSupply.treasureBank.copper--;
					newDiscardPile.push(makeTreasureCard('COPPER', playerId, 'DISCARD'));
				}
			}
			for (let i = 0; i < denominations.silver; i++) {
				if (newSupply.treasureBank.silver > 0) {
					newSupply.treasureBank.silver--;
					newDiscardPile.push(makeTreasureCard('SILVER', playerId, 'DISCARD'));
				}
			}
			for (let i = 0; i < denominations.gold; i++) {
				if (newSupply.treasureBank.gold > 0) {
					newSupply.treasureBank.gold--;
					newDiscardPile.push(makeTreasureCard('GOLD', playerId, 'DISCARD'));
				}
			}
		}
	}

	const updatedPlayer: Player = { ...player, discardPile: newDiscardPile };
	const updatedPlayers = [...state.players];
	updatedPlayers[playerIndex] = updatedPlayer;

	return { ...state, players: updatedPlayers, supply: newSupply };
}

// ============================================================
// Robber effects
// ============================================================

/**
 * Apply coin wipe to all players adjacent to the robber's new hex
 * (excluding the active player or the Militia player).
 * Wiped coins return to the bank.
 */
export function applyRobberCoinWipe(
	state: GameState,
	robberHexId: string,
	excludePlayerId: string
): GameState {
	// Find all players with buildings adjacent to this hex
	const affectedPlayerIds = new Set<string>();

	for (const intersection of state.board.intersections.values()) {
		if (!intersection.building) continue;
		if (intersection.building.playerId === excludePlayerId) continue;
		if (intersection.adjacentHexIds.includes(robberHexId)) {
			affectedPlayerIds.add(intersection.building.playerId);
		}
	}

	let newState = { ...state };

	for (const playerId of affectedPlayerIds) {
		const playerIndex = newState.players.findIndex((p) => p.id === playerId);
		if (playerIndex === -1) continue;

		const player = newState.players[playerIndex];
		const treasuresInHand = player.hand.filter(
			(c): c is TreasureCard => c.type === 'TREASURE'
		);

		if (treasuresInHand.length === 0) continue;

		const newHand = player.hand.filter((c) => c.type !== 'TREASURE');
		const newBank = {
			...newState.supply.treasureBank,
			copper:
				newState.supply.treasureBank.copper +
				treasuresInHand.filter((c) => c.treasureType === 'COPPER').length,
			silver:
				newState.supply.treasureBank.silver +
				treasuresInHand.filter((c) => c.treasureType === 'SILVER').length,
			gold:
				newState.supply.treasureBank.gold +
				treasuresInHand.filter((c) => c.treasureType === 'GOLD').length
		};

		const updatedPlayers = [...newState.players];
		updatedPlayers[playerIndex] = { ...player, hand: newHand };
		newState = {
			...newState,
			players: updatedPlayers,
			supply: { ...newState.supply, treasureBank: newBank }
		};
	}

	return newState;
}

/**
 * Move the robber to a new hex (updates hasRobber flags).
 */
export function moveRobber(state: GameState, targetHexId: string): GameState {
	const updatedHexes = new Map(state.board.hexes);
	for (const [id, hex] of updatedHexes) {
		updatedHexes.set(id, { ...hex, hasRobber: id === targetHexId });
	}
	return {
		...state,
		board: { ...state.board, hexes: updatedHexes }
	};
}

/**
 * Militia steal: take one random resource or treasure card from each
 * player adjacent to the robber, in favor of the Militia player.
 */
export function applyMilitiaSteal(
	state: GameState,
	robberHexId: string,
	militiaPlayerId: string,
	moatRevealedByPlayerIds: Set<string>,
	rng: () => number = Math.random
): GameState {
	const affectedPlayerIds = new Set<string>();

	for (const intersection of state.board.intersections.values()) {
		if (!intersection.building) continue;
		if (intersection.building.playerId === militiaPlayerId) continue;
		if (moatRevealedByPlayerIds.has(intersection.building.playerId)) continue;
		if (intersection.adjacentHexIds.includes(robberHexId)) {
			affectedPlayerIds.add(intersection.building.playerId);
		}
	}

	let newState = { ...state };
	const militiaPlayerIndex = newState.players.findIndex((p) => p.id === militiaPlayerId);
	if (militiaPlayerIndex === -1) return state;

	for (const victimId of affectedPlayerIds) {
		const victimIndex = newState.players.findIndex((p) => p.id === victimId);
		if (victimIndex === -1) continue;

		const victim = newState.players[victimIndex];
		// Only steal RESOURCE or TREASURE cards
		const stealable = victim.hand.filter(
			(c) => c.type === 'RESOURCE' || c.type === 'TREASURE'
		);
		if (stealable.length === 0) continue;

		const stolen = stealable[Math.floor(rng() * stealable.length)];
		const victimNewHand = victim.hand.filter((c) => c.id !== stolen.id);

		const militiaPlayer = newState.players[militiaPlayerIndex];
		const militiaNewHand = [...militiaPlayer.hand, { ...stolen, ownerId: militiaPlayerId, zone: 'HAND' as const }];

		const updatedPlayers = [...newState.players];
		updatedPlayers[victimIndex] = { ...victim, hand: victimNewHand };
		updatedPlayers[militiaPlayerIndex] = { ...militiaPlayer, hand: militiaNewHand };
		newState = { ...newState, players: updatedPlayers };
	}

	return newState;
}
