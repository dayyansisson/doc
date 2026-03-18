<script lang="ts">
	/**
	 * A single supply pile card showing name, cost, count remaining, and a symbol.
	 */

	const TYPE_COLOR: Record<string, string> = {
		treasure: '#c9a020',
		victory: '#7c4dbe',
		action: '#2879d0',
		resource: '#4a7c59',
		curse: '#8a2020'
	};

	const SYMBOL: Record<string, string> = {
		// treasures
		Copper: '¢',
		Silver: '$',
		Gold: '★',
		// victory
		Estate: '🏠',
		Duchy: '🏰',
		Province: '👑',
		// resources
		Brick: '🧱',
		Lumber: '🪵',
		Ore: '⛏',
		Grain: '🌾',
		Wool: '🐑',
		// special
		Curse: '💀'
	};

	let {
		name,
		count,
		cost,
		category,
		onclick
	}: {
		name: string;
		count: number;
		cost: number;
		category: 'treasure' | 'victory' | 'action' | 'resource' | 'curse';
		onclick?: () => void;
	} = $props();

	const color = $derived(TYPE_COLOR[category] ?? '#888');
	const symbol = $derived(SYMBOL[name] ?? name.slice(0, 2));
	const depleted = $derived(count === 0);
</script>

<button
	class="supply-card"
	class:depleted
	style="--supply-accent: {color}"
	disabled={!onclick || depleted}
	onclick={onclick}
	aria-label="{name} — {count} remaining, costs {cost}"
>
	<div class="supply-symbol">{symbol}</div>
	<div class="supply-name">{name}</div>
	<div class="supply-cost">{cost}¢</div>
	<div class="supply-count" class:zero={count === 0}>{count}</div>
</button>

<style>
	.supply-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		width: 62px;
		padding: 6px 4px 8px;
		background: var(--surface-elevated);
		border: 2px solid var(--border-default);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-card);
		cursor: default;
		position: relative;
		overflow: hidden;
		transition:
			transform var(--duration-micro) var(--ease-overshoot),
			box-shadow var(--duration-micro);
		font-family: var(--font-ui);
		color: var(--text-primary);
	}

	.supply-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: var(--supply-accent);
	}

	.supply-card:not(:disabled) {
		cursor: pointer;
	}

	.supply-card:not(:disabled):hover {
		transform: translateY(-3px);
		box-shadow: var(--shadow-elevated);
	}

	.supply-card.depleted {
		opacity: 0.45;
		filter: grayscale(0.6);
	}

	.supply-symbol {
		font-size: 20px;
		line-height: 1;
		margin-top: 4px;
	}

	.supply-name {
		font: var(--type-caption);
		font-size: 10px;
		color: var(--text-secondary);
		text-align: center;
		line-height: 1.2;
	}

	.supply-cost {
		font: var(--type-number-sm);
		color: var(--supply-accent);
	}

	.supply-count {
		position: absolute;
		bottom: 4px;
		right: 5px;
		font: var(--type-caption);
		font-weight: 700;
		color: var(--text-tertiary);
		font-size: 10px;
	}

	.supply-count.zero {
		color: #cc2222;
	}
</style>
