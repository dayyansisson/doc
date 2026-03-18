import { describe, it, expect, vi } from 'vitest';
import { mount } from 'svelte';
import TabBar from './TabBar.svelte';

describe('TabBar', () => {
	it('renders all 4 tabs', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);

		mount(TabBar, {
			target: host,
			props: { active: 'board', onTabChange: vi.fn() }
		});

		const buttons = host.querySelectorAll('.tab-btn');
		expect(buttons.length).toBe(4);
		host.remove();
	});

	it('marks the active tab with aria-current', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);

		mount(TabBar, {
			target: host,
			props: { active: 'hand', onTabChange: vi.fn() }
		});

		const activeBtn = host.querySelector('[aria-current="page"]');
		expect(activeBtn?.textContent).toContain('Hand');
		host.remove();
	});

	it('calls onTabChange when a tab is clicked', () => {
		const host = document.createElement('div');
		document.body.appendChild(host);
		const onChange = vi.fn();

		mount(TabBar, {
			target: host,
			props: { active: 'board', onTabChange: onChange }
		});

		const supplyBtn = [...host.querySelectorAll('.tab-btn')].find((b) =>
			b.textContent?.includes('Supply')
		) as HTMLButtonElement;
		supplyBtn.click();
		expect(onChange).toHaveBeenCalledWith('supply');
		host.remove();
	});
});
