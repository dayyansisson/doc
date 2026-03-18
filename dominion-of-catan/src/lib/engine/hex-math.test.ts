import { describe, it, expect } from 'vitest';
import {
	hexDistance,
	hexNeighbors,
	hexToPixel,
	hexCorners,
	hexKey,
	intersectionKey,
	edgeKey,
	longestRoad,
	CATAN_HEX_COORDS,
	HEX_DIRECTIONS
} from './hex-math.ts';

describe('hexDistance', () => {
	it('returns 0 for the same hex', () => {
		expect(hexDistance({ q: 0, r: 0 }, { q: 0, r: 0 })).toBe(0);
	});

	it('returns 1 for adjacent hexes', () => {
		expect(hexDistance({ q: 0, r: 0 }, { q: 1, r: 0 })).toBe(1);
		expect(hexDistance({ q: 0, r: 0 }, { q: 0, r: 1 })).toBe(1);
		expect(hexDistance({ q: 0, r: 0 }, { q: -1, r: 1 })).toBe(1);
	});

	it('returns 2 for hexes two steps apart', () => {
		expect(hexDistance({ q: 0, r: 0 }, { q: 2, r: 0 })).toBe(2);
		expect(hexDistance({ q: 0, r: 0 }, { q: 1, r: 1 })).toBe(2);
	});
});

describe('hexNeighbors', () => {
	it('returns 6 neighbors', () => {
		expect(hexNeighbors({ q: 0, r: 0 })).toHaveLength(6);
	});

	it('all neighbors are distance 1 away', () => {
		const center = { q: 2, r: -1 };
		for (const n of hexNeighbors(center)) {
			expect(hexDistance(center, n)).toBe(1);
		}
	});
});

describe('hexToPixel', () => {
	it('returns origin for hex (0,0)', () => {
		const p = hexToPixel({ q: 0, r: 0 }, 100);
		expect(p.x).toBeCloseTo(0);
		expect(p.y).toBeCloseTo(0);
	});

	it('x scales with q for flat-top', () => {
		const p1 = hexToPixel({ q: 1, r: 0 }, 100);
		const p0 = hexToPixel({ q: 0, r: 0 }, 100);
		expect(p1.x - p0.x).toBeCloseTo(150); // size * 3/2
	});
});

describe('hexCorners', () => {
	it('returns 6 corners', () => {
		expect(hexCorners({ x: 0, y: 0 }, 100)).toHaveLength(6);
	});

	it('corners are at approximately the correct distance from center', () => {
		const corners = hexCorners({ x: 0, y: 0 }, 100);
		for (const c of corners) {
			const dist = Math.sqrt(c.x * c.x + c.y * c.y);
			expect(dist).toBeCloseTo(100);
		}
	});
});

describe('hexKey', () => {
	it('produces consistent keys', () => {
		expect(hexKey({ q: 1, r: -2 })).toBe('1,-2');
	});
});

describe('intersectionKey', () => {
	it('produces the same key regardless of order', () => {
		const a = { q: 0, r: 0 };
		const b = { q: 1, r: 0 };
		const c = { q: 0, r: 1 };
		const k1 = intersectionKey([a, b, c]);
		const k2 = intersectionKey([c, a, b]);
		const k3 = intersectionKey([b, c, a]);
		expect(k1).toBe(k2);
		expect(k2).toBe(k3);
	});
});

describe('edgeKey', () => {
	it('produces the same key regardless of order', () => {
		const k1 = edgeKey('int_A', 'int_B');
		const k2 = edgeKey('int_B', 'int_A');
		expect(k1).toBe(k2);
	});
});

describe('CATAN_HEX_COORDS', () => {
	it('has exactly 19 hexes', () => {
		expect(CATAN_HEX_COORDS).toHaveLength(19);
	});

	it('all hexes are unique', () => {
		const keys = new Set(CATAN_HEX_COORDS.map(hexKey));
		expect(keys.size).toBe(19);
	});

	it('has the correct 3-4-5-4-3 row distribution', () => {
		const rowCounts = new Map<number, number>();
		for (const coord of CATAN_HEX_COORDS) {
			rowCounts.set(coord.r, (rowCounts.get(coord.r) ?? 0) + 1);
		}
		const counts = Array.from(rowCounts.values()).sort((a, b) => a - b);
		expect(counts).toEqual([3, 3, 4, 4, 5]);
	});
});

describe('longestRoad', () => {
	it('returns 0 when player has no roads', () => {
		const length = longestRoad(
			new Set(),
			new Map(),
			new Map(),
			'p1'
		);
		expect(length).toBe(0);
	});

	it('counts a single road as length 1', () => {
		const roads = new Set(['edge_a']);
		const endpoints = new Map([['edge_a', ['int_1', 'int_2'] as [string, string]]]);
		const owners = new Map([['int_1', null], ['int_2', null]]);

		expect(longestRoad(roads, endpoints, owners, 'p1')).toBe(1);
	});

	it('counts a chain of connected roads', () => {
		// 1 -- 2 -- 3 -- 4 (3 edges)
		const roads = new Set(['e1', 'e2', 'e3']);
		const endpoints = new Map([
			['e1', ['i1', 'i2'] as [string, string]],
			['e2', ['i2', 'i3'] as [string, string]],
			['e3', ['i3', 'i4'] as [string, string]]
		]);
		const owners = new Map<string, string | null>([
			['i1', null], ['i2', null], ['i3', null], ['i4', null]
		]);

		expect(longestRoad(roads, endpoints, owners, 'p1')).toBe(3);
	});

	it('is blocked by opponent buildings', () => {
		// 1 -- 2 -- 3 -- 4, but i3 is owned by opponent
		const roads = new Set(['e1', 'e2', 'e3']);
		const endpoints = new Map([
			['e1', ['i1', 'i2'] as [string, string]],
			['e2', ['i2', 'i3'] as [string, string]],
			['e3', ['i3', 'i4'] as [string, string]]
		]);
		const owners = new Map<string, string | null>([
			['i1', null], ['i2', null], ['i3', 'p2'], ['i4', null]
		]);

		// Longest unbroken chain: e1-e2 (length 2) or e3 (length 1)
		expect(longestRoad(roads, endpoints, owners, 'p1')).toBe(2);
	});

	it('handles branching roads and returns the longest branch', () => {
		// Fork: i1 -- i2 -- i3, and i2 -- i4 -- i5
		const roads = new Set(['e1', 'e2', 'e3', 'e4']);
		const endpoints = new Map([
			['e1', ['i1', 'i2'] as [string, string]],
			['e2', ['i2', 'i3'] as [string, string]],
			['e3', ['i2', 'i4'] as [string, string]],
			['e4', ['i4', 'i5'] as [string, string]]
		]);
		const owners = new Map<string, string | null>([
			['i1', null], ['i2', null], ['i3', null], ['i4', null], ['i5', null]
		]);

		// Longest: i1-i2-i4-i5 = 3, or i3-i2-i4-i5 = 3
		expect(longestRoad(roads, endpoints, owners, 'p1')).toBe(3);
	});
});
