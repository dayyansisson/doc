/**
 * Reactive game state store using Svelte 5 $state rune.
 * Exposes the current GameState and a dispatch function.
 */
import type { GameState } from '$lib/engine/state';
import type { GameAction } from '$lib/engine/actions';
import { reducer } from '$lib/engine/reducer';
import { getMockState } from '$lib/mock/fixture';

// Initialise from mock state in dev; will be replaced with real init in Phase 3
let _state = $state<GameState>(getMockState());

export function getGameState(): GameState {
	return _state;
}

export function dispatch(action: GameAction): void {
	_state = reducer(_state, action);
}

export function resetToMock(): void {
	_state = getMockState();
}
