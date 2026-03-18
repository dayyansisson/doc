/**
 * Validation rules for all game actions.
 * Each function returns null if valid, or an error string if invalid.
 */

import type {
	GameState,
	Player,
	Resource,
	VictoryCardType,
	AnyCard,
	TreasureCard,
	ResourceCard
} from './state.ts';
import {
	ATTACHMENT_CAPACITY,
	BUILD_COSTS,
	PIECE_LIMITS,
	VICTORY_COIN_COSTS,
	ACTION_COIN_COSTS
} from './state.ts';

// ============================================================
// Helpers
// ============================================================

export function getActivePlayer(state: GameState): Player {
	return state.players[state.activePlayerIndex];
}

export function getPlayer(state: GameState, playerId: string): Player {
	const p = state.players.find((p) => p.id === playerId);
	if (!p) throw new Error(`Player ${playerId} not found`);
	return p;
}

export function getHandCard(player: Player, cardId: string): AnyCard | undefined {
	return player.hand.find((c) => c.id === cardId);
}

/** Total spendable coins: treasure cards in hand + tempCoins */
export function totalSpendableCoins(player: Player): number {
	const handCoins = player.hand
		.filter((c): c is TreasureCard => c.type === 'TREASURE')
		.reduce((sum, c) => sum + c.coinValue, 0);
	return handCoins + player.tempCoins;
}

/** Count resource cards of a given type in hand */
export function countResource(player: Player, resource: Resource): number {
	return player.hand.filter(
		(c): c is ResourceCard => c.type === 'RESOURCE' && c.resource === resource
	).length;
}

/** Whether a building has an attached Province */
export function buildingHasProvince(state: GameState, intersectionId: string): boolean {
	const intersection = state.board.intersections.get(intersectionId);
	if (!intersection?.building) return false;
	return intersection.building.attachedCards.some((c) => c.cardType === 'PROVINCE');
}

// ============================================================
// Distance rule
// ============================================================

/** Returns true if the intersection is at least 2 edges away from all buildings */
export function satisfiesDistanceRule(state: GameState, intersectionId: string): boolean {
	const intersection = state.board.intersections.get(intersectionId);
	if (!intersection) return false;
	if (intersection.building) return false; // occupied

	// Check all adjacent intersections
	for (const edgeId of intersection.adjacentEdgeIds) {
		const edge = state.board.edges.get(edgeId);
		if (!edge) continue;
		for (const adjIntId of edge.adjacentIntersectionIds) {
			if (adjIntId === intersectionId) continue;
			const adj = state.board.intersections.get(adjIntId);
			if (adj?.building) return false;
		}
	}
	return true;
}

// ============================================================
// Road connectivity
// ============================================================

/** Returns true if the edge is adjacent to any of the player's roads or buildings */
export function edgeConnectedToPlayer(
	state: GameState,
	edgeId: string,
	playerId: string
): boolean {
	const edge = state.board.edges.get(edgeId);
	if (!edge) return false;

	for (const intId of edge.adjacentIntersectionIds) {
		const intersection = state.board.intersections.get(intId);
		if (!intersection) continue;

		// Adjacent building owned by player
		if (intersection.building?.playerId === playerId) return true;

		// Adjacent edge with a road owned by player
		for (const adjEdgeId of intersection.adjacentEdgeIds) {
			if (adjEdgeId === edgeId) continue;
			const adjEdge = state.board.edges.get(adjEdgeId);
			if (adjEdge?.road?.playerId === playerId) return true;
		}
	}
	return false;
}

// ============================================================
// Settlement validation
// ============================================================

export function validateBuildSettlement(
	state: GameState,
	playerId: string,
	intersectionId: string,
	isInitialPlacement = false
): string | null {
	const player = getPlayer(state, playerId);

	if (player.piecesRemaining.settlements <= 0) return 'No settlement pieces remaining';
	if (!satisfiesDistanceRule(state, intersectionId)) return 'Distance rule violated';

	if (!isInitialPlacement) {
		// Must connect to player's road network
		const intersection = state.board.intersections.get(intersectionId);
		if (!intersection) return 'Invalid intersection';
		let connected = false;
		for (const edgeId of intersection.adjacentEdgeIds) {
			const edge = state.board.edges.get(edgeId);
			if (edge?.road?.playerId === playerId) {
				connected = true;
				break;
			}
		}
		if (!connected) return 'Settlement must connect to your road network';

		// Check resource cost
		const cost = BUILD_COSTS.SETTLEMENT;
		for (const [resource, amount] of Object.entries(cost)) {
			if (countResource(player, resource as Resource) < (amount ?? 0)) {
				return `Insufficient ${resource}`;
			}
		}
	}

	return null;
}

// ============================================================
// Road validation
// ============================================================

export function validateBuildRoad(
	state: GameState,
	playerId: string,
	edgeId: string,
	isInitialPlacement = false,
	initialSettlementIntersectionId?: string
): string | null {
	const player = getPlayer(state, playerId);
	const edge = state.board.edges.get(edgeId);

	if (!edge) return 'Invalid edge';
	if (edge.road) return 'Edge is already occupied';
	if (player.piecesRemaining.roads <= 0) return 'No road pieces remaining';

	if (isInitialPlacement) {
		// Road must be adjacent to the settlement just placed
		if (!initialSettlementIntersectionId) return 'No initial settlement specified';
		if (!edge.adjacentIntersectionIds.includes(initialSettlementIntersectionId)) {
			return 'Road must be adjacent to your newly placed settlement';
		}
	} else {
		if (!edgeConnectedToPlayer(state, edgeId, playerId)) {
			return 'Road must connect to your existing network';
		}

		const cost = BUILD_COSTS.ROAD;
		for (const [resource, amount] of Object.entries(cost)) {
			if (countResource(player, resource as Resource) < (amount ?? 0)) {
				return `Insufficient ${resource}`;
			}
		}
	}

	return null;
}

// ============================================================
// City validation
// ============================================================

export function validateBuildCity(
	state: GameState,
	playerId: string,
	intersectionId: string
): string | null {
	const player = getPlayer(state, playerId);
	const intersection = state.board.intersections.get(intersectionId);

	if (!intersection) return 'Invalid intersection';
	if (!intersection.building) return 'No building at this intersection';
	if (intersection.building.playerId !== playerId) return 'This is not your building';
	if (intersection.building.type !== 'SETTLEMENT') return 'Can only upgrade a settlement';
	if (player.piecesRemaining.cities <= 0) return 'No city pieces remaining';

	const cost = BUILD_COSTS.CITY;
	for (const [resource, amount] of Object.entries(cost)) {
		if (countResource(player, resource as Resource) < (amount ?? 0)) {
			return `Insufficient ${resource}`;
		}
	}

	return null;
}

// ============================================================
// Card purchase validation
// ============================================================

export function validateBuyCard(
	state: GameState,
	playerId: string,
	cardName: string
): string | null {
	const player = getPlayer(state, playerId);

	if (player.buysRemaining <= 0) return 'No buys remaining';

	// Determine cost
	const victoryNames: Record<string, number> = { Estate: 2, Duchy: 5, Province: 8 };
	const actionCosts: Record<string, number> = ACTION_COIN_COSTS as Record<string, number>;

	let cost: number;
	if (cardName in victoryNames) {
		cost = victoryNames[cardName];
	} else if (cardName in actionCosts) {
		cost = actionCosts[cardName];
	} else {
		return `Unknown card: ${cardName}`;
	}

	// Check supply availability
	if (cardName === 'Estate' && state.supply.victoryPiles.estate <= 0) return 'Estate pile empty';
	if (cardName === 'Duchy' && state.supply.victoryPiles.duchy <= 0) return 'Duchy pile empty';
	if (cardName === 'Province' && state.supply.victoryPiles.province <= 0) return 'Province pile empty';
	if (cardName in actionCosts) {
		const remaining = state.supply.kingdomPiles.get(cardName as keyof typeof actionCosts);
		if (!remaining || remaining <= 0) return `${cardName} pile empty`;
	}

	if (totalSpendableCoins(player) < cost) {
		return `Insufficient coins (need ${cost}, have ${totalSpendableCoins(player)})`;
	}

	return null;
}

// ============================================================
// Attachment validation
// ============================================================

export function validateAttachVictoryCard(
	state: GameState,
	playerId: string,
	cardId: string,
	intersectionId: string
): string | null {
	const player = getPlayer(state, playerId);
	const card = getHandCard(player, cardId);

	if (!card) return 'Card not in hand';
	if (card.type !== 'VICTORY') return 'Not a Victory card';

	const intersection = state.board.intersections.get(intersectionId);
	if (!intersection) return 'Invalid intersection';
	if (!intersection.building) return 'No building at this intersection';
	if (intersection.building.playerId !== playerId) return 'Not your building';

	const victoryCard = card as import('./state.ts').VictoryCard;
	const cardType = victoryCard.victoryType;
	const building = intersection.building;
	const capacity = ATTACHMENT_CAPACITY[building.type][cardType];
	const current = building.attachedCards.filter((c) => c.cardType === cardType).length;

	if (current >= capacity) {
		return `${building.type} has no remaining ${cardType} slots (max ${capacity})`;
	}

	return null;
}

// ============================================================
// Harbor trade validation
// ============================================================

export function validateHarborTrade(
	state: GameState,
	playerId: string,
	harborId: string,
	offerCardIds: string[]
): string | null {
	const player = getPlayer(state, playerId);
	const harbor = state.board.harbors.get(harborId);
	if (!harbor) return 'Invalid harbor';

	// Player must have a building on a harbor intersection
	const hasBuilding = harbor.intersectionIds.some((intId) => {
		const intersection = state.board.intersections.get(intId);
		return intersection?.building?.playerId === playerId;
	});
	if (!hasBuilding) return 'No building on this harbor';

	const requiredCount = harbor.type === 'GENERIC_3_1' ? 3 : 2;
	if (offerCardIds.length !== requiredCount) {
		return `Harbor trade requires exactly ${requiredCount} resource cards`;
	}

	// All offered cards must be in hand and be resources
	for (const cardId of offerCardIds) {
		const card = getHandCard(player, cardId);
		if (!card) return 'Card not in hand';
		if (card.type !== 'RESOURCE') return 'Can only trade resource cards';
	}

	// For specific harbors, all cards must match the harbor resource
	if (harbor.type !== 'GENERIC_3_1') {
		const resourceType = harbor.type.replace('_2_1', '') as Resource;
		for (const cardId of offerCardIds) {
			const card = getHandCard(player, cardId) as ResourceCard;
			if (card.resource !== resourceType) {
				return `${harbor.type} requires ${resourceType} cards`;
			}
		}
	} else {
		// 3:1: all three must be the same resource type
		const firstCard = getHandCard(player, offerCardIds[0]) as ResourceCard;
		for (const cardId of offerCardIds.slice(1)) {
			const card = getHandCard(player, cardId) as ResourceCard;
			if (card.resource !== firstCard.resource) {
				return '3:1 harbor requires 3 cards of the same resource type';
			}
		}
	}

	return null;
}

// ============================================================
// Bank trade validation
// ============================================================

export function validateBankTrade(
	state: GameState,
	playerId: string,
	offerCardIds: [string, string, string, string]
): string | null {
	const player = getPlayer(state, playerId);

	for (const cardId of offerCardIds) {
		const card = getHandCard(player, cardId);
		if (!card) return 'Card not in hand';
		if (card.type !== 'RESOURCE') return 'Can only trade resource cards';
	}

	// All 4 must be the same resource
	const firstCard = getHandCard(player, offerCardIds[0]) as ResourceCard;
	for (const cardId of offerCardIds.slice(1)) {
		const card = getHandCard(player, cardId) as ResourceCard;
		if (card.resource !== firstCard.resource) {
			return 'Bank 4:1 trade requires 4 cards of the same resource type';
		}
	}

	return null;
}
