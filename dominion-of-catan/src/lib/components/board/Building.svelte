<script lang="ts">
	import type { Building as BuildingType } from '$lib/engine/state';
	import type { Point } from '$lib/engine/hex-math';

	const PLAYER_COLORS = [
		'var(--player-1)',
		'var(--player-2)',
		'var(--player-3)',
		'var(--player-4)'
	];

	let {
		building,
		position,
		playerColorIndex,
		onclick
	}: {
		building: BuildingType;
		position: Point;
		playerColorIndex: number;
		onclick?: () => void;
	} = $props();

	const color = $derived(PLAYER_COLORS[playerColorIndex] ?? '#888');
	const isCity = $derived(building.type === 'CITY');
</script>

{#if isCity}
	<!-- City: two stacked rectangles (larger building) -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<g
		class="building city"
		transform="translate({position.x}, {position.y})"
		role={onclick ? 'button' : undefined}
		tabindex={onclick ? 0 : undefined}
		onclick={onclick}
		onkeydown={onclick ? (e) => e.key === 'Enter' && onclick() : undefined}
	>
		<rect x="-9" y="-5" width="18" height="12" fill={color} stroke="white" stroke-width="1.5" rx="1" />
		<polygon points="-9,-5 0,-14 9,-5" fill={color} stroke="white" stroke-width="1.5" />
		<rect x="-5" y="-5" width="8" height="8" fill={color} stroke="white" stroke-width="1" rx="1" />
		<polygon points="-5,-5 -1,-10 3,-5" fill={color} stroke="white" stroke-width="1" />
	</g>
{:else}
	<!-- Settlement: house shape (square + triangle roof) -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<g
		class="building settlement"
		transform="translate({position.x}, {position.y})"
		role={onclick ? 'button' : undefined}
		tabindex={onclick ? 0 : undefined}
		onclick={onclick}
		onkeydown={onclick ? (e) => e.key === 'Enter' && onclick() : undefined}
	>
		<rect x="-7" y="-3" width="14" height="9" fill={color} stroke="white" stroke-width="1.5" rx="1" />
		<polygon points="-7,-3 0,-12 7,-3" fill={color} stroke="white" stroke-width="1.5" />
	</g>
{/if}

<style>
	.building {
		cursor: default;
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4));
		transition: filter var(--duration-micro) var(--ease-standard);
	}
	.building[role='button'] {
		cursor: pointer;
	}
	.building[role='button']:hover {
		filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.6)) brightness(1.15);
	}
</style>
