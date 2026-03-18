<script lang="ts">
	import type { GamePhase, Player } from '$lib/engine/state';

	const PHASE_LABEL: Record<GamePhase, string> = {
		SETUP: 'Setup',
		INITIAL_PLACEMENT: 'Place Starting Pieces',
		ROLL: 'Roll Dice',
		ACTION: 'Play Actions',
		TRADE_BUILD: 'Trade & Build',
		ATTACH: 'Attach Victory Cards',
		CLEANUP: 'Cleanup',
		GAME_OVER: 'Game Over'
	};

	const PHASE_HINT: Record<GamePhase, string> = {
		SETUP: 'Preparing the game…',
		INITIAL_PLACEMENT: 'Place your settlement, then a road adjacent to it.',
		ROLL: 'Roll the dice to collect resources.',
		ACTION: 'Play up to 1 Action card from your hand.',
		TRADE_BUILD: 'Trade resources or buy cards and build on the board.',
		ATTACH: 'Attach Victory cards to your buildings.',
		CLEANUP: 'Discard hand, draw 5 cards.',
		GAME_OVER: 'The game is over!'
	};

	const PLAYER_COLORS = [
		'var(--player-1)',
		'var(--player-2)',
		'var(--player-3)',
		'var(--player-4)'
	];

	let {
		phase,
		activePlayer,
		diceResult,
		onRoll
	}: {
		phase: GamePhase;
		activePlayer: Player;
		diceResult: number | null;
		onRoll?: () => void;
	} = $props();

	const playerColor = $derived(PLAYER_COLORS[activePlayer.colorIndex] ?? '#888');
</script>

<div class="phase-bar" style="--active-color: {playerColor}">
	<div class="player-badge">
		<div class="player-dot" aria-hidden="true"></div>
		<span class="player-name">{activePlayer.name}</span>
	</div>

	<div class="phase-info">
		<span class="phase-label">{PHASE_LABEL[phase]}</span>
		<span class="phase-hint">{PHASE_HINT[phase]}</span>
	</div>

	<div class="phase-actions">
		{#if phase === 'ROLL'}
			<button class="roll-btn" onclick={onRoll} disabled={!onRoll}>
				{#if diceResult !== null}
					🎲 {diceResult}
				{:else}
					🎲 Roll
				{/if}
			</button>
		{:else if diceResult !== null}
			<div class="dice-result" aria-label="Dice result: {diceResult}">
				🎲 <strong>{diceResult}</strong>
			</div>
		{/if}
	</div>
</div>

<style>
	.phase-bar {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-sm) var(--space-md);
		background: var(--surface-elevated);
		border-bottom: 1px solid var(--border-subtle);
		box-shadow: var(--shadow-card);
		min-height: 56px;
	}

	.player-badge {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		flex-shrink: 0;
	}

	.player-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--active-color);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--active-color) 30%, transparent);
	}

	.player-name {
		font: var(--type-label);
		color: var(--text-primary);
		font-weight: 600;
	}

	.phase-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
	}

	.phase-label {
		font: var(--type-label);
		color: var(--active-color);
		font-weight: 600;
	}

	.phase-hint {
		font: var(--type-caption);
		color: var(--text-tertiary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.phase-actions {
		flex-shrink: 0;
	}

	.roll-btn {
		padding: var(--space-xs) var(--space-md);
		background: var(--active-color);
		color: white;
		border: none;
		border-radius: var(--radius-full);
		font: var(--type-label);
		cursor: pointer;
		transition: filter var(--duration-micro) var(--ease-standard);
	}

	.roll-btn:hover:not(:disabled) {
		filter: brightness(1.1);
	}

	.roll-btn:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.dice-result {
		font: var(--type-label);
		color: var(--text-secondary);
		padding: var(--space-xs) var(--space-sm);
	}
</style>
