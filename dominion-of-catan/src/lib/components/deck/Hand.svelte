<script lang="ts">
	import type { AnyCard } from '$lib/engine/state';
	import Card from './Card.svelte';

	let {
		cards,
		selectedIds = [],
		onCardClick,
		label = 'Your hand'
	}: {
		cards: AnyCard[];
		selectedIds?: string[];
		onCardClick?: (cardId: string) => void;
		label?: string;
	} = $props();

	// Group for display: resources first, then treasures, then actions, then victory/curse
	const TYPE_ORDER: Record<string, number> = { RESOURCE: 0, TREASURE: 1, ACTION: 2, VICTORY: 3, CURSE: 4 };
	const sorted = $derived(
		[...cards].sort((a, b) => {
			const order = (TYPE_ORDER[a.type] ?? 9) - (TYPE_ORDER[b.type] ?? 9);
			if (order !== 0) return order;
			return a.name.localeCompare(b.name);
		})
	);
</script>

<section class="hand" aria-label={label}>
	<header class="hand-header">
		<span class="hand-label">{label}</span>
		<span class="hand-count">{cards.length} card{cards.length !== 1 ? 's' : ''}</span>
	</header>
	<div class="hand-cards" role="list">
		{#each sorted as card (card.id)}
			<div role="listitem">
				<Card
					{card}
					selected={selectedIds.includes(card.id)}
					onclick={onCardClick ? () => onCardClick!(card.id) : undefined}
				/>
			</div>
		{/each}
		{#if cards.length === 0}
			<p class="hand-empty">No cards in hand</p>
		{/if}
	</div>
</section>

<style>
	.hand {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.hand-header {
		display: flex;
		align-items: baseline;
		gap: var(--space-sm);
	}

	.hand-label {
		font: var(--type-label);
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.hand-count {
		font: var(--type-caption);
		color: var(--text-tertiary);
	}

	.hand-cards {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		align-items: flex-end;
	}

	.hand-empty {
		font: var(--type-body);
		color: var(--text-tertiary);
		font-style: italic;
		margin: 0;
	}
</style>
