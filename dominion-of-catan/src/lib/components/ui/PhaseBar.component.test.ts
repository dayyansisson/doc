import { describe, it, expect, vi } from 'vitest';
import { mount } from 'svelte';
import PhaseBar from './PhaseBar.svelte';
import type { Player } from '$lib/engine/state';

const mockPlayer: Player = {
	id: 'p1',
	name: 'Alice',
	colorIndex: 0,
	deck: [],
	hand: [],
	discardPile: [],
	playArea: [],
	militiaPlays: 0,
	actionsRemaining: 1,
	buysRemaining: 1,
	tempCoins: 0,
	startingProvinceActive: true,
	piecesRemaining: { roads: 15, settlements: 5, cities: 4 }
};

describe('PhaseBar', () => {
	it('shows the active player name', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);

		mount(PhaseBar, {
			target: host,
			props: { phase: 'ROLL', activePlayer: mockPlayer, diceResult: null }
		});

		expect(host.textContent).toContain('Alice');
		host.remove();
	});

	it('shows the phase label', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);

		mount(PhaseBar, {
			target: host,
			props: { phase: 'TRADE_BUILD', activePlayer: mockPlayer, diceResult: null }
		});

		expect(host.textContent).toContain('Trade & Build');
		host.remove();
	});

	it('shows roll button during ROLL phase', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);
		const onRoll = vi.fn();

		mount(PhaseBar, {
			target: host,
			props: { phase: 'ROLL', activePlayer: mockPlayer, diceResult: null, onRoll }
		});

		const btn = host.querySelector('.roll-btn') as HTMLButtonElement;
		expect(btn).toBeTruthy();
		btn.click();
		expect(onRoll).toHaveBeenCalledOnce();
		host.remove();
	});

	it('shows dice result when provided', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);

		mount(PhaseBar, {
			target: host,
			props: { phase: 'ACTION', activePlayer: mockPlayer, diceResult: 7 }
		});

		expect(host.textContent).toContain('7');
		host.remove();
	});
});
