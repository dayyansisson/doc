<script lang="ts">
	import type { Point } from '$lib/engine/hex-math';

	let {
		number,
		center,
		activated = false
	}: {
		number: number;
		center: Point;
		activated?: boolean;
	} = $props();

	// 6 and 8 are red (high probability), others default
	const isHot = $derived(number === 6 || number === 8);
	// Dot count corresponds to probability (number of ways to roll)
	const DOT_COUNT: Record<number, number> = { 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3, 11: 2, 12: 1 };
	const dots = $derived(DOT_COUNT[number] ?? 0);
	const dotPositions = $derived(
		Array.from({ length: dots }, (_, i) => {
			const spacing = 5;
			const totalWidth = (dots - 1) * spacing;
			return center.x - totalWidth / 2 + i * spacing;
		})
	);
</script>

<!-- Token circle -->
<circle
	cx={center.x}
	cy={center.y}
	r="16"
	fill="var(--surface-elevated)"
	stroke="var(--border-default)"
	stroke-width="1.5"
	class="token"
	class:activated
/>

<!-- Number label -->
<text
	x={center.x}
	y={center.y + 1}
	text-anchor="middle"
	dominant-baseline="middle"
	font-size="13"
	font-weight="700"
	font-family="var(--font-numbers)"
	fill={isHot ? '#d42b2b' : 'var(--text-primary)'}
	class="token-number"
>{number}</text>

<!-- Probability dots -->
{#each dotPositions as dotX}
	<circle
		cx={dotX}
		cy={center.y + 10}
		r="1.5"
		fill={isHot ? '#d42b2b' : 'var(--text-secondary)'}
	/>
{/each}

<style>
	.token {
		transition: filter var(--duration-micro) var(--ease-standard);
	}
	.token.activated {
		filter: drop-shadow(0 0 6px rgba(255, 200, 0, 0.8));
	}
	.token-number {
		pointer-events: none;
		user-select: none;
	}
</style>
