/**
 * Game setup: board generation, supply initialization, starting decks,
 * and initial placement helpers.
 */

import type {
	GameState,
	Board,
	HexTile,
	Intersection,
	Edge,
	Harbor,
	Player,
	Supply,
	AnyCard,
	ResourceCard,
	TreasureCard,
	VictoryCard,
	ActionCard,
	Terrain,
	Resource,
	HarborType,
	ActionCardName
} from './state.ts';
import {
	TERRAIN_RESOURCE,
	SUPPLY_COUNTS,
	TREASURE_BANK_COUNTS,
	PIECE_LIMITS,
	VICTORY_COIN_COSTS,
	VICTORY_VP_VALUES,
	TREASURE_COIN_VALUES
} from './state.ts';
import {
	CATAN_HEX_COORDS,
	hexKey,
	intersectionKey,
	edgeKey,
	hexCornerSharedHexes,
	HEX_DIRECTIONS
} from './hex-math.ts';

// ============================================================
// ID generation
// ============================================================

let _idCounter = 0;

export function makeId(prefix: string): string {
	return `${prefix}_${++_idCounter}`;
}

export function resetIdCounter(): void {
	_idCounter = 0;
}

// ============================================================
// Shuffle utility
// ============================================================

export function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
	const result = [...arr];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

// ============================================================
// Standard Catan terrain distribution
// ============================================================

const TERRAIN_DISTRIBUTION: Terrain[] = [
	'FOREST', 'FOREST', 'FOREST', 'FOREST',
	'PASTURE', 'PASTURE', 'PASTURE', 'PASTURE',
	'FIELDS', 'FIELDS', 'FIELDS', 'FIELDS',
	'HILLS', 'HILLS', 'HILLS',
	'MOUNTAINS', 'MOUNTAINS', 'MOUNTAINS',
	'DESERT'
];

/** Standard Catan number token distribution (excludes desert) */
const NUMBER_TOKEN_DISTRIBUTION: number[] = [
	2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12
];

/** Standard harbor placement: 9 harbors around the coast */
const HARBOR_TYPES: HarborType[] = [
	'GENERIC_3_1',
	'GENERIC_3_1',
	'GENERIC_3_1',
	'GENERIC_3_1',
	'BRICK_2_1',
	'LUMBER_2_1',
	'ORE_2_1',
	'GRAIN_2_1',
	'WOOL_2_1'
];

// ============================================================
// Board generation
// ============================================================

/**
 * Generate the full Catan board: hexes, intersections, edges, harbors.
 * All positions are derived deterministically from CATAN_HEX_COORDS.
 */
export function generateBoard(rng: () => number = Math.random): Board {
	// 1. Shuffle terrains and tokens
	const terrains = shuffle([...TERRAIN_DISTRIBUTION], rng);
	const tokens = shuffle([...NUMBER_TOKEN_DISTRIBUTION], rng);

	// 2. Create hex tiles
	const hexes = new Map<string, HexTile>();
	const boardHexSet = new Set<string>(CATAN_HEX_COORDS.map(hexKey));
	let tokenIndex = 0;

	for (let i = 0; i < CATAN_HEX_COORDS.length; i++) {
		const coord = CATAN_HEX_COORDS[i];
		const terrain = terrains[i];
		const resource = TERRAIN_RESOURCE[terrain] ?? null;
		const numberToken = terrain === 'DESERT' ? null : tokens[tokenIndex++];
		const id = `hex_${i}`;

		hexes.set(id, {
			id,
			terrain,
			resource,
			numberToken,
			hasRobber: terrain === 'DESERT'
		});
	}

	// Build a coord→hexId lookup
	const coordToHexId = new Map<string, string>();
	let i = 0;
	for (const coord of CATAN_HEX_COORDS) {
		coordToHexId.set(hexKey(coord), `hex_${i++}`);
	}

	// 3. Derive intersections and edges from hex topology
	// For each hex, compute the 6 corner groups (sets of 2-3 shared hexes)
	// and deduplicate by canonical key

	const intersectionMap = new Map<string, Intersection>();
	const edgeMap = new Map<string, Edge>();

	// Track which intersection keys each hex is adjacent to
	const hexIntersectionKeys = new Map<string, Set<string>>();

	for (let hi = 0; hi < CATAN_HEX_COORDS.length; hi++) {
		const coord = CATAN_HEX_COORDS[hi];
		const hexId = `hex_${hi}`;
		const cornerGroups = hexCornerSharedHexes(coord, boardHexSet);

		const cornerIntKeys: string[] = [];

		for (const sharedHexCoords of cornerGroups) {
			// Map hex coords to hex IDs
			const sharedHexIds = sharedHexCoords
				.map((c) => coordToHexId.get(hexKey(c)))
				.filter((id): id is string => id !== undefined);

			const intKey = intersectionKey(sharedHexCoords);
			cornerIntKeys.push(intKey);

			if (!intersectionMap.has(intKey)) {
				intersectionMap.set(intKey, {
					id: intKey,
					adjacentHexIds: sharedHexIds,
					adjacentEdgeIds: [],
					building: null,
					harborId: null
				});
			}

			// Track adjacency for this hex
			if (!hexIntersectionKeys.has(hexId)) hexIntersectionKeys.set(hexId, new Set());
			hexIntersectionKeys.get(hexId)!.add(intKey);
		}

		// Create edges between consecutive corner intersections of this hex
		for (let ci = 0; ci < 6; ci++) {
			const intKeyA = cornerIntKeys[ci];
			const intKeyB = cornerIntKeys[(ci + 1) % 6];
			const eKey = edgeKey(intKeyA, intKeyB);

			if (!edgeMap.has(eKey)) {
				edgeMap.set(eKey, {
					id: eKey,
					adjacentIntersectionIds: [intKeyA, intKeyB],
					road: null
				});
			}

			// Register edge on intersections
			const intA = intersectionMap.get(intKeyA);
			const intB = intersectionMap.get(intKeyB);
			if (intA && !intA.adjacentEdgeIds.includes(eKey)) intA.adjacentEdgeIds.push(eKey);
			if (intB && !intB.adjacentEdgeIds.includes(eKey)) intB.adjacentEdgeIds.push(eKey);
		}
	}

	// 4. Place harbors on coastal intersections
	// Identify coastal intersections: those adjacent to fewer than 3 hexes
	const coastalIntersections = Array.from(intersectionMap.values()).filter(
		(int) => int.adjacentHexIds.length < 3
	);

	const harbors = new Map<string, Harbor>();
	const shuffledHarborTypes = shuffle([...HARBOR_TYPES], rng);
	const shuffledCoastal = shuffle(coastalIntersections, rng);

	// Pair up coastal intersections into harbor groups of 2
	const harborCount = Math.min(shuffledHarborTypes.length, Math.floor(shuffledCoastal.length / 2));
	for (let hi = 0; hi < harborCount; hi++) {
		const intA = shuffledCoastal[hi * 2];
		const intB = shuffledCoastal[hi * 2 + 1];
		const harborId = `harbor_${hi}`;
		const harborType = shuffledHarborTypes[hi];

		harbors.set(harborId, {
			id: harborId,
			type: harborType,
			intersectionIds: [intA.id, intB.id]
		});

		// Register harbor on intersections
		intA.harborId = harborId;
		intB.harborId = harborId;
	}

	return { hexes, intersections: intersectionMap, edges: edgeMap, harbors };
}

// ============================================================
// Supply initialization
// ============================================================

export function initializeSupply(
	playerCount: 2 | 3 | 4,
	kingdomCards: ActionCardName[]
): Supply {
	const vpCount = SUPPLY_COUNTS.victoryPiles[playerCount];
	const curseCount = SUPPLY_COUNTS.cursePile[playerCount];

	const kingdomPiles = new Map<ActionCardName, number>();
	for (const name of kingdomCards) {
		kingdomPiles.set(name, SUPPLY_COUNTS.kingdomPiles);
	}

	return {
		treasureBank: { ...TREASURE_BANK_COUNTS },
		victoryPiles: { estate: vpCount, duchy: vpCount, province: vpCount },
		cursePile: curseCount,
		kingdomPiles,
		resourcePiles: {
			brick: SUPPLY_COUNTS.resourcePiles,
			lumber: SUPPLY_COUNTS.resourcePiles,
			ore: SUPPLY_COUNTS.resourcePiles,
			grain: SUPPLY_COUNTS.resourcePiles,
			wool: SUPPLY_COUNTS.resourcePiles
		}
	};
}

// ============================================================
// Card factories
// ============================================================

export function makeResourceCard(resource: Resource, ownerId: string | null, zone: AnyCard['zone'] = 'SUPPLY'): ResourceCard {
	return {
		id: makeId('rc'),
		type: 'RESOURCE',
		name: resource.charAt(0) + resource.slice(1).toLowerCase(),
		coinCost: 0,
		zone,
		ownerId,
		resource
	};
}

export function makeTreasureCard(
	treasureType: 'COPPER' | 'SILVER' | 'GOLD',
	ownerId: string | null,
	zone: AnyCard['zone'] = 'BANK'
): TreasureCard {
	return {
		id: makeId('tc'),
		type: 'TREASURE',
		name: treasureType.charAt(0) + treasureType.slice(1).toLowerCase(),
		coinCost: 0,
		zone,
		ownerId,
		treasureType,
		coinValue: TREASURE_COIN_VALUES[treasureType]
	};
}

export function makeVictoryCard(
	victoryType: 'ESTATE' | 'DUCHY' | 'PROVINCE',
	ownerId: string | null,
	zone: AnyCard['zone'] = 'SUPPLY'
): VictoryCard {
	return {
		id: makeId('vc'),
		type: 'VICTORY',
		name: victoryType.charAt(0) + victoryType.slice(1).toLowerCase(),
		coinCost: VICTORY_COIN_COSTS[victoryType],
		zone,
		ownerId,
		victoryType,
		vpValue: VICTORY_VP_VALUES[victoryType]
	};
}

export function makeActionCard(
	actionName: ActionCardName,
	ownerId: string | null,
	zone: AnyCard['zone'] = 'SUPPLY'
): ActionCard {
	const costs: Record<ActionCardName, number> = {
		Chapel: 2, Moat: 2, Village: 3, Militia: 4,
		Remodel: 4, Smithy: 4, Festival: 5, Market: 5, Mine: 5, Witch: 5
	};
	return {
		id: makeId('ac'),
		type: 'ACTION',
		name: actionName,
		coinCost: costs[actionName],
		zone,
		ownerId,
		actionName
	};
}

export function makeCurseCard(ownerId: string | null, zone: AnyCard['zone'] = 'SUPPLY'): AnyCard {
	return {
		id: makeId('curse'),
		type: 'CURSE',
		name: 'Curse',
		coinCost: 0,
		zone,
		ownerId
	};
}

// ============================================================
// Player initialization
// ============================================================

export function createPlayer(
	id: string,
	name: string,
	colorIndex: number,
	rng: () => number = Math.random
): Player {
	// Starting deck: 1 Province + 9 Coppers
	const province = makeVictoryCard('PROVINCE', id, 'DECK');
	const coppers = Array.from({ length: 9 }, () => makeTreasureCard('COPPER', id, 'DECK'));
	const deckCards: AnyCard[] = shuffle([province, ...coppers], rng);

	// Draw 7 into hand
	const hand = deckCards.slice(0, 7);
	const deck = deckCards.slice(7);

	hand.forEach((c) => (c.zone = 'HAND'));

	return {
		id,
		name,
		colorIndex,
		deck,
		hand,
		discardPile: [],
		playArea: [],
		militiaPlays: 0,
		actionsRemaining: 1,
		buysRemaining: 1,
		tempCoins: 0,
		startingProvinceActive: true,
		piecesRemaining: { ...PIECE_LIMITS }
	};
}

// ============================================================
// Full game state initialization
// ============================================================

export const STARTER_KINGDOM_CARDS: ActionCardName[] = [
	'Chapel', 'Moat', 'Village', 'Militia',
	'Remodel', 'Smithy', 'Festival', 'Market', 'Mine', 'Witch'
];

export interface GameConfig {
	players: Array<{ id: string; name: string; colorIndex: number }>;
	kingdomCards?: ActionCardName[];
	rng?: () => number;
}

export function createInitialGameState(config: GameConfig): GameState {
	const { players: playerConfigs, kingdomCards = STARTER_KINGDOM_CARDS, rng = Math.random } = config;
	const playerCount = playerConfigs.length as 2 | 3 | 4;

	if (playerCount < 2 || playerCount > 4) throw new Error('Player count must be 2–4');

	const board = generateBoard(rng);
	const supply = initializeSupply(playerCount, kingdomCards);
	const players = playerConfigs.map((p) => createPlayer(p.id, p.name, p.colorIndex, rng));
	const turnCount = new Map<string, number>();
	players.forEach((p) => turnCount.set(p.id, 0));

	return {
		players,
		activePlayerIndex: 0,
		currentPhase: 'INITIAL_PLACEMENT',
		diceResult: null,
		board,
		supply,
		trash: [],
		longestRoadHolder: null,
		largestArmyHolder: null,
		gameOver: false,
		winner: null,
		turnCount,
		initialPlacement: { round: 1, placedSettlement: false }
	};
}
