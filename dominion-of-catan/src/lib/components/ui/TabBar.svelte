<script lang="ts">
	export type Tab = 'board' | 'hand' | 'supply' | 'scores';

	const TAB_CONFIG: { id: Tab; label: string; icon: string }[] = [
		{ id: 'board', label: 'Board', icon: '🗺' },
		{ id: 'hand', label: 'Hand', icon: '🃏' },
		{ id: 'supply', label: 'Supply', icon: '🏪' },
		{ id: 'scores', label: 'Scores', icon: '🏆' }
	];

	let {
		active,
		onTabChange
	}: {
		active: Tab;
		onTabChange: (tab: Tab) => void;
	} = $props();
</script>

<nav class="tab-bar" aria-label="Game sections">
	{#each TAB_CONFIG as tab (tab.id)}
		<button
			class="tab-btn"
			class:active={active === tab.id}
			onclick={() => onTabChange(tab.id)}
			aria-current={active === tab.id ? 'page' : undefined}
		>
			<span class="tab-icon" aria-hidden="true">{tab.icon}</span>
			<span class="tab-label">{tab.label}</span>
		</button>
	{/each}
</nav>

<style>
	.tab-bar {
		display: flex;
		background: var(--surface-elevated);
		border-top: 1px solid var(--border-subtle);
		padding-bottom: env(safe-area-inset-bottom, 0);
	}

	.tab-btn {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
		padding: var(--space-sm) var(--space-xs);
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-tertiary);
		transition: color var(--duration-micro) var(--ease-standard);
		min-height: 52px;
	}

	.tab-btn.active {
		color: var(--player-1);
	}

	.tab-btn:hover:not(.active) {
		color: var(--text-secondary);
	}

	.tab-icon {
		font-size: 20px;
		line-height: 1;
	}

	.tab-label {
		font: var(--type-caption);
		font-weight: 500;
	}
</style>
