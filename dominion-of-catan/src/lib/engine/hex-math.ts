/**
 * Hex grid geometry utilities.
 * Uses flat-top hexagons with axial coordinates.
 * Reference: https://www.redblobgames.com/grids/hexagons/
 */

// ============================================================
// Axial coordinates
// ============================================================

export interface AxialCoord {
	q: number;
	r: number;
}

export interface CubeCoord {
	q: number;
	r: number;
	s: number;
}

export interface Point {
	x: number;
	y: number;
}

/** Convert axial to cube coordinates */
export function axialToCube(a: AxialCoord): CubeCoord {
	return { q: a.q, r: a.r, s: -a.q - a.r };
}

/** Convert cube to axial coordinates */
export function cubeToAxial(c: CubeCoord): AxialCoord {
	return { q: c.q, r: c.r };
}

/** Cube coordinate distance between two hexes */
export function cubeDistance(a: CubeCoord, b: CubeCoord): number {
	return Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs(a.s - b.s));
}

/** Axial distance between two hexes */
export function hexDistance(a: AxialCoord, b: AxialCoord): number {
	return cubeDistance(axialToCube(a), axialToCube(b));
}

/** The 6 axial direction vectors (flat-top) */
export const HEX_DIRECTIONS: AxialCoord[] = [
	{ q: 1, r: 0 },
	{ q: 1, r: -1 },
	{ q: 0, r: -1 },
	{ q: -1, r: 0 },
	{ q: -1, r: 1 },
	{ q: 0, r: 1 }
];

/** Neighbors of a hex in axial coordinates */
export function hexNeighbors(hex: AxialCoord): AxialCoord[] {
	return HEX_DIRECTIONS.map((d) => ({ q: hex.q + d.q, r: hex.r + d.r }));
}

// ============================================================
// Standard Catan board layout
// ============================================================

/**
 * Standard Catan 3-4-5-4-3 hex layout in axial coordinates.
 * Flat-top orientation, offset so the board is centered at (0,0).
 */
export const CATAN_HEX_COORDS: AxialCoord[] = [
	// Row 0 (3 hexes): r = -2
	{ q: 0, r: -2 },
	{ q: 1, r: -2 },
	{ q: 2, r: -2 },
	// Row 1 (4 hexes): r = -1
	{ q: -1, r: -1 },
	{ q: 0, r: -1 },
	{ q: 1, r: -1 },
	{ q: 2, r: -1 },
	// Row 2 (5 hexes): r = 0
	{ q: -2, r: 0 },
	{ q: -1, r: 0 },
	{ q: 0, r: 0 },
	{ q: 1, r: 0 },
	{ q: 2, r: 0 },
	// Row 3 (4 hexes): r = 1
	{ q: -2, r: 1 },
	{ q: -1, r: 1 },
	{ q: 0, r: 1 },
	{ q: 1, r: 1 },
	// Row 4 (3 hexes): r = 2
	{ q: -2, r: 2 },
	{ q: -1, r: 2 },
	{ q: 0, r: 2 }
];

// ============================================================
// Pixel geometry (flat-top hexagons)
// ============================================================

/**
 * Convert axial coordinates to pixel center (flat-top).
 * @param hex Axial coordinate
 * @param size Distance from center to corner (hex "radius")
 */
export function hexToPixel(hex: AxialCoord, size: number): Point {
	const x = size * (3 / 2) * hex.q;
	const y = size * (Math.sqrt(3) / 2 * hex.q + Math.sqrt(3) * hex.r);
	return { x, y };
}

/**
 * The 6 corner offsets for a flat-top hex, relative to the hex center.
 * Corner 0 is at angle 0° (rightmost), going counter-clockwise.
 */
export function hexCornerOffset(index: number, size: number): Point {
	const angleDeg = 60 * index;
	const angleRad = (Math.PI / 180) * angleDeg;
	return {
		x: size * Math.cos(angleRad),
		y: size * Math.sin(angleRad)
	};
}

/**
 * The 6 corner points (absolute pixel positions) of a flat-top hex.
 */
export function hexCorners(center: Point, size: number): Point[] {
	return Array.from({ length: 6 }, (_, i) => {
		const offset = hexCornerOffset(i, size);
		return { x: center.x + offset.x, y: center.y + offset.y };
	});
}

// ============================================================
// Intersection and edge ID generation
// ============================================================

/**
 * Stable string key for an axial coordinate.
 */
export function hexKey(coord: AxialCoord): string {
	return `${coord.q},${coord.r}`;
}

/**
 * Stable string key for an intersection given its 2–3 adjacent hex coords.
 * Sorted to ensure uniqueness regardless of traversal order.
 */
export function intersectionKey(hexCoords: AxialCoord[]): string {
	return hexCoords
		.map(hexKey)
		.sort()
		.join('|');
}

/**
 * Stable string key for an edge given its two endpoint intersection keys.
 */
export function edgeKey(intersectionKeyA: string, intersectionKeyB: string): string {
	return [intersectionKeyA, intersectionKeyB].sort().join('~');
}

// ============================================================
// Board topology derivation
// ============================================================

/**
 * For each hex, the 6 vertex positions are defined by the set of 2–3 hexes
 * that share that vertex. This function computes the three hexes (as axial
 * coords) that share each corner of the given hex.
 *
 * For flat-top hexes, corner i is shared by:
 *   - The hex itself
 *   - The neighbor in direction i
 *   - The neighbor in direction (i+5) % 6
 *
 * Returns an array of 6 entries (one per corner), each containing the 2–3
 * hex coords that share that corner (only including coords that exist on
 * the board).
 */
export function hexCornerSharedHexes(
	hex: AxialCoord,
	boardHexSet: Set<string>
): AxialCoord[][] {
	return Array.from({ length: 6 }, (_, i) => {
		const candidates: AxialCoord[] = [
			hex,
			{ q: hex.q + HEX_DIRECTIONS[i].q, r: hex.r + HEX_DIRECTIONS[i].r },
			{
				q: hex.q + HEX_DIRECTIONS[(i + 5) % 6].q,
				r: hex.r + HEX_DIRECTIONS[(i + 5) % 6].r
			}
		];
		return candidates.filter((c) => boardHexSet.has(hexKey(c)));
	});
}

// ============================================================
// Longest road calculation (DFS)
// ============================================================

/**
 * Compute the longest continuous road for a given player.
 * A road chain is broken if an opponent's building sits on an intermediate
 * intersection.
 *
 * @param playerRoadEdgeIds Set of edge IDs owned by the player
 * @param edgeEndpoints Map from edge ID to its two intersection IDs
 * @param intersectionOwner Map from intersection ID to owner player ID (or null)
 * @param playerId The player whose longest road we're computing
 */
export function longestRoad(
	playerRoadEdgeIds: Set<string>,
	edgeEndpoints: Map<string, [string, string]>,
	intersectionOwner: Map<string, string | null>,
	playerId: string
): number {
	if (playerRoadEdgeIds.size === 0) return 0;

	// Build adjacency: for each intersection, which edges connect to it
	const intersectionEdges = new Map<string, Set<string>>();
	for (const edgeId of playerRoadEdgeIds) {
		const endpoints = edgeEndpoints.get(edgeId);
		if (!endpoints) continue;
		for (const intId of endpoints) {
			if (!intersectionEdges.has(intId)) intersectionEdges.set(intId, new Set());
			intersectionEdges.get(intId)!.add(edgeId);
		}
	}

	let maxLength = 0;

	// DFS from each road endpoint
	function dfs(currentEdgeId: string, visitedEdges: Set<string>, currentIntId: string): number {
		let best = visitedEdges.size;
		const adjacentEdges = intersectionEdges.get(currentIntId) ?? new Set<string>();

		for (const nextEdgeId of adjacentEdges) {
			if (visitedEdges.has(nextEdgeId)) continue;

			const endpoints = edgeEndpoints.get(nextEdgeId);
			if (!endpoints) continue;
			const nextIntId = endpoints[0] === currentIntId ? endpoints[1] : endpoints[0];

			// Check if an opponent's building blocks passage through nextIntId
			const owner = intersectionOwner.get(nextIntId);
			if (owner !== null && owner !== undefined && owner !== playerId) continue;

			visitedEdges.add(nextEdgeId);
			const length = dfs(nextEdgeId, visitedEdges, nextIntId);
			if (length > best) best = length;
			visitedEdges.delete(nextEdgeId);
		}

		return best;
	}

	for (const edgeId of playerRoadEdgeIds) {
		const endpoints = edgeEndpoints.get(edgeId);
		if (!endpoints) continue;

		for (const startIntId of endpoints) {
			// Don't start traversal from an opponent's intersection — the road chain
			// is broken there, so the far side is a separate segment.
			const startOwner = intersectionOwner.get(startIntId);
			if (startOwner !== null && startOwner !== undefined && startOwner !== playerId) continue;

			const visited = new Set<string>([edgeId]);
			const length = dfs(edgeId, visited, startIntId);
			if (length > maxLength) maxLength = length;
		}
	}

	return maxLength;
}
