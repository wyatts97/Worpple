<script lang="ts">
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription,
		DialogFooter
	} from '$lib/components/ui/dialog/index.js';

	interface Props {
		open: boolean;
		won: boolean;
		answer: string;
		attempts?: number;
		grid?: string[][];
		onShare?: () => void;
		onPlayAgain?: () => void;
		onClose?: () => void;
	}

	let {
		open,
		won,
		answer,
		attempts = 0,
		grid = [],
		onShare = () => {},
		onPlayAgain = () => {},
		onClose = () => {}
	}: Props = $props();

	let copied = $state(false);

	function generateShareText(): string {
		const header = `Worpple ${attempts}/6`;
		const rows = grid.map((row) =>
			row
				.map((s) => {
					if (s === 'correct') return '🟩';
					if (s === 'present') return '🟨';
					return '⬛';
				})
				.join('')
		);
		return [header, ...rows, '', 'worpple.app'].join('\n');
	}

	async function handleShare() {
		const text = generateShareText();
		try {
			await navigator.clipboard.writeText(text);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch {
			// Fallback: select text
			copied = false;
		}
		onShare();
	}
</script>

<Dialog {open} onOpenChange={(o) => { if (!o) onClose(); }}>
	<DialogContent class="result-content">
		<DialogHeader>
			<DialogTitle class="result-title">
				{won ? 'Congratulations!' : 'Good Try!'}
			</DialogTitle>
		</DialogHeader>

		<DialogDescription class="result-desc">
			{#if won}
				<p class="attempts-text">Solved in {attempts}/6 tries</p>
				{#if grid.length > 0}
					<div class="share-grid">
						{#each grid as row}
							<div class="share-row">
								{#each row as state}
									<span class="share-cell" class:correct={state === 'correct'} class:present={state === 'present'} class:absent={state === 'absent' || state === 'empty' || state === 'tbd'}>
										{state === 'correct' ? '🟩' : state === 'present' ? '🟨' : '⬛'}
									</span>
								{/each}
							</div>
						{/each}
					</div>
				{/if}
			{:else}
				<p class="answer-label">The answer was:</p>
				<p class="answer-text">{answer}</p>
			{/if}
		</DialogDescription>

		<DialogFooter class="result-footer">
			<button class="btn-share" onclick={handleShare}>
				{copied ? 'Copied!' : 'Share'}
			</button>
			<button class="btn-play-again" onclick={onPlayAgain}>
				Play Again
			</button>
		</DialogFooter>
	</DialogContent>
</Dialog>

<style>
	.result-content {
		max-width: 480px;
		background: var(--color-bg);
		border-radius: 8px;
		padding: 24px;
	}

	:global(.dark) .result-content {
		background: var(--color-surface-dark);
	}

	.result-title {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: 1.5rem;
		font-weight: 700;
		text-align: center;
		margin: 0 0 12px;
		color: var(--color-text);
	}

	:global(.dark) .result-title {
		color: var(--color-text-dark);
	}

	.result-desc {
		text-align: center;
		color: var(--color-text);
		font-size: 1rem;
	}

	:global(.dark) .result-desc {
		color: var(--color-text-dark);
	}

	.attempts-text {
		margin: 0 0 16px;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.share-grid {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		margin-bottom: 16px;
	}

	.share-row {
		display: flex;
		gap: 2px;
	}

	.share-cell {
		font-size: 1rem;
		line-height: 1;
	}

	.answer-label {
		margin: 0 0 8px;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}

	.answer-text {
		margin: 0 0 16px;
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: 1.25rem;
		font-weight: 700;
	}

	.result-footer {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-top: 16px;
	}

	.btn-share,
	.btn-play-again {
		width: 100%;
		height: 48px;
		border: none;
		border-radius: 8px;
		font-family: inherit;
		font-weight: 700;
		font-size: 1rem;
		cursor: pointer;
		transition: opacity 0.15s;
	}

	.btn-share:hover,
	.btn-play-again:hover {
		opacity: 0.9;
	}

	.btn-play-again {
		background: var(--color-accent);
		color: #ffffff;
	}

	.btn-share {
		background: var(--color-correct);
		color: #ffffff;
	}
</style>
