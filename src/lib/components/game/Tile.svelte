<script lang="ts">
	export type TileState = 'empty' | 'tbd' | 'absent' | 'present' | 'correct';

	interface Props {
		letter: string;
		state?: TileState;
		delay?: number;
		invalid?: boolean;
		bounce?: boolean;
	}

	let {
		letter = '',
		state = 'empty',
		delay = 0,
		invalid = false,
		bounce = false
	}: Props = $props();

	let reveal = $state(false);
	let shaking = $state(false);
	let bouncing = $state(false);

	$effect(() => {
		if (state !== 'empty' && state !== 'tbd' && letter) {
			const timer = setTimeout(() => {
				reveal = true;
			}, delay);
			return () => clearTimeout(timer);
		} else {
			reveal = false;
		}
	});

	$effect(() => {
		if (invalid) {
			shaking = true;
		}
	});

	$effect(() => {
		if (bounce) {
			bouncing = true;
		}
	});

	function onShakeEnd() {
		shaking = false;
	}

	function onBounceEnd() {
		bouncing = false;
	}
</script>

<div
	class="tile {state}"
	class:reveal
	class:shaking
	class:bouncing
	style="animation-delay: {delay}ms"
	onanimationend={(e) => {
		if (e.animationName === 'shake') onShakeEnd();
		if (e.animationName === 'bounce') onBounceEnd();
	}}
>
	{#if letter}
		<span class="letter">{letter}</span>
	{/if}
</div>

<style>
	.tile {
		width: 62px;
		height: 62px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2px solid var(--color-border);
		background: var(--color-empty);
		color: var(--color-text);
		font-weight: 700;
		font-size: 2rem;
		line-height: 1;
		text-transform: uppercase;
		box-sizing: border-box;
		user-select: none;
	}

	:global(.dark) .tile {
		border-color: var(--color-border-dark);
	}

	.tile.tbd {
		border-color: var(--color-text-muted);
		background: var(--color-empty);
		color: var(--color-text);
	}

	:global(.dark) .tile.tbd {
		border-color: var(--color-text-muted);
	}

	.tile.reveal {
		animation: tileFlip 0.3s ease-in-out forwards;
	}

	.tile.absent {
		border-color: var(--color-absent);
		background: var(--color-absent);
		color: #ffffff;
	}

	.tile.present {
		border-color: var(--color-present);
		background: var(--color-present);
		color: #ffffff;
	}

	.tile.correct {
		border-color: var(--color-correct);
		background: var(--color-correct);
		color: #ffffff;
	}

	.tile.shaking {
		animation: shake 0.4s ease-in-out;
	}

	.tile.bouncing {
		animation: bounce 0.5s ease-out;
	}

	.letter {
		display: block;
	}
</style>
