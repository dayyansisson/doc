/**
 * Main game state reducer.
 * (state, action) → state — pure function, no side effects.
 */

import type { GameState, Player, AnyCard, TreasureCard, VictoryCard, ResourceCard, ActionCard, Resource } from './state.ts';
import { ATTACHMENT_CAPACITY, BUILD_COSTS, VICTORY_COIN_COSTS, VICTORY_VP_VALUES, ACTION_COIN_COSTS } from './state.ts';
import type { GameAction } from './actions.ts';
import {
	validateBuildSettlement,
	validateBuildRoad,
	validateBuildCity,
	validateBuyCard,
	validateAttachVictoryCard,
	validateHarborTrade,
	validateBankTrade,
	getActivePlayer,
	getPlayer,
	totalSpendableCoins
} from './validation.ts';
import { rollDice, getProductionEvents, applyProduction, moveRobber, applyRobberCoinWipe, applyMilitiaSteal } from './production.ts';
import { makeResourceCard, makeTreasureCard, makeVictoryCard, makeActionCard, makeCurseCard } from './setup.ts';
import { recalculateLongestRoad, recalculateLargestArmy, checkGameEnd } from './scoring.ts';

// ============================================================
// Deep-clone helpers (structural clone of Maps)
// ============================================================

function cloneBoard(state: GameState): GameState['board'] {
	return {
		hexes: new Map(state.board.hexes),
		intersections: new Map(state.board.intersections),
		edges: new Map(state.board.edges),
		harbors: new Map(state.board.harbors)
	};
}

// ============================================================
// Player update helpers
// ============================================================

function updatePlayer(state: GameState, playerId: string, updater: (p: Player) => Player): GameState {
	const idx = state.players.findIndex((p) => p.id === playerId);
	if (idx === -1) return state;
	const players = [...state.players];
	players[idx] = updater(players[idx]);
	return { ...state, players };
}

function removeCardsFromHand(player: Player, cardIds: string[]): Player {
	const idSet = new Set(cardIds);
	return { ...player, hand: player.hand.filter((c) => !idSet.has(c.id)) };
}

function trashCards(state: GameState, cards: AnyCard[]): GameState {
	return { ...state, trash: [...state.trash, ...cards.map((c) => ({ ...c, zone: 'TRASH' as const }))] };
}

// ============================================================
// Draw cards helper
// ============================================================

function drawCards(player: Player, count: number, rng: () => number = Math.random): Player {
	let deck = [...player.deck];
	let discard = [...player.discardPile];
	const drawn: AnyCard[] = [];

	for (let i = 0; i < count; i++) {
		if (deck.length === 0) {
			if (discard.length === 0) break;
			// Shuffle discard into deck
			deck = shuffle(discard, rng).map((c) => ({ ...c, zone: 'DECK' as const }));
			discard = [];
		}
		const card = deck.shift()!;
		drawn.push({ ...card, zone: 'HAND' as const });
	}

	return {
		...player,
		deck: deck.map((c) => ({ ...c, zone: 'DECK' as const })),
		discardPile: discard,
		hand: [...player.hand, ...drawn]
	};
}

function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
	const result = [...arr];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

// ============================================================
// Spend coins helper
// ============================================================

function spendCoins(player: Player, state: GameState, spendCardIds: string[], cost: number): { player: Player; state: GameState } {
	const treasureCards = spendCardIds
		.map((id) => player.hand.find((c) => c.id === id))
		.filter((c): c is TreasureCard => c?.type === 'TREASURE');

	const spentValue = treasureCards.reduce((sum, c) => sum + c.coinValue, 0);
	const tempCoinsUsed = Math.max(0, cost - spentValue);

	const newHand = player.hand.filter((c) => !spendCardIds.includes(c.id));
	const newBank = {
		copper: state.supply.treasureBank.copper + treasureCards.filter((c) => c.treasureType === 'COPPER').length,
		silver: state.supply.treasureBank.silver + treasureCards.filter((c) => c.treasureType === 'SILVER').length,
		gold: state.supply.treasureBank.gold + treasureCards.filter((c) => c.treasureType === 'GOLD').length
	};

	const newPlayer = {
		...player,
		hand: newHand,
		tempCoins: player.tempCoins - tempCoinsUsed
	};

	const newState = {
		...state,
		supply: { ...state.supply, treasureBank: newBank }
	};

	return { player: newPlayer, state: newState };
}

// ============================================================
// Main reducer
// ============================================================

export function reducer(state: GameState, action: GameAction): GameState {
	if (state.gameOver && action.type !== 'ROLL_DICE') return state;

	switch (action.type) {
		// -------------------------------------------------------
		case 'PLACE_INITIAL_SETTLEMENT': {
			const { playerId, intersectionId } = action;
			const err = validateBuildSettlement(state, playerId, intersectionId, true);
			if (err) return state; // invalid — ignore

			const board = cloneBoard(state);
			const intersection = board.intersections.get(intersectionId);
			if (!intersection) return state;

			const player = getPlayer(state, playerId);
			board.intersections.set(intersectionId, {
				...intersection,
				building: {
					type: 'SETTLEMENT',
					playerId,
					intersectionId,
					attachedCards: []
				}
			});

			let newState = updatePlayer(state, playerId, (p) => ({
				...p,
				piecesRemaining: { ...p.piecesRemaining, settlements: p.piecesRemaining.settlements - 1 }
			}));
			newState = { ...newState, board };
			newState = { ...newState, initialPlacement: { ...newState.initialPlacement!, placedSettlement: true } };
			return newState;
		}

		// -------------------------------------------------------
		case 'PLACE_INITIAL_ROAD': {
			const { playerId, edgeId } = action;

			// Find the last placed settlement for this player (the one placed this round)
			// For simplicity, use the most recently placed settlement
			const playerBuildings = Array.from(state.board.intersections.values())
				.filter((i) => i.building?.playerId === playerId)
				.map((i) => i.building!);

			const lastSettlement = playerBuildings[playerBuildings.length - 1];
			if (!lastSettlement) return state;

			const err = validateBuildRoad(state, playerId, edgeId, true, lastSettlement.intersectionId);
			if (err) return state;

			const board = cloneBoard(state);
			const edge = board.edges.get(edgeId);
			if (!edge) return state;

			board.edges.set(edgeId, {
				...edge,
				road: { playerId, edgeId }
			});

			let newState = updatePlayer(state, playerId, (p) => ({
				...p,
				piecesRemaining: { ...p.piecesRemaining, roads: p.piecesRemaining.roads - 1 }
			}));
			newState = { ...newState, board };

			// Advance initial placement state
			const placement = state.initialPlacement!;
			const activeIndex = state.activePlayerIndex;
			const playerCount = state.players.length;

			let nextIndex = activeIndex;
			let nextPhase = state.currentPhase;
			let nextPlacement: GameState['initialPlacement'] = { round: placement.round, placedSettlement: false };

			if (placement.round === 1) {
				if (activeIndex < playerCount - 1) {
					nextIndex = activeIndex + 1;
				} else {
					// Start round 2 with the same last player
					nextPlacement = { round: 2, placedSettlement: false };
				}
			} else {
				// Round 2 goes in reverse
				if (activeIndex > 0) {
					nextIndex = activeIndex - 1;

					// Grant starting resources for second settlement
					newState = grantStartingResources(newState, playerId, lastSettlement.intersectionId);
				} else {
					// Round 2 complete, grant resources for this player then start game
					newState = grantStartingResources(newState, playerId, lastSettlement.intersectionId);
					nextPhase = 'ROLL';
					nextPlacement = null;
					nextIndex = 0;
				}
			}

			return {
				...newState,
				activePlayerIndex: nextIndex,
				currentPhase: nextPhase,
				initialPlacement: nextPlacement
			};
		}

		// -------------------------------------------------------
		case 'ROLL_DICE': {
			if (state.currentPhase !== 'ROLL') return state;
			if (state.players[state.activePlayerIndex].id !== action.playerId) return state;

			const roll = action.forcedRoll ?? rollDice();
			let newState = { ...state, diceResult: roll };

			if (roll === 7) {
				// No production — move to ACTION but robber must be moved first
				// In practice the UI will prompt for robber placement before allowing action
				return { ...newState, currentPhase: 'ACTION' };
			}

			// Production: auto-resolve for players with no choices
			// (In full implementation, production choices are handled via PRODUCTION_CHOICE actions)
			// For now, just advance phase
			return { ...newState, currentPhase: 'ACTION' };
		}

		// -------------------------------------------------------
		case 'MOVE_ROBBER': {
			const { playerId, targetHexId } = action;
			const hex = state.board.hexes.get(targetHexId);
			if (!hex) return state;
			if (hex.hasRobber) return state; // must move to a different hex

			let newState = moveRobber(state, targetHexId);
			newState = applyRobberCoinWipe(newState, targetHexId, playerId);

			return newState;
		}

		// -------------------------------------------------------
		case 'PRODUCTION_CHOICE': {
			const { playerId, hexId, choices } = action;
			// Count conversions for this event
			const conversionCount = choices.filter((c) => !c.takeResource).length;

			// If no conversions needed, apply resources immediately
			if (conversionCount === 0) {
				return applyProduction(state, playerId, choices.map((c) => ({ hexId, takeResource: c.takeResource })), null);
			}
			// With conversions, we need COIN_DENOMINATION next — defer
			return state;
		}

		// -------------------------------------------------------
		case 'COIN_DENOMINATION': {
			// Handled externally per production event; this would finalize the conversion
			return state;
		}

		// -------------------------------------------------------
		case 'PLAY_ACTION_CARD': {
			if (state.currentPhase !== 'ACTION') return state;

			const player = getPlayer(state, action.playerId);
			if (player.actionsRemaining <= 0) return state;

			const card = player.hand.find((c) => c.id === action.cardId);
			if (!card || card.type !== 'ACTION') return state;

			const actionCard = card as ActionCard;

			// Move card to play area
			let newState = updatePlayer(state, action.playerId, (p) => ({
				...p,
				hand: p.hand.filter((c) => c.id !== action.cardId),
				playArea: [...p.playArea, { ...card, zone: 'PLAY_AREA' as const }],
				actionsRemaining: p.actionsRemaining - 1
			}));

			// Resolve card effects
			newState = resolveActionCard(newState, action.playerId, actionCard);
			return newState;
		}

		// -------------------------------------------------------
		case 'PASS_ACTION': {
			if (state.currentPhase !== 'ACTION') return state;
			if (getActivePlayer(state).id !== action.playerId) return state;
			return { ...state, currentPhase: 'TRADE_BUILD' };
		}

		// -------------------------------------------------------
		case 'BUILD_ROAD': {
			if (state.currentPhase !== 'TRADE_BUILD') return state;

			const { playerId, edgeId, brickCardId, lumberCardId } = action;
			const err = validateBuildRoad(state, playerId, edgeId);
			if (err) return state;

			const player = getPlayer(state, playerId);
			const brickCard = player.hand.find((c) => c.id === brickCardId);
			const lumberCard = player.hand.find((c) => c.id === lumberCardId);
			if (!brickCard || !lumberCard) return state;

			// Trash the resource cards
			let newState = updatePlayer(state, playerId, (p) => removeCardsFromHand(p, [brickCardId, lumberCardId]));
			newState = trashCards(newState, [brickCard, lumberCard]);

			// Place road
			const board = cloneBoard(newState);
			const edge = board.edges.get(edgeId);
			if (!edge) return state;
			board.edges.set(edgeId, { ...edge, road: { playerId, edgeId } });
			newState = { ...newState, board };

			newState = updatePlayer(newState, playerId, (p) => ({
				...p,
				piecesRemaining: { ...p.piecesRemaining, roads: p.piecesRemaining.roads - 1 }
			}));

			newState = recalculateLongestRoad(newState);
			return newState;
		}

		// -------------------------------------------------------
		case 'BUILD_SETTLEMENT': {
			if (state.currentPhase !== 'TRADE_BUILD') return state;

			const { playerId, intersectionId, brickCardId, lumberCardId, grainCardId, woolCardId } = action;
			const err = validateBuildSettlement(state, playerId, intersectionId);
			if (err) return state;

			const player = getPlayer(state, playerId);
			const spendIds = [brickCardId, lumberCardId, grainCardId, woolCardId];
			const spendCards = spendIds.map((id) => player.hand.find((c) => c.id === id));
			if (spendCards.some((c) => !c)) return state;

			let newState = updatePlayer(state, playerId, (p) => removeCardsFromHand(p, spendIds));
			newState = trashCards(newState, spendCards as AnyCard[]);

			const board = cloneBoard(newState);
			const intersection = board.intersections.get(intersectionId);
			if (!intersection) return state;
			board.intersections.set(intersectionId, {
				...intersection,
				building: { type: 'SETTLEMENT', playerId, intersectionId, attachedCards: [] }
			});
			newState = { ...newState, board };

			newState = updatePlayer(newState, playerId, (p) => ({
				...p,
				piecesRemaining: { ...p.piecesRemaining, settlements: p.piecesRemaining.settlements - 1 }
			}));

			newState = recalculateLongestRoad(newState);
			return newState;
		}

		// -------------------------------------------------------
		case 'BUILD_CITY': {
			if (state.currentPhase !== 'TRADE_BUILD') return state;

			const { playerId, intersectionId, grainCardIds, oreCardIds } = action;
			const err = validateBuildCity(state, playerId, intersectionId);
			if (err) return state;

			const player = getPlayer(state, playerId);
			const spendIds = [...grainCardIds, ...oreCardIds];
			const spendCards = spendIds.map((id) => player.hand.find((c) => c.id === id));
			if (spendCards.some((c) => !c)) return state;

			let newState = updatePlayer(state, playerId, (p) => removeCardsFromHand(p, spendIds));
			newState = trashCards(newState, spendCards as AnyCard[]);

			const board = cloneBoard(newState);
			const intersection = board.intersections.get(intersectionId);
			if (!intersection || !intersection.building) return state;
			board.intersections.set(intersectionId, {
				...intersection,
				building: { ...intersection.building, type: 'CITY' }
			});
			newState = { ...newState, board };

			// Settlement piece returns, city piece consumed
			newState = updatePlayer(newState, playerId, (p) => ({
				...p,
				piecesRemaining: {
					...p.piecesRemaining,
					settlements: p.piecesRemaining.settlements + 1,
					cities: p.piecesRemaining.cities - 1
				}
			}));

			return newState;
		}

		// -------------------------------------------------------
		case 'BUY_CARD': {
			if (state.currentPhase !== 'TRADE_BUILD') return state;

			const { playerId, cardName, spendCardIds } = action;
			const err = validateBuyCard(state, playerId, cardName);
			if (err) return state;

			const player = getPlayer(state, playerId);
			const cost = getCardCost(cardName);
			const { player: playerAfterSpend, state: stateAfterSpend } = spendCoins(player, state, spendCardIds, cost);

			// Create and add the purchased card to discard pile
			const newCard = createCardByName(cardName, playerId);
			if (!newCard) return state;

			let newState = updatePlayer(stateAfterSpend, playerId, () => ({
				...playerAfterSpend,
				discardPile: [...playerAfterSpend.discardPile, { ...newCard, zone: 'DISCARD' as const }],
				buysRemaining: playerAfterSpend.buysRemaining - 1
			}));

			// Decrement supply
			newState = decrementSupply(newState, cardName);
			newState = checkGameEnd(newState);
			return newState;
		}

		// -------------------------------------------------------
		case 'BANK_TRADE': {
			if (state.currentPhase !== 'TRADE_BUILD') return state;

			const { playerId, offerCardIds, receiveResource } = action;
			const err = validateBankTrade(state, playerId, offerCardIds);
			if (err) return state;

			const player = getPlayer(state, playerId);
			const offeredCards = offerCardIds.map((id) => player.hand.find((c) => c.id === id)) as ResourceCard[];
			const resource = offeredCards[0].resource;
			const resourceKey = resource.toLowerCase() as keyof typeof state.supply.resourcePiles;

			// Return 4 cards to supply
			const newResourcePiles = {
				...state.supply.resourcePiles,
				[resourceKey]: state.supply.resourcePiles[resourceKey] + 4
			};

			// Remove offered cards from hand
			let newState = updatePlayer(state, playerId, (p) => removeCardsFromHand(p, offerCardIds));
			newState = { ...newState, supply: { ...newState.supply, resourcePiles: newResourcePiles } };

			// Give requested resource (goes to hand immediately)
			const receiveKey = receiveResource.toLowerCase() as keyof typeof state.supply.resourcePiles;
			if (newState.supply.resourcePiles[receiveKey] > 0) {
				const received = makeResourceCard(receiveResource, playerId, 'HAND');
				newState = updatePlayer(newState, playerId, (p) => ({ ...p, hand: [...p.hand, received] }));
				newState = { ...newState, supply: { ...newState.supply, resourcePiles: { ...newState.supply.resourcePiles, [receiveKey]: newState.supply.resourcePiles[receiveKey] - 1 } } };
			}

			return newState;
		}

		// -------------------------------------------------------
		case 'HARBOR_TRADE': {
			if (state.currentPhase !== 'TRADE_BUILD') return state;

			const { playerId, harborId, offerCardIds, receiveResource } = action;
			const err = validateHarborTrade(state, playerId, harborId, offerCardIds);
			if (err) return state;

			const player = getPlayer(state, playerId);
			const offeredCards = offerCardIds.map((id) => player.hand.find((c) => c.id === id)) as ResourceCard[];

			// Trash offered cards
			let newState = updatePlayer(state, playerId, (p) => removeCardsFromHand(p, offerCardIds));
			newState = trashCards(newState, offeredCards);

			// Give requested resource from supply (to hand)
			const receiveKey = receiveResource.toLowerCase() as keyof typeof state.supply.resourcePiles;
			if (newState.supply.resourcePiles[receiveKey] > 0) {
				const received = makeResourceCard(receiveResource, playerId, 'HAND');
				newState = updatePlayer(newState, playerId, (p) => ({ ...p, hand: [...p.hand, received] }));
				newState = { ...newState, supply: { ...newState.supply, resourcePiles: { ...newState.supply.resourcePiles, [receiveKey]: newState.supply.resourcePiles[receiveKey] - 1 } } };
			}

			return newState;
		}

		// -------------------------------------------------------
		case 'PASS_TRADE_BUILD': {
			if (state.currentPhase !== 'TRADE_BUILD') return state;
			if (getActivePlayer(state).id !== action.playerId) return state;
			return { ...state, currentPhase: 'ATTACH' };
		}

		// -------------------------------------------------------
		case 'ATTACH_VICTORY_CARD': {
			if (state.currentPhase !== 'ATTACH') return state;

			const { playerId, cardId, intersectionId } = action;
			const err = validateAttachVictoryCard(state, playerId, cardId, intersectionId);
			if (err) return state;

			const player = getPlayer(state, playerId);
			const card = player.hand.find((c) => c.id === cardId) as VictoryCard;

			// Remove from hand
			let newState = updatePlayer(state, playerId, (p) => removeCardsFromHand(p, [cardId]));

			// Attach to building
			const board = cloneBoard(newState);
			const intersection = board.intersections.get(intersectionId)!;
			board.intersections.set(intersectionId, {
				...intersection,
				building: {
					...intersection.building!,
					attachedCards: [
						...intersection.building!.attachedCards,
						{ cardType: card.victoryType, vpValue: card.vpValue }
					]
				}
			});
			newState = { ...newState, board };

			// If this is the starting Province, disable the early-game exception
			if (card.victoryType === 'PROVINCE') {
				newState = updatePlayer(newState, playerId, (p) => ({
					...p,
					startingProvinceActive: false
				}));
			}

			return newState;
		}

		// -------------------------------------------------------
		case 'PASS_ATTACH': {
			if (state.currentPhase !== 'ATTACH') return state;
			if (getActivePlayer(state).id !== action.playerId) return state;
			return cleanupPhase(state);
		}

		// -------------------------------------------------------
		default:
			return state;
	}
}

// ============================================================
// Cleanup phase
// ============================================================

function cleanupPhase(state: GameState): GameState {
	const activePlayer = getActivePlayer(state);

	// Discard hand and play area, reset turn state
	let newState = updatePlayer(state, activePlayer.id, (p) => {
		const allCards = [...p.hand, ...p.playArea].map((c) => ({ ...c, zone: 'DISCARD' as const }));
		const newDiscard = [...p.discardPile, ...allCards];
		const resetPlayer: Player = {
			...p,
			hand: [],
			playArea: [],
			discardPile: newDiscard,
			tempCoins: 0,
			actionsRemaining: 1,
			buysRemaining: 1
		};
		// Draw 7
		return drawCards(resetPlayer, 7);
	});

	// Increment turn count
	const newTurnCount = new Map(newState.turnCount);
	newTurnCount.set(activePlayer.id, (newTurnCount.get(activePlayer.id) ?? 0) + 1);
	newState = { ...newState, turnCount: newTurnCount };

	// Check game end
	newState = checkGameEnd(newState);
	if (newState.gameOver) return newState;

	// Advance to next player
	const nextIndex = (state.activePlayerIndex + 1) % state.players.length;
	return {
		...newState,
		activePlayerIndex: nextIndex,
		currentPhase: 'ROLL',
		diceResult: null
	};
}

// ============================================================
// Action card resolution
// ============================================================

function resolveActionCard(state: GameState, playerId: string, card: ActionCard): GameState {
	switch (card.actionName) {
		case 'Village':
			return updatePlayer(state, playerId, (p) => ({
				...drawCards(p, 1),
				actionsRemaining: p.actionsRemaining + 2
			}));

		case 'Smithy':
			return updatePlayer(state, playerId, (p) => drawCards(p, 3));

		case 'Festival':
			return updatePlayer(state, playerId, (p) => ({
				...p,
				actionsRemaining: p.actionsRemaining + 2,
				buysRemaining: p.buysRemaining + 1,
				tempCoins: p.tempCoins + 2
			}));

		case 'Market':
			return updatePlayer(state, playerId, (p) => ({
				...drawCards(p, 1),
				actionsRemaining: p.actionsRemaining + 1,
				buysRemaining: p.buysRemaining + 1,
				tempCoins: p.tempCoins + 1
			}));

		case 'Militia':
			// +2 coins; discard and robber effects are handled via separate actions
			return updatePlayer(state, playerId, (p) => ({
				...p,
				tempCoins: p.tempCoins + 2,
				militiaPlays: p.militiaPlays + 1
			}));

		case 'Moat':
			return updatePlayer(state, playerId, (p) => drawCards(p, 2));

		case 'Witch': {
			// +2 cards; curse each other player
			let newState = updatePlayer(state, playerId, (p) => drawCards(p, 2));
			for (const player of newState.players) {
				if (player.id === playerId) continue;
				if (newState.supply.cursePile <= 0) break;
				const curse = makeCurseCard(player.id, 'DISCARD');
				newState = updatePlayer(newState, player.id, (p) => ({
					...p,
					discardPile: [...p.discardPile, curse]
				}));
				newState = { ...newState, supply: { ...newState.supply, cursePile: newState.supply.cursePile - 1 } };
			}
			return newState;
		}

		// Chapel, Remodel, Mine require player input — handled via separate actions
		default:
			return state;
	}
}

// ============================================================
// Supply helpers
// ============================================================

function getCardCost(cardName: string): number {
	const victoryCosts: Record<string, number> = { Estate: 2, Duchy: 5, Province: 8 };
	return victoryCosts[cardName] ?? (ACTION_COIN_COSTS as Record<string, number>)[cardName] ?? 0;
}

function decrementSupply(state: GameState, cardName: string): GameState {
	const supply = { ...state.supply, victoryPiles: { ...state.supply.victoryPiles }, kingdomPiles: new Map(state.supply.kingdomPiles) };

	switch (cardName) {
		case 'Estate': supply.victoryPiles.estate = Math.max(0, supply.victoryPiles.estate - 1); break;
		case 'Duchy': supply.victoryPiles.duchy = Math.max(0, supply.victoryPiles.duchy - 1); break;
		case 'Province': supply.victoryPiles.province = Math.max(0, supply.victoryPiles.province - 1); break;
		default: {
			const current = supply.kingdomPiles.get(cardName as any) ?? 0;
			supply.kingdomPiles.set(cardName as any, Math.max(0, current - 1));
		}
	}

	return { ...state, supply };
}

function createCardByName(name: string, ownerId: string): AnyCard | null {
	switch (name) {
		case 'Estate': return makeVictoryCard('ESTATE', ownerId);
		case 'Duchy': return makeVictoryCard('DUCHY', ownerId);
		case 'Province': return makeVictoryCard('PROVINCE', ownerId);
		case 'Chapel': return makeActionCard('Chapel', ownerId);
		case 'Moat': return makeActionCard('Moat', ownerId);
		case 'Village': return makeActionCard('Village', ownerId);
		case 'Militia': return makeActionCard('Militia', ownerId);
		case 'Remodel': return makeActionCard('Remodel', ownerId);
		case 'Smithy': return makeActionCard('Smithy', ownerId);
		case 'Festival': return makeActionCard('Festival', ownerId);
		case 'Market': return makeActionCard('Market', ownerId);
		case 'Mine': return makeActionCard('Mine', ownerId);
		case 'Witch': return makeActionCard('Witch', ownerId);
		default: return null;
	}
}

// ============================================================
// Initial placement starting resources
// ============================================================

function grantStartingResources(state: GameState, playerId: string, intersectionId: string): GameState {
	const intersection = state.board.intersections.get(intersectionId);
	if (!intersection) return state;

	let newState = { ...state, supply: { ...state.supply, resourcePiles: { ...state.supply.resourcePiles } } };

	for (const hexId of intersection.adjacentHexIds) {
		const hex = state.board.hexes.get(hexId);
		if (!hex || hex.resource === null) continue;

		const resourceKey = hex.resource.toLowerCase() as keyof typeof state.supply.resourcePiles;
		if (newState.supply.resourcePiles[resourceKey] <= 0) continue;

		newState = {
			...newState,
			supply: {
				...newState.supply,
				resourcePiles: {
					...newState.supply.resourcePiles,
					[resourceKey]: newState.supply.resourcePiles[resourceKey] - 1
				}
			}
		};

		newState = updatePlayer(newState, playerId, (p) => ({
			...p,
			hand: [...p.hand, makeResourceCard(hex.resource!, playerId, 'HAND')]
		}));
	}

	return newState;
}
