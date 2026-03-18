<script lang="ts">
	import Board from '$lib/components/board/Board.svelte';
	import Hand from '$lib/components/deck/Hand.svelte';
	import SupplyPanel from '$lib/components/deck/SupplyPanel.svelte';
	import PhaseBar from '$lib/components/ui/PhaseBar.svelte';
	import TabBar from '$lib/components/ui/TabBar.svelte';
	import ScorePanel from '$lib/components/ui/ScorePanel.svelte';
	import type { Tab } from '$lib/components/ui/TabBar.svelte';
	import { getGameState, dispatch } from '$lib/stores/game.svelte';

	const gameState = $derived(getGameState());
	const activePlayer = $derived(gameState.players[gameState.activePlayerIndex]);

	let activeTab = $state<Tab>('board');

	function handleRoll() {
		dispatch({ type: 'ROLL_DICE', playerId: activePlayer.id });
	}
</script>

<svelte:head>
	<title>Dominion of Catan</title>
</svelte:head>

<div class="game-root">
	<!-- Phase / turn header — always visible -->
	<PhaseBar
		phase={gameState.currentPhase}
		{activePlayer}
		diceResult={gameState.diceResult}
		onRoll={gameState.currentPhase === 'ROLL' ? handleRoll : undefined}
	/>

	<!-- Mobile: tab-based single-panel layout -->
	<div class="mobile-layout">
		<main class="mobile-panel">
			{#if activeTab === 'board'}
				<div class="board-container">
					<Board state={gameState} />
				</div>
			{:else if activeTab === 'hand'}
				<div class="panel-scroll">
					<Hand cards={activePlayer.hand} label="{activePlayer.name}'s Hand" />
				</div>
			{:else if activeTab === 'supply'}
				<div class="panel-scroll">
					<SupplyPanel supply={gameState.supply} />
				</div>
			{:else if activeTab === 'scores'}
				<div class="panel-scroll">
					<ScorePanel state={gameState} />
				</div>
			{/if}
		</main>
		<TabBar active={activeTab} onTabChange={(t) => (activeTab = t)} />
	</div>

	<!-- Desktop: side-by-side layout -->
	<div class="desktop-layout">
		<aside class="desktop-sidebar desktop-sidebar--left">
			<div class="sidebar-section">
				<Hand cards={activePlayer.hand} label="{activePlayer.name}'s Hand" />
			</div>
			<div class="sidebar-section sidebar-section--grow">
				<ScorePanel state={gameState} />
			</div>
		</aside>

		<main class="desktop-board">
			<div class="board-container">
				<Board state={gameState} />
			</div>
		</main>

		<aside class="desktop-sidebar desktop-sidebar--right">
			<SupplyPanel supply={gameState.supply} />
		</aside>
	</div>
</div>

<style>
	.game-root {
		display: flex;
		flex-direction: column;
		height: 100dvh;
		background: var(--surface-primary);
		overflow: hidden;
	}

	/* ---- Mobile layout (default) ---- */
	.mobile-layout {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
	}

	.mobile-panel {
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}

	.panel-scroll {
		height: 100%;
		overflow-y: auto;
		padding: var(--space-md);
	}

	/* Desktop layout hidden on mobile */
	.desktop-layout {
		display: none;
	}

	/* ---- Shared board container ---- */
	.board-container {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--surface-secondary);
	}

	/* ---- Responsive breakpoint ---- */
	@media (min-width: 900px) {
		.mobile-layout {
			display: none;
		}

		.desktop-layout {
			display: flex;
			flex: 1;
			min-height: 0;
		}

		.desktop-sidebar {
			width: 280px;
			flex-shrink: 0;
			display: flex;
			flex-direction: column;
			overflow-y: auto;
			background: var(--surface-primary);
			border-right: 1px solid var(--border-subtle);
		}

		.desktop-sidebar--right {
			border-right: none;
			border-left: 1px solid var(--border-subtle);
		}

		.sidebar-section {
			padding: var(--space-md);
			border-bottom: 1px solid var(--border-subtle);
		}

		.sidebar-section--grow {
			flex: 1;
			border-bottom: none;
		}

		.desktop-board {
			flex: 1;
			min-width: 0;
			display: flex;
			flex-direction: column;
		}
	}
</style>
