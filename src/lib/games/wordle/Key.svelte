<script lang="ts">
	import type { LetterState } from './types';

	interface Props {
		letter: string;
		state?: LetterState;
		onkeystroke?: (letter: string) => void;
		children?: import('svelte').Snippet;
	}

	let { letter, state = '🔳', onkeystroke, children }: Props = $props();
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div
	class={state}
	class:big={letter.length !== 1}
	onclick={() => onkeystroke?.(letter)}
>
	{letter}{@render children?.()}
</div>

<style>
	div {
		font-size: calc(var(--fs-tiny, 0.75rem) + 1px);
		font-weight: bold;
		text-transform: uppercase;
		border-radius: 4px;
		height: 58px;
		background: var(--key-bg, var(--color-surface, #d3d6da));
		cursor: pointer;
		display: grid;
		place-items: center;
		flex: 1;
		transition: background-color 0.3s ease-in-out;
		user-select: none;
	}
	:global(.guesses) div {
		transition-delay: 1s;
	}
	:global(.guesses .preventChange) div {
		transition-duration: 0.15s;
		transition-delay: 0s;
		background: var(--key-bg, var(--color-surface, #d3d6da)) !important;
	}
	.big {
		font-size: var(--fs-tiny, 0.75rem);
		flex-grow: 1.5;
	}
	.⬛ {
		background: var(--color-absent, #787c7e);
		color: #fff;
	}
	.🟨 {
		background: var(--color-present, #c9b458);
		color: #fff;
	}
	.🟩 {
		background: var(--color-correct, #6aaa64);
		color: #fff;
	}
</style>
