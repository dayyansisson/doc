<script lang="ts">
	import type { HexTile as HexTileType } from '$lib/engine/state';
	import type { Point } from '$lib/engine/hex-math';
	import { hexCorners } from '$lib/engine/hex-math';

	const TERRAIN_FILL: Record<string, string> = {
		FOREST: '#3a7d44',
		PASTURE: '#6ec664',
		FIELDS: '#f0c040',
		HILLS: '#c05a2a',
		MOUNTAINS: '#8e8ea0',
		DESERT: '#d4b87a'
	};

	const TERRAIN_STROKE: Record<string, string> = {
		FOREST: '#2d6035',
		PASTURE: '#4faa45',
		FIELDS: '#c9a020',
		HILLS: '#9c4018',
		MOUNTAINS: '#6a6a7a',
		DESERT: '#b09060'
	};

	let {
		hex,
		center,
		size,
		onclick
	}: {
		hex: HexTileType;
		center: Point;
		size: number;
		onclick?: () => void;
	} = $props();

	const corners = $derived(hexCorners(center, size));
	const points = $derived(corners.map((p) => `${p.x},${p.y}`).join(' '));
	const fill = $derived(TERRAIN_FILL[hex.terrain] ?? '#cccccc');
	const stroke = $derived(TERRAIN_STROKE[hex.terrain] ?? '#999999');
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<polygon
	{points}
	fill={fill}
	stroke={stroke}
	stroke-width="2"
	class="hex-tile"
	class:has-robber={hex.hasRobber}
	role={onclick ? 'button' : undefined}
	tabindex={onclick ? 0 : undefined}
	onclick={onclick}
	onkeydown={onclick ? (e) => e.key === 'Enter' && onclick() : undefined}
/>

<style>
	.hex-tile {
		cursor: default;
		transition: filter var(--duration-micro) var(--ease-standard);
	}
	.hex-tile[role='button'] {
		cursor: pointer;
	}
	.hex-tile[role='button']:hover {
		filter: brightness(1.1);
	}
	.hex-tile.has-robber {
		filter: brightness(0.75) saturate(0.6);
	}
</style>
