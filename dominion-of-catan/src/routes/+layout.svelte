<script lang="ts">
	import '$lib/styles/reset.css';
	import '$lib/styles/tokens.css';
	import '$lib/styles/typography.css';

	let { children } = $props();
</script>

{@render children()}
