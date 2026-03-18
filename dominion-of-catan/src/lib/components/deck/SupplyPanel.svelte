<script lang="ts">
	import type { Supply } from '$lib/engine/state';
	import SupplyCard from './SupplyCard.svelte';

	let {
		supply,
		onBuyCard
	}: {
		supply: Supply;
		onBuyCard?: (name: string) => void;
	} = $props();
</script>

<section class="supply-panel" aria-label="Supply">
	<!-- Treasure bank -->
	<div class="supply-group">
		<h3 class="group-title">Treasures</h3>
		<div class="supply-row">
			<SupplyCard name="Copper" count={supply.treasureBank.copper} cost={0} category="treasure" onclick={onBuyCard ? () => onBuyCard!('Copper') : undefined} />
			<SupplyCard name="Silver" count={supply.treasureBank.silver} cost={3} category="treasure" onclick={onBuyCard ? () => onBuyCard!('Silver') : undefined} />
			<SupplyCard name="Gold" count={supply.treasureBank.gold} cost={6} category="treasure" onclick={onBuyCard ? () => onBuyCard!('Gold') : undefined} />
		</div>
	</div>

	<!-- Victory piles -->
	<div class="supply-group">
		<h3 class="group-title">Victory</h3>
		<div class="supply-row">
			<SupplyCard name="Estate" count={supply.victoryPiles.estate} cost={2} category="victory" onclick={onBuyCard ? () => onBuyCard!('Estate') : undefined} />
			<SupplyCard name="Duchy" count={supply.victoryPiles.duchy} cost={5} category="victory" onclick={onBuyCard ? () => onBuyCard!('Duchy') : undefined} />
			<SupplyCard name="Province" count={supply.victoryPiles.province} cost={8} category="victory" onclick={onBuyCard ? () => onBuyCard!('Province') : undefined} />
			<SupplyCard name="Curse" count={supply.cursePile} cost={0} category="curse" />
		</div>
	</div>

	<!-- Kingdom piles -->
	{#if supply.kingdomPiles.size > 0}
		<div class="supply-group">
			<h3 class="group-title">Kingdom</h3>
			<div class="supply-row supply-row--wrap">
				{#each supply.kingdomPiles.entries() as [name, count] (name)}
					<SupplyCard
						{name}
						{count}
						cost={getActionCost(name)}
						category="action"
						onclick={onBuyCard ? () => onBuyCard!(name) : undefined}
					/>
				{/each}
			</div>
		</div>
	{/if}
</section>

<script lang="ts" module>
	import { ACTION_COIN_COSTS } from '$lib/engine/state';

	function getActionCost(name: string): number {
		return ACTION_COIN_COSTS[name as keyof typeof ACTION_COIN_COSTS] ?? 0;
	}
</script>

<style>
	.supply-panel {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		padding: var(--space-md);
		background: var(--surface-secondary);
		border-radius: var(--radius-lg);
	}

	.supply-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.group-title {
		font: var(--type-label);
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin: 0;
	}

	.supply-row {
		display: flex;
		gap: var(--space-sm);
		flex-wrap: nowrap;
		overflow-x: auto;
	}

	.supply-row--wrap {
		flex-wrap: wrap;
	}
</style>
