<script lang="ts">
	import Row from './Row.svelte';
	import type { GameBoard } from './types';

	interface Props {
		value: string[];
		board: GameBoard;
		guesses: number;
	}

	let { value, board, guesses }: Props = $props();

	let rows: Row[] = $state([]);

	export function shake(row: number) {
		rows[row]?.shake();
	}
	export function bounce(row: number) {
		rows[row]?.bounce();
	}
</script>

<div class="board">
	{#each value as _, i}
		<Row
			num={i}
			{guesses}
			bind:this={rows[i]}
			value={value[i]}
			rowState={board.state[i]}
		/>
	{/each}
</div>

<style>
	.board {
		display: grid;
		grid-template-rows: repeat(var(--rows, 6), 1fr);
		gap: 5.5px;
		max-height: 420px;
		flex-grow: 1;
		aspect-ratio: var(--cols, 5) / var(--rows, 6);
		padding: 10px;
	}
</style>
