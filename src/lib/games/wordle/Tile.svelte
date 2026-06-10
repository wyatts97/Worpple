<script lang="ts">
	import { onMount } from 'svelte';
	import { mode } from './stores';
	import { DELAY_INCREMENT, ROWS } from './game-logic';
	import type { LetterState } from './types';

	interface Props {
		value?: string;
		letterState?: LetterState;
		position?: number;
	}

	let { value = '', letterState = '🔳', position = 0 }: Props = $props();

	let animation = $state('');

	export function bounce() {
		setTimeout(() => (animation = 'bounce'), (ROWS + position) * DELAY_INCREMENT);
	}

	// reset on mode change
	const unsub = mode.subscribe(() => {
		animation = '';
	});

	// prevent pop animation at start
	let pop = $state(false);
	onMount(() => {
		setTimeout(() => (pop = true), 200);
	});

	$effect(() => {
		return () => unsub();
	});
</script>

<div
	data-animation={animation}
	class:value
	class:pop
	class="tile {letterState}"
	style="transition-delay: {position * DELAY_INCREMENT}ms"
>
	<div class="front">{value}</div>
	<div class="back">{value}</div>
</div>

<style>
	:not(.pop),
	:global(.complete) .value {
		scale: 1 !important;
		opacity: 1 !important;
	}
	.value {
		animation: pop 0.1s;
	}
	.value .front {
		border-color: var(--border-primary, var(--color-border));
	}
	.tile {
		font-size: 2rem;
		font-weight: bold;
		text-transform: uppercase;
		position: relative;
		transform-style: preserve-3d;
	}
	.tile[data-animation="bounce"] {
		animation: bounce 1s;
	}
	.back,
	.front {
		display: grid;
		place-items: center;
		position: absolute;
		inset: 0;
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
		transition: transform 0s ease-in-out;
	}
	.front {
		border: 2px solid var(--border-primary, var(--color-border));
		transform: rotateX(0deg);
		color: var(--fg-primary, var(--color-text));
	}
	.back {
		background: var(--color-absent, #787c7e);
		transform: rotateX(180deg);
	}
	.🟩 .back {
		background: var(--color-correct, #6aaa64);
	}
	.🟨 .back {
		background: var(--color-present, #c9b458);
	}
	:global(.complete) .tile:not(.🔳) .front {
		transition-delay: inherit !important;
		transition-duration: 0.8s;
		transform: rotateX(180deg);
	}
	:global(.complete) .tile:not(.🔳) .back {
		transition-delay: inherit !important;
		transition-duration: 0.8s;
		transform: rotateX(0deg);
	}
	@keyframes pop {
		from {
			scale: 0.8;
			opacity: 0;
		}
		40% {
			scale: 1.1;
			opacity: 1;
		}
	}
	@keyframes bounce {
		0%, 20% { transform: translateY(0); }
		40% { transform: translateY(-30px); }
		50% { transform: translateY(5px); }
		60% { transform: translateY(-15px); }
		80% { transform: translateY(2px); }
		100% { transform: translateY(0); }
	}
</style>
