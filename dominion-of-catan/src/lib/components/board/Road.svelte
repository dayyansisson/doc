<script lang="ts">
	import type { Point } from '$lib/engine/hex-math';

	const PLAYER_COLORS = [
		'var(--player-1)',
		'var(--player-2)',
		'var(--player-3)',
		'var(--player-4)'
	];

	let {
		from,
		to,
		playerColorIndex,
		onclick
	}: {
		from: Point;
		to: Point;
		playerColorIndex: number;
		onclick?: () => void;
	} = $props();

	const color = $derived(PLAYER_COLORS[playerColorIndex] ?? '#888');
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<line
	x1={from.x}
	y1={from.y}
	x2={to.x}
	y2={to.y}
	stroke={color}
	stroke-width="5"
	stroke-linecap="round"
	class="road"
	class:interactive={!!onclick}
	role={onclick ? 'button' : undefined}
	tabindex={onclick ? 0 : undefined}
	onclick={onclick}
	onkeydown={onclick ? (e) => e.key === 'Enter' && onclick() : undefined}
/>
<!-- White outline for contrast -->
<line
	x1={from.x}
	y1={from.y}
	x2={to.x}
	y2={to.y}
	stroke="white"
	stroke-width="8"
	stroke-linecap="round"
	stroke-opacity="0.25"
	class="road-outline"
	pointer-events="none"
/>

<style>
	.road {
		transition: stroke-width var(--duration-micro) var(--ease-standard);
	}
	.road.interactive {
		cursor: pointer;
	}
	.road.interactive:hover {
		stroke-width: 7;
	}
</style>
