<script lang="ts">
	import GameCard from '$lib/components/game/GameCard.svelte';

	const games = [
		{
			title: 'Wordle',
			description: 'Guess the 5-letter word in 6 tries',
			href: '/wordle',
			icon: '🟩',
			disabled: true
		},
		{
			title: 'Connections',
			description: 'Find the hidden categories',
			href: '/connections',
			icon: '🟨',
			disabled: true
		},
		{
			title: 'Spelling Bee',
			description: 'Make words from 7 letters',
			href: '/spelling-bee',
			icon: '🐝',
			disabled: true
		},
		{
			title: 'Mini Crossword',
			description: 'A quick 5×5 crossword',
			href: '/mini',
			icon: '✏️',
			disabled: true
		},
		{
			title: 'Strands',
			description: 'Find words in the letter grid',
			href: '/strands',
			icon: '🔗',
			disabled: true
		},
		{
			title: 'Pipes',
			description: 'Connect the pipes to flow',
			href: '/pipes',
			icon: '🔧'
		}
	];
</script>

<div class="hub">
	<h1 class="hub-title">Daily Puzzles</h1>
	<p class="hub-subtitle">New puzzles every day</p>

	<div class="game-grid">
		{#each games as game}
			<GameCard {...game} />
		{/each}
	</div>
</div>

<style>
	.hub {
		padding: 24px 0;
	}

	.hub-title {
		margin: 0 0 4px;
		font-family: 'Libre Baskerville', Georgia, serif;
		font-weight: 700;
		font-size: 1.5rem;
	}

	.hub-subtitle {
		margin: 0 0 24px;
		color: var(--color-text-muted);
		font-size: 0.875rem;
	}

	.game-grid {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
</style>
