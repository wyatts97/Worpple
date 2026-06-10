<script lang="ts">
	import WordleGame from '$lib/games/wordle/WordleGame.svelte';

	let practice = $state(false);
</script>

<svelte:head>
	<title>Wordle — Worpple</title>
</svelte:head>

<div class="page">
	<WordleGame {practice} />

	<div class="page-actions">
		<button
			class="btn-mode"
			onclick={() => (practice = !practice)}
		>
			{practice ? 'Play Daily Puzzle' : 'Practice Mode'}
		</button>
	</div>
</div>

<style>
	.page {
		padding: 8px 0 24px;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.page-actions {
		margin-top: 8px;
	}

	.btn-mode {
		background: none;
		border: 1px solid var(--color-border);
		border-radius: 6px;
		padding: 8px 16px;
		font-family: inherit;
		font-size: 0.8rem;
		color: var(--color-text-muted);
		cursor: pointer;
		transition: background 0.15s, border-color 0.15s;
	}

	.btn-mode:hover {
		background: var(--color-surface);
		border-color: var(--color-text-muted);
	}

	:global(.dark) .btn-mode {
		border-color: var(--color-border-dark);
	}

	:global(.dark) .btn-mode:hover {
		background: var(--color-surface-dark);
	}
</style>
