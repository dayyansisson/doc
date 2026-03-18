<script lang="ts">
	import type { AnyCard } from '$lib/engine/state';

	// Card face colors by type
	const TYPE_COLOR: Record<string, string> = {
		RESOURCE: '#4a7c59',
		TREASURE: '#c9a020',
		VICTORY: '#7c4dbe',
		ACTION: '#2879d0',
		CURSE: '#8a2020'
	};

	const TYPE_LABEL: Record<string, string> = {
		RESOURCE: 'Resource',
		TREASURE: 'Treasure',
		VICTORY: 'Victory',
		ACTION: 'Action',
		CURSE: 'Curse'
	};

	const RESOURCE_EMOJI: Record<string, string> = {
		BRICK: '🧱',
		LUMBER: '🪵',
		ORE: '⛏',
		GRAIN: '🌾',
		WOOL: '🐑'
	};

	const TREASURE_SYMBOL: Record<string, string> = {
		COPPER: '¢',
		SILVER: '$',
		GOLD: '★'
	};

	let {
		card,
		selected = false,
		facedown = false,
		compact = false,
		onclick
	}: {
		card: AnyCard;
		selected?: boolean;
		facedown?: boolean;
		compact?: boolean;
		onclick?: () => void;
	} = $props();

	const accentColor = $derived(TYPE_COLOR[card.type] ?? '#888');

	function getSymbol(c: AnyCard): string {
		if (c.type === 'RESOURCE') return RESOURCE_EMOJI[c.resource] ?? '?';
		if (c.type === 'TREASURE') return TREASURE_SYMBOL[c.treasureType] ?? '?';
		if (c.type === 'VICTORY') return `${c.vpValue}VP`;
		if (c.type === 'ACTION') return '⚡';
		if (c.type === 'CURSE') return '💀';
		return '?';
	}
</script>

<button
	class="card"
	class:selected
	class:facedown
	class:compact
	style="--card-accent: {accentColor}"
	disabled={!onclick}
	onclick={onclick}
	aria-label={facedown ? 'Face-down card' : card.name}
	aria-pressed={selected}
>
	{#if facedown}
		<div class="card-back">
			<span class="card-back-pattern">⬡</span>
		</div>
	{:else}
		<div class="card-type-strip">{TYPE_LABEL[card.type]}</div>
		<div class="card-symbol">{getSymbol(card)}</div>
		<div class="card-name">{card.name}</div>
		{#if card.type === 'TREASURE'}
			<div class="card-value">{card.coinValue}¢</div>
		{:else if card.type === 'ACTION'}
			<div class="card-cost">{card.coinCost}¢</div>
		{:else if card.type === 'VICTORY'}
			<div class="card-vp">{card.vpValue} VP</div>
		{/if}
	{/if}
</button>

<style>
	.card {
		--card-w: 70px;
		--card-h: 100px;

		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		width: var(--card-w);
		height: var(--card-h);
		background: var(--surface-elevated);
		border: 2px solid var(--border-default);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-card);
		cursor: default;
		padding: 6px 4px;
		position: relative;
		transition:
			transform var(--duration-micro) var(--ease-overshoot),
			box-shadow var(--duration-micro) var(--ease-standard);
		overflow: hidden;
		text-align: center;
		font-family: var(--font-ui);
		color: var(--text-primary);
	}

	.card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: var(--card-accent);
		border-radius: var(--radius-md) var(--radius-md) 0 0;
	}

	.card:not(:disabled) {
		cursor: pointer;
	}

	.card:not(:disabled):hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-elevated);
	}

	.card.selected {
		border-color: var(--card-accent);
		box-shadow: 0 0 0 2px var(--card-accent), var(--shadow-elevated);
		transform: translateY(-6px);
	}

	.card.compact {
		--card-w: 52px;
		--card-h: 72px;
		gap: 2px;
		padding: 4px 2px;
	}

	.card-type-strip {
		font: var(--type-caption);
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		margin-top: 6px;
	}

	.card-symbol {
		font-size: 22px;
		line-height: 1;
	}

	.card.compact .card-symbol {
		font-size: 16px;
	}

	.card-name {
		font: var(--type-label);
		color: var(--text-primary);
	}

	.card.compact .card-name {
		font-size: 10px;
	}

	.card-value,
	.card-cost,
	.card-vp {
		font: var(--type-number-sm);
		color: var(--card-accent);
	}

	.card-back {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #2a4a7f, #1a3060);
		border-radius: calc(var(--radius-md) - 2px);
	}

	.card-back-pattern {
		font-size: 28px;
		color: rgba(255, 255, 255, 0.3);
	}

	.facedown {
		background: #1a3060;
		border-color: #2a4a7f;
	}
</style>
