<script lang="ts">
	import type { GameState, Player } from '$lib/engine/state';
	import { calculateVP } from '$lib/engine/scoring';

	const PLAYER_COLORS = [
		'var(--player-1)',
		'var(--player-2)',
		'var(--player-3)',
		'var(--player-4)'
	];

	let {
		state
	}: {
		state: GameState;
	} = $props();

	const scores = $derived(
		state.players.map((p) => ({
			player: p,
			vp: calculateVP(state, p.id),
			longestRoad: state.longestRoadHolder === p.id,
			largestArmy: state.largestArmyHolder === p.id
		}))
	);

	const ranked = $derived([...scores].sort((a, b) => b.vp - a.vp));
</script>

<section class="score-panel" aria-label="Scores">
	<h2 class="panel-title">Scores</h2>
	<ul class="score-list">
		{#each ranked as { player, vp, longestRoad, largestArmy }, i (player.id)}
			<li class="score-row" style="--player-color: {PLAYER_COLORS[player.colorIndex] ?? '#888'}">
				<span class="rank">#{i + 1}</span>
				<span class="player-dot" aria-hidden="true"></span>
				<span class="player-name">{player.name}</span>
				<span class="score-total">{vp} VP</span>
				<div class="score-breakdown">
					{#if longestRoad}<span class="badge">🛤 Longest Road</span>{/if}
					{#if largestArmy}<span class="badge">⚔ Largest Army</span>{/if}
				</div>
			</li>
		{/each}
	</ul>
</section>

<style>
	.score-panel {
		padding: var(--space-md);
	}

	.panel-title {
		font: var(--type-heading);
		color: var(--text-primary);
		margin: 0 0 var(--space-md);
	}

	.score-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.score-row {
		display: grid;
		grid-template-columns: 24px 12px 1fr auto;
		grid-template-rows: auto auto;
		align-items: center;
		column-gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		background: var(--surface-secondary);
		border-radius: var(--radius-md);
		border-left: 3px solid var(--player-color);
	}

	.rank {
		font: var(--type-caption);
		color: var(--text-tertiary);
		font-weight: 700;
	}

	.player-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--player-color);
	}

	.player-name {
		font: var(--type-label);
		color: var(--text-primary);
		font-weight: 600;
	}

	.score-total {
		font: var(--type-number);
		color: var(--player-color);
		grid-column: 4;
		grid-row: 1;
	}

	.score-breakdown {
		grid-column: 3 / 5;
		grid-row: 2;
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-xs);
		font: var(--type-caption);
		color: var(--text-tertiary);
		margin-top: 2px;
	}

	.badge {
		background: var(--surface-tertiary);
		padding: 1px 6px;
		border-radius: var(--radius-full);
		color: var(--text-secondary);
	}
</style>
