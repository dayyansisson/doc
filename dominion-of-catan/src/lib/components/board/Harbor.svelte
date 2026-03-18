<script lang="ts">
	import type { Harbor as HarborType } from '$lib/engine/state';
	import type { Point } from '$lib/engine/hex-math';

	const HARBOR_LABEL: Record<string, string> = {
		GENERIC_3_1: '3:1',
		BRICK_2_1: '2:1🧱',
		LUMBER_2_1: '2:1🪵',
		ORE_2_1: '2:1⛏',
		GRAIN_2_1: '2:1🌾',
		WOOL_2_1: '2:1🐑'
	};

	const HARBOR_COLOR: Record<string, string> = {
		GENERIC_3_1: '#9b59b6',
		BRICK_2_1: '#c05a2a',
		LUMBER_2_1: '#3a7d44',
		ORE_2_1: '#8e8ea0',
		GRAIN_2_1: '#f0c040',
		WOOL_2_1: '#6ec664'
	};

	let {
		harbor,
		midpoint
	}: {
		harbor: HarborType;
		midpoint: Point;
	} = $props();

	const label = $derived(HARBOR_LABEL[harbor.type] ?? harbor.type);
	const color = $derived(HARBOR_COLOR[harbor.type] ?? '#888');
</script>

<g class="harbor" transform="translate({midpoint.x}, {midpoint.y})">
	<rect x="-18" y="-10" width="36" height="20" rx="4" fill={color} fill-opacity="0.85" stroke="white" stroke-width="1.2" />
	<text
		x="0"
		y="0"
		text-anchor="middle"
		dominant-baseline="middle"
		font-size="9"
		font-weight="600"
		font-family="var(--font-ui)"
		fill="white"
	>{label}</text>
</g>

<style>
	.harbor {
		pointer-events: none;
	}
</style>
