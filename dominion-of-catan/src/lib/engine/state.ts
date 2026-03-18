// Dominion of Catan — Game State Types

// ============================================================
// Enums
// ============================================================

export type Terrain = 'HILLS' | 'FOREST' | 'MOUNTAINS' | 'FIELDS' | 'PASTURE' | 'DESERT';

export type Resource = 'BRICK' | 'LUMBER' | 'ORE' | 'GRAIN' | 'WOOL';

export type TreasureType = 'COPPER' | 'SILVER' | 'GOLD';

export type VictoryCardType = 'ESTATE' | 'DUCHY' | 'PROVINCE';

export type CardType = 'RESOURCE' | 'TREASURE' | 'VICTORY' | 'ACTION' | 'CURSE';

export type CardZone = 'SUPPLY' | 'HAND' | 'DECK' | 'DISCARD' | 'PLAY_AREA' | 'ATTACHED' | 'TRASH' | 'BANK';

export type BuildingType = 'SETTLEMENT' | 'CITY';

export type HarborType =
	| 'GENERIC_3_1'
	| 'BRICK_2_1'
	| 'LUMBER_2_1'
	| 'ORE_2_1'
	| 'GRAIN_2_1'
	| 'WOOL_2_1';

export type GamePhase = 'SETUP' | 'INITIAL_PLACEMENT' | 'ROLL' | 'ACTION' | 'TRADE_BUILD' | 'ATTACH' | 'CLEANUP' | 'GAME_OVER';

export type ActionCardName =
	| 'Chapel'
	| 'Moat'
	| 'Village'
	| 'Militia'
	| 'Remodel'
	| 'Smithy'
	| 'Festival'
	| 'Market'
	| 'Mine'
	| 'Witch';

// ============================================================
// Board
// ============================================================

export interface HexTile {
	id: string;
	terrain: Terrain;
	resource: Resource | null;
	numberToken: number | null;
	hasRobber: boolean;
}

export interface Intersection {
	id: string;
	adjacentHexIds: string[];
	adjacentEdgeIds: string[];
	building: Building | null;
	/** Harbor this intersection connects to, if any */
	harborId: string | null;
}

export interface Edge {
	id: string;
	adjacentIntersectionIds: [string, string];
	road: Road | null;
}

export interface Harbor {
	id: string;
	type: HarborType;
	intersectionIds: [string, string];
}

export interface Board {
	hexes: Map<string, HexTile>;
	intersections: Map<string, Intersection>;
	edges: Map<string, Edge>;
	harbors: Map<string, Harbor>;
}

// ============================================================
// Buildings & Roads
// ============================================================

export interface AttachedCard {
	cardType: VictoryCardType;
	vpValue: number;
}

export interface Building {
	type: BuildingType;
	playerId: string;
	intersectionId: string;
	attachedCards: AttachedCard[];
}

export interface Road {
	playerId: string;
	edgeId: string;
}

// Attachment capacity per building type
export const ATTACHMENT_CAPACITY: Record<BuildingType, Record<VictoryCardType, number>> = {
	SETTLEMENT: { ESTATE: 3, DUCHY: 2, PROVINCE: 1 },
	CITY: { ESTATE: 6, DUCHY: 4, PROVINCE: 2 }
};

// ============================================================
// Cards
// ============================================================

export interface Card {
	id: string;
	type: CardType;
	name: string;
	coinCost: number;
	zone: CardZone;
	ownerId: string | null;
}

export interface ResourceCard extends Card {
	type: 'RESOURCE';
	resource: Resource;
}

export interface TreasureCard extends Card {
	type: 'TREASURE';
	treasureType: TreasureType;
	coinValue: number;
}

export interface VictoryCard extends Card {
	type: 'VICTORY';
	victoryType: VictoryCardType;
	vpValue: number;
}

export interface ActionCard extends Card {
	type: 'ACTION';
	actionName: ActionCardName;
}

export interface CurseCard extends Card {
	type: 'CURSE';
}

export type AnyCard = ResourceCard | TreasureCard | VictoryCard | ActionCard | CurseCard;

// Coin values for Treasure cards
export const TREASURE_COIN_VALUES: Record<TreasureType, number> = {
	COPPER: 1,
	SILVER: 2,
	GOLD: 3
};

// VP values for Victory cards
export const VICTORY_VP_VALUES: Record<VictoryCardType, number> = {
	ESTATE: 1,
	DUCHY: 3,
	PROVINCE: 6
};

// Coin costs for Victory cards
export const VICTORY_COIN_COSTS: Record<VictoryCardType, number> = {
	ESTATE: 2,
	DUCHY: 5,
	PROVINCE: 8
};

// Coin costs for Action cards
export const ACTION_COIN_COSTS: Record<ActionCardName, number> = {
	Chapel: 2,
	Moat: 2,
	Village: 3,
	Militia: 4,
	Remodel: 4,
	Smithy: 4,
	Festival: 5,
	Market: 5,
	Mine: 5,
	Witch: 5
};

// ============================================================
// Supply
// ============================================================

export interface Supply {
	treasureBank: { copper: number; silver: number; gold: number };
	victoryPiles: { estate: number; duchy: number; province: number };
	cursePile: number;
	kingdomPiles: Map<ActionCardName, number>;
	resourcePiles: { brick: number; lumber: number; ore: number; grain: number; wool: number };
}

// ============================================================
// Player
// ============================================================

export interface Player {
	id: string;
	name: string;
	colorIndex: number; // 0–3 maps to player color tokens
	deck: AnyCard[];
	hand: AnyCard[];
	discardPile: AnyCard[];
	playArea: AnyCard[];
	militiaPlays: number;
	actionsRemaining: number;
	buysRemaining: number;
	tempCoins: number;
	/**
	 * True until the starting Province is attached to a building.
	 * While true, the player may convert any production to coins regardless
	 * of Province attachment.
	 */
	startingProvinceActive: boolean;
	/** Piece counts remaining */
	piecesRemaining: { roads: number; settlements: number; cities: number };
}

// ============================================================
// Game State
// ============================================================

export interface GameState {
	players: Player[];
	activePlayerIndex: number;
	currentPhase: GamePhase;
	diceResult: number | null;
	board: Board;
	supply: Supply;
	trash: AnyCard[];
	longestRoadHolder: string | null;
	largestArmyHolder: string | null;
	gameOver: boolean;
	winner: string | null;
	turnCount: Map<string, number>;
	/** Initial placement tracking */
	initialPlacement: {
		round: 1 | 2;
		placedSettlement: boolean; // has active player placed settlement this round
	} | null;
}

// ============================================================
// Terrain → Resource mapping
// ============================================================

export const TERRAIN_RESOURCE: Partial<Record<Terrain, Resource>> = {
	HILLS: 'BRICK',
	FOREST: 'LUMBER',
	MOUNTAINS: 'ORE',
	FIELDS: 'GRAIN',
	PASTURE: 'WOOL'
};

// ============================================================
// Supply counts by player count
// ============================================================

export const SUPPLY_COUNTS = {
	victoryPiles: { 2: 8, 3: 12, 4: 12 },
	cursePile: { 2: 10, 3: 20, 4: 30 },
	resourcePiles: 19,
	kingdomPiles: 10
} as const;

export const TREASURE_BANK_COUNTS = {
	copper: 60,
	silver: 40,
	gold: 30
} as const;

export const PIECE_LIMITS = {
	roads: 15,
	settlements: 5,
	cities: 4
} as const;

// Building costs in resources
export const BUILD_COSTS: Record<'ROAD' | 'SETTLEMENT' | 'CITY', Partial<Record<Resource, number>>> = {
	ROAD: { BRICK: 1, LUMBER: 1 },
	SETTLEMENT: { BRICK: 1, LUMBER: 1, GRAIN: 1, WOOL: 1 },
	CITY: { GRAIN: 2, ORE: 3 }
};
