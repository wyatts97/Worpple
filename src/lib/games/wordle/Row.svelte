<script lang="ts">
	import { COLS } from './game-logic';
	import Tile from './Tile.svelte';
	import type { LetterState } from './types';

	interface Props {
		guesses: number;
		num: number;
		value?: string;
		rowState?: LetterState[];
		oncontext?: (detail: { x: number; y: number }) => void;
	}

	let { guesses, num, value = '', rowState = [], oncontext }: Props = $props();

	let animation = $state('');
	let tiles: Tile[] = $state([]);

	export function shake() {
		animation = 'shake';
	}
	export function bounce() {
		for (const t of tiles) {
			t.bounce();
		}
	}

	const MAX_DOUBLE_CLICK_INTERVAL = 400;
	let lastTouch = $state(0);

	function onTouch(e: TouchEvent) {
		if (Date.now() - lastTouch <= MAX_DOUBLE_CLICK_INTERVAL) {
			e.preventDefault();
			oncontext?.({ x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY });
		} else {
			lastTouch = Date.now();
		}
	}
</script>

<div
	class="board-row"
	oncontextmenu={(e) => { e.preventDefault(); oncontext?.({ x: e.clientX, y: e.clientY }); }}
	ondblclick={(e) => { e.preventDefault(); oncontext?.({ x: e.clientX, y: e.clientY }); }}
	ontouchstart={onTouch}
	onanimationend={() => (animation = '')}
	data-animation={animation}
	class:complete={guesses > num}
>
	{#each Array(COLS) as _, i}
		<Tile
			bind:this={tiles[i]}
			letterState={rowState[i]}
			value={value.charAt(i)}
			position={i}
		/>
	{/each}
</div>

<style>
	.board-row {
		display: grid;
		grid-template-columns: repeat(var(--cols, 5), 1fr);
		gap: 5px;
	}
	.board-row[data-animation="shake"] {
		animation: shake 0.6s;
	}
	@keyframes shake {
		10%, 90% { transform: translateX(-1px); }
		20%, 80% { transform: translateX(2px); }
		30%, 50%, 70% { transform: translateX(-4px); }
		40%, 60% { transform: translateX(4px); }
	}
</style>
