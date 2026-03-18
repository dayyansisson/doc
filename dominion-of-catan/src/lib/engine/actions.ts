import type { Resource, VictoryCardType, ActionCardName } from './state.ts';

// ============================================================
// Action type union — everything that can mutate GameState
// ============================================================

/** Roll the dice to begin a turn */
export interface RollDiceAction {
	type: 'ROLL_DICE';
	playerId: string;
	/** If provided, uses this value instead of random (for testing/determinism) */
	forcedRoll?: number;
}

/** Player chooses production outcome for one unit: take resource or convert to coin */
export interface ProductionChoiceAction {
	type: 'PRODUCTION_CHOICE';
	playerId: string;
	hexId: string;
	/** One choice per production unit from this hex/building combo */
	choices: Array<{ takeResource: boolean }>;
}

/** After all production choices, choose coin denominations */
export interface CoinDenominationAction {
	type: 'COIN_DENOMINATION';
	playerId: string;
	/** e.g. { copper: 2, silver: 1, gold: 0 } — must sum to total conversions */
	denominations: { copper: number; silver: number; gold: number };
}

/** Move the robber (on a 7 roll or after Militia) */
export interface MoveRobberAction {
	type: 'MOVE_ROBBER';
	playerId: string;
	targetHexId: string;
}

/** Play an Action card from hand */
export interface PlayActionCardAction {
	type: 'PLAY_ACTION_CARD';
	playerId: string;
	cardId: string;
}

/** Resolve Chapel: trash selected cards */
export interface ChapelTrashAction {
	type: 'CHAPEL_TRASH';
	playerId: string;
	cardIds: string[]; // up to 4
}

/** Resolve Moat reaction: reveal to block attack */
export interface MoatReactAction {
	type: 'MOAT_REACT';
	playerId: string;
	cardId: string;
	reveal: boolean;
}

/** Resolve Militia: active player moves robber, then effects cascade */
export interface MilitiaDiscardAction {
	type: 'MILITIA_DISCARD';
	playerId: string;
	cardIds: string[]; // cards to discard down to hand size 3
}

/** Resolve Remodel: trash a card and gain one costing up to +2 */
export interface RemodelAction {
	type: 'REMODEL';
	playerId: string;
	trashCardId: string;
	gainCardName: string; // name of the card to gain from supply
}

/** Resolve Mine: trash a Treasure and gain a better one */
export interface MineAction {
	type: 'MINE';
	playerId: string;
	trashCardId: string;
	gainTreasureType: 'SILVER' | 'GOLD';
}

/** Pass the Action phase */
export interface PassActionAction {
	type: 'PASS_ACTION';
	playerId: string;
}

/** Build a road on the board */
export interface BuildRoadAction {
	type: 'BUILD_ROAD';
	playerId: string;
	edgeId: string;
	/** Specific Brick and Lumber card IDs to spend */
	brickCardId: string;
	lumberCardId: string;
}

/** Build a settlement on the board */
export interface BuildSettlementAction {
	type: 'BUILD_SETTLEMENT';
	playerId: string;
	intersectionId: string;
	/** Card IDs to spend: brick, lumber, grain, wool */
	brickCardId: string;
	lumberCardId: string;
	grainCardId: string;
	woolCardId: string;
}

/** Build a city (upgrade a settlement) */
export interface BuildCityAction {
	type: 'BUILD_CITY';
	playerId: string;
	intersectionId: string;
	/** 2x grain, 3x ore card IDs */
	grainCardIds: [string, string];
	oreCardIds: [string, string, string];
}

/** Buy a card from the supply */
export interface BuyCardAction {
	type: 'BUY_CARD';
	playerId: string;
	cardName: string;
	/** Treasure card IDs from hand to spend */
	spendCardIds: string[];
}

/** Trade 4:1 with the bank */
export interface BankTradeAction {
	type: 'BANK_TRADE';
	playerId: string;
	/** 4 resource card IDs of same type to trade */
	offerCardIds: [string, string, string, string];
	receiveResource: Resource;
}

/** Trade via harbor (2:1 or 3:1) */
export interface HarborTradeAction {
	type: 'HARBOR_TRADE';
	playerId: string;
	harborId: string;
	/** 2 or 3 resource card IDs to trade */
	offerCardIds: string[];
	receiveResource: Resource;
}

/** Propose a trade to another player */
export interface ProposeTradeAction {
	type: 'PROPOSE_TRADE';
	playerId: string;
	targetPlayerId: string;
	offerCardIds: string[];
	requestCardIds: string[];
}

/** Accept or reject a trade proposal */
export interface RespondTradeAction {
	type: 'RESPOND_TRADE';
	playerId: string;
	accept: boolean;
}

/** Pass the Trade & Build phase */
export interface PassTradeBuildAction {
	type: 'PASS_TRADE_BUILD';
	playerId: string;
}

/** Attach a Victory card to a building */
export interface AttachVictoryCardAction {
	type: 'ATTACH_VICTORY_CARD';
	playerId: string;
	cardId: string;
	intersectionId: string;
}

/** Pass the Attach phase / end turn */
export interface PassAttachAction {
	type: 'PASS_ATTACH';
	playerId: string;
}

/** Place settlement during initial placement */
export interface PlaceInitialSettlementAction {
	type: 'PLACE_INITIAL_SETTLEMENT';
	playerId: string;
	intersectionId: string;
}

/** Place road during initial placement */
export interface PlaceInitialRoadAction {
	type: 'PLACE_INITIAL_ROAD';
	playerId: string;
	edgeId: string;
}

// ============================================================
// Union type
// ============================================================

export type GameAction =
	| RollDiceAction
	| ProductionChoiceAction
	| CoinDenominationAction
	| MoveRobberAction
	| PlayActionCardAction
	| ChapelTrashAction
	| MoatReactAction
	| MilitiaDiscardAction
	| RemodelAction
	| MineAction
	| PassActionAction
	| BuildRoadAction
	| BuildSettlementAction
	| BuildCityAction
	| BuyCardAction
	| BankTradeAction
	| HarborTradeAction
	| ProposeTradeAction
	| RespondTradeAction
	| PassTradeBuildAction
	| AttachVictoryCardAction
	| PassAttachAction
	| PlaceInitialSettlementAction
	| PlaceInitialRoadAction;
