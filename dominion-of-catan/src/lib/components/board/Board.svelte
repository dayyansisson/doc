<script lang="ts">
	import type { GameState, Player } from '$lib/engine/state';
	import type { Point } from '$lib/engine/hex-math';
	import {
		CATAN_HEX_COORDS,
		hexKey,
		hexToPixel,
		hexCorners,
		hexCornerSharedHexes,
		intersectionKey
	} from '$lib/engine/hex-math';
	import HexTile from './HexTile.svelte';
	import NumberToken from './NumberToken.svelte';
	import Harbor from './Harbor.svelte';
	import Building from './Building.svelte';
	import Road from './Road.svelte';
	import Robber from './Robber.svelte';

	const HEX_SIZE = 64;

	let {
		state,
		onHexClick,
		onIntersectionClick,
		onEdgeClick
	}: {
		state: GameState;
		onHexClick?: (hexId: string) => void;
		onIntersectionClick?: (intersectionId: string) => void;
		onEdgeClick?: (edgeId: string) => void;
	} = $props();

	// ---- Precompute pixel positions ----

	// Hex center pixels: Map<hexId, Point>
	const hexPixels = $derived.by(() => {
		const m = new Map<string, Point>();
		for (const coord of CATAN_HEX_COORDS) {
			m.set(hexKey(coord), hexToPixel(coord, HEX_SIZE));
		}
		return m;
	});

	// Intersection pixel positions: Map<intersectionId, Point>
	const intersectionPixels = $derived.by(() => {
		const m = new Map<string, Point>();
		const boardHexSet = new Set(CATAN_HEX_COORDS.map(hexKey));

		for (const coord of CATAN_HEX_COORDS) {
			const center = hexPixels.get(hexKey(coord));
			if (!center) continue;
			const corners = hexCorners(center, HEX_SIZE);
			const sharedGroups = hexCornerSharedHexes(coord, boardHexSet);

			for (let i = 0; i < 6; i++) {
				const key = intersectionKey(sharedGroups[i]);
				if (!m.has(key)) {
					m.set(key, corners[i]);
				}
			}
		}
		return m;
	});

	// Player lookup by id
	const playerById = $derived.by(() => {
		const m = new Map<string, Player>();
		for (const p of state.players) m.set(p.id, p);
		return m;
	});

	// Active player
	const activePlayer = $derived(state.players[state.activePlayerIndex]);

	// Robber hex center
	const robberHex = $derived.by(() => {
		for (const [id, hex] of state.board.hexes) {
			if (hex.hasRobber) return hexPixels.get(id) ?? null;
		}
		return null;
	});

	// Harbor midpoints (average of the two harbor intersections)
	const harborMidpoints = $derived.by(() => {
		const result: { harbor: (typeof state.board.harbors extends Map<string, infer H> ? H : never); midpoint: Point }[] = [];
		for (const harbor of state.board.harbors.values()) {
			const [idA, idB] = harbor.intersectionIds;
			const pA = intersectionPixels.get(idA);
			const pB = intersectionPixels.get(idB);
			if (pA && pB) {
				// Push midpoint outward from board center to be visible outside hex ring
				const mid = { x: (pA.x + pB.x) / 2, y: (pA.y + pB.y) / 2 };
				const len = Math.sqrt(mid.x * mid.x + mid.y * mid.y);
				const push = 28;
				result.push({
					harbor,
					midpoint: len > 0 ? { x: mid.x + (mid.x / len) * push, y: mid.y + (mid.y / len) * push } : mid
				});
			}
		}
		return result;
	});

	// ViewBox encompassing all hexes + harbor labels + some padding
	const VIEW_W = 620;
	const VIEW_H = 660;
	const viewBox = `-${VIEW_W / 2} -${VIEW_H / 2} ${VIEW_W} ${VIEW_H}`;
</script>

<svg
	class="board-svg"
	viewBox={viewBox}
	xmlns="http://www.w3.org/2000/svg"
	aria-label="Catan game board"
	role="img"
>
	<!-- Layer 1: Hex tiles -->
	{#each state.board.hexes.values() as hex (hex.id)}
		{@const center = hexPixels.get(hex.id)}
		{#if center}
			<HexTile
				{hex}
				{center}
				size={HEX_SIZE}
				onclick={onHexClick ? () => onHexClick!(hex.id) : undefined}
			/>
		{/if}
	{/each}

	<!-- Layer 2: Harbor labels -->
	{#each harborMidpoints as { harbor, midpoint } (harbor.id)}
		<Harbor {harbor} {midpoint} />
	{/each}

	<!-- Layer 3: Number tokens -->
	{#each state.board.hexes.values() as hex (hex.id)}
		{@const center = hexPixels.get(hex.id)}
		{#if center && hex.numberToken !== null && !hex.hasRobber}
			<NumberToken
				number={hex.numberToken}
				{center}
				activated={state.diceResult === hex.numberToken}
			/>
		{/if}
	{/each}

	<!-- Layer 4: Roads -->
	{#each state.board.edges.values() as edge (edge.id)}
		{#if edge.road}
			{@const [idA, idB] = edge.adjacentIntersectionIds}
			{@const from = intersectionPixels.get(idA)}
			{@const to = intersectionPixels.get(idB)}
			{@const player = playerById.get(edge.road.playerId)}
			{#if from && to && player}
				<Road
					{from}
					{to}
					playerColorIndex={player.colorIndex}
					onclick={onEdgeClick ? () => onEdgeClick!(edge.id) : undefined}
				/>
			{/if}
		{/if}
	{/each}

	<!-- Layer 5: Buildings -->
	{#each state.board.intersections.values() as intersection (intersection.id)}
		{#if intersection.building}
			{@const pos = intersectionPixels.get(intersection.id)}
			{@const player = playerById.get(intersection.building.playerId)}
			{#if pos && player}
				<Building
					building={intersection.building}
					position={pos}
					playerColorIndex={player.colorIndex}
					onclick={onIntersectionClick ? () => onIntersectionClick!(intersection.id) : undefined}
				/>
			{/if}
		{/if}
	{/each}

	<!-- Layer 6: Robber -->
	{#if robberHex}
		<Robber
			center={robberHex}
			interactive={state.currentPhase === 'ROLL' || state.currentPhase === 'TRADE_BUILD'}
			onclick={onHexClick ? () => {
				for (const [id, hex] of state.board.hexes) {
					if (hex.hasRobber) { onHexClick!(id); break; }
				}
			} : undefined}
		/>
	{/if}
</svg>

<style>
	.board-svg {
		width: 100%;
		height: 100%;
		max-height: 100%;
		overflow: visible;
	}
</style>
