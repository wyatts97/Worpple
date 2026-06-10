<script lang="ts">
	type KeyState = 'absent' | 'present' | 'correct';

	interface Props {
		keyStates?: Record<string, KeyState>;
		onKeyPress?: (key: string) => void;
		disabled?: boolean;
	}

	let {
		keyStates = {},
		onKeyPress = () => {},
		disabled = false
	}: Props = $props();

	const rows = [
		['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
		['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
		['Enter', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Backspace']
	];

	function handleClick(key: string) {
		if (!disabled) {
			onKeyPress(key);
		}
	}

	function getKeyClass(key: string) {
		const state = keyStates[key];
		if (state === 'absent') return 'absent';
		if (state === 'present') return 'present';
		if (state === 'correct') return 'correct';
		return 'default';
	}

	function isSpecial(key: string) {
		return key === 'Enter' || key === 'Backspace';
	}

	function displayLabel(key: string) {
		if (key === 'Backspace') return '⌫';
		return key;
	}
</script>

<div class="keyboard">
	{#each rows as row}
		<div class="row">
			{#each row as key}
				<button
					class="key {getKeyClass(key)}"
					class:special={isSpecial(key)}
					onclick={() => handleClick(key)}
					aria-label={key}
					{disabled}
				>
					{displayLabel(key)}
				</button>
			{/each}
		</div>
	{/each}
</div>

<style>
	.keyboard {
		display: flex;
		flex-direction: column;
		gap: 8px;
		width: 100%;
		max-width: 500px;
		margin: 0 auto;
		padding: 0 4px;
		box-sizing: border-box;
		user-select: none;
	}

	.row {
		display: flex;
		justify-content: center;
		gap: 4px;
	}

	.row:nth-child(2) {
		padding: 0 20px;
	}

	.key {
		height: 43px;
		min-width: 28px;
		padding: 0 6px;
		border: none;
		border-radius: 4px;
		font-family: inherit;
		font-weight: 700;
		font-size: 0.75rem;
		text-transform: uppercase;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1;
		transition: background 0.1s, color 0.1s;
		-webkit-tap-highlight-color: transparent;
	}

	.key:active:not(:disabled) {
		filter: brightness(0.85);
	}

	.key:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.key.default {
		background: var(--color-surface);
		color: var(--color-text);
	}

	:global(.dark) .key.default {
		background: var(--color-surface-dark);
		color: var(--color-text-dark);
	}

	.key.absent {
		background: var(--color-absent);
		color: #ffffff;
	}

	.key.present {
		background: var(--color-present);
		color: #ffffff;
	}

	.key.correct {
		background: var(--color-correct);
		color: #ffffff;
	}

	.key.special {
		flex: 1.5;
		font-size: 0.65rem;
		padding: 0 8px;
		min-width: 42px;
	}
</style>
