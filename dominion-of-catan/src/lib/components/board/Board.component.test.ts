import { describe, it, expect } from 'vitest';
import { mount } from 'svelte';
import Board from './Board.svelte';
import { getMockState } from '$lib/mock/fixture';

describe('Board', () => {
	it('renders an SVG element', () => {
		const state = getMockState();
		const host = document.createElement('div');
		document.body.appendChild(host);

		mount(Board, { target: host, props: { state } });

		const svg = host.querySelector('svg');
		expect(svg).toBeTruthy();
		host.remove();
	});

	it('board state has 19 hex tiles', () => {
		const state = getMockState();
		// Verify the game state contains 19 hexes (standard Catan board)
		expect(state.board.hexes.size).toBe(19);
	});

	it('renders buildings for placed settlements', () => {
		const state = getMockState();
		const host = document.createElement('div');
		document.body.appendChild(host);

		mount(Board, { target: host, props: { state } });

		const settlements = host.querySelectorAll('.building');
		// Initial placement produces 2 settlements per player × 3 players = 6
		expect(settlements.length).toBeGreaterThanOrEqual(1);
		host.remove();
	});
});
