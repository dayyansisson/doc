import { describe, it, expect, vi } from 'vitest';
import { mount } from 'svelte';
import Card from './Card.svelte';
import type { TreasureCard, ResourceCard } from '$lib/engine/state';

const copperCard: TreasureCard = {
	id: 'tc1',
	type: 'TREASURE',
	name: 'Copper',
	coinCost: 0,
	zone: 'HAND',
	ownerId: 'p1',
	treasureType: 'COPPER',
	coinValue: 1
};

const brickCard: ResourceCard = {
	id: 'rc1',
	type: 'RESOURCE',
	name: 'Brick',
	coinCost: 0,
	zone: 'HAND',
	ownerId: 'p1',
	resource: 'BRICK'
};

describe('Card', () => {
	it('renders the card name', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);

		mount(Card, { target: host, props: { card: copperCard } });

		expect(host.textContent).toContain('Copper');
		host.remove();
	});

	it('renders a facedown card without revealing name', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);

		mount(Card, { target: host, props: { card: copperCard, facedown: true } });

		const btn = host.querySelector('button');
		expect(btn?.getAttribute('aria-label')).toBe('Face-down card');
		host.remove();
	});

	it('shows coin value for treasure cards', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);

		mount(Card, { target: host, props: { card: copperCard } });

		expect(host.textContent).toContain('1¢');
		host.remove();
	});

	it('calls onclick when clicked', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);
		const handler = vi.fn();

		mount(Card, { target: host, props: { card: brickCard, onclick: handler } });

		const btn = host.querySelector('button') as HTMLButtonElement;
		btn.click();
		expect(handler).toHaveBeenCalledOnce();
		host.remove();
	});

	it('applies selected class when selected', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);

		mount(Card, { target: host, props: { card: copperCard, selected: true } });

		const btn = host.querySelector('button');
		expect(btn?.classList.contains('selected')).toBe(true);
		host.remove();
	});
});
