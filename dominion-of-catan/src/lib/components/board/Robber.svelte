<script lang="ts">
	import type { Point } from '$lib/engine/hex-math';

	let {
		center,
		interactive = false,
		onclick
	}: {
		center: Point;
		interactive?: boolean;
		onclick?: () => void;
	} = $props();
</script>

<!-- Robber: stylised figure drawn in SVG -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<g
	class="robber"
	class:interactive
	transform="translate({center.x}, {center.y})"
	role={interactive ? 'button' : undefined}
	tabindex={interactive ? 0 : undefined}
	onclick={onclick}
	onkeydown={interactive && onclick ? (e) => e.key === 'Enter' && onclick() : undefined}
>
	<!-- Body -->
	<ellipse cx="0" cy="6" rx="8" ry="10" fill="#1a1a2e" stroke="#444" stroke-width="1" />
	<!-- Head -->
	<circle cx="0" cy="-8" r="7" fill="#1a1a2e" stroke="#444" stroke-width="1" />
	<!-- Eyes -->
	<circle cx="-2.5" cy="-9" r="1.2" fill="#ff4444" />
	<circle cx="2.5" cy="-9" r="1.2" fill="#ff4444" />
</g>

<style>
	.robber {
		cursor: default;
	}
	.robber.interactive {
		cursor: pointer;
	}
	.robber.interactive:hover ellipse,
	.robber.interactive:hover circle:first-of-type {
		fill: #2e2e4e;
	}
</style>
