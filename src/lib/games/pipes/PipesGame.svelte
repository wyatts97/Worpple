<script lang="ts">
	import { HexGrid } from './hexgrid';
	import { PipesGame } from './game.svelte';
	import { getDailyPuzzle, getPracticePuzzle } from './puzzles';
	import PipesTile from './PipesTile.svelte';
	import ResultModal from '$lib/components/game/ResultModal.svelte';
	import { createGameStateStore } from '$lib/stores/gameState.svelte';

	interface Props {
		practice?: boolean;
	}

	let { practice = false }: Props = $props();

	// ─── Game State ───
	let puzzle = $state(practice ? getPracticePuzzle() : getDailyPuzzle());
	let game = $state(new PipesGame(puzzle));
	let cells = $state(game.grid.getCells());
	let moveCount = $state(0);
	let showResult = $state(false);
	let won = $state(false);
	let timer = $state(0);
	let timerInterval: ReturnType<typeof setInterval> | null = null;

	// ─── SVG Bounds (derived from cells) ───
	const gridWidth = $derived.by(() => {
		let maxX = 0;
		let maxY = 0;
		for (const cell of cells) {
			if (cell.cx > maxX) maxX = cell.cx;
			if (cell.cy > maxY) maxY = cell.cy;
		}
		return (maxX + 1.5) * 100;
	});
	const gridHeight = $derived.by(() => {
		let maxX = 0;
		let maxY = 0;
		for (const cell of cells) {
			if (cell.cx > maxX) maxX = cell.cx;
			if (cell.cy > maxY) maxY = cell.cy;
		}
		return (maxY + 1.5) * 100;
	});
	const VIEWBOX = $derived(`${-75} ${-75} ${gridWidth || 600} ${gridHeight || 500}`);

	// ─── Persistence (for daily puzzle) ───
	let store: ReturnType<typeof createGameStateStore<{ rotations: number[]; locked: boolean[] }>> | null = null;
	let loaded = $state(false);

	// Initialize store only for daily puzzles
	$effect(() => {
		if (practice || store) return;
		store = createGameStateStore<{ rotations: number[]; locked: boolean[] }>('pipes', puzzle.id);

		// Auto-save when tiles change
		$effect(() => {
			if (!loaded) return;
			const saveState = game.serialize();
			if (store) {
				store.state = { rotations: saveState.rotations, locked: saveState.locked };
				store.completed = saveState.completed;
			}
		});

		// Load saved state
		(async () => {
			if (!store) return;
			await store.load();
			if (store.state && store.state.rotations) {
				game.deserialize({
					rotations: store.state.rotations,
					locked: store.state.locked,
					completed: store.completed
				});
				if (game.solved) {
					won = true;
					showResult = true;
				}
			}
			loaded = true;
		})();
	});

	// ─── Timer ───
	$effect(() => {
		if (!game.solved) {
			if (!timerInterval) {
				timerInterval = setInterval(() => {
					timer += 1;
				}, 1000);
			}
		} else {
			if (timerInterval) {
				clearInterval(timerInterval);
				timerInterval = null;
			}
		}
		return () => {
			if (timerInterval) clearInterval(timerInterval);
		};
	});

	// ─── Handlers ───
	function handleTileClick(index: number) {
		if (game.solved) return;
		const changed = game.rotateTile(index);
		if (changed) {
			moveCount += 1;
			if (game.solved) {
				won = true;
				showResult = true;
			}
		}
	}

	function handlePlayAgain() {
		puzzle = practice ? getPracticePuzzle() : getDailyPuzzle();
		game = new PipesGame(puzzle);
		cells = game.grid.getCells();
		moveCount = 0;
		showResult = false;
		won = false;
		timer = 0;
		if (!practice && store) {
			store.reset({ rotations: [], locked: [] });
		}
		computeGridBounds();
	}

	function handleClose() {
		showResult = false;
	}

	function formatTime(seconds: number): string {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m}:${s.toString().padStart(2, '0')}`;
	}
</script>

<div class="pipes-game">
	<!-- Header -->
	<div class="game-header">
		<h2 class="game-title">
			{practice ? 'Practice Pipes' : 'Daily Pipes'}
		</h2>
		<div class="game-stats">
			<span class="stat">
				<span class="stat-label">Moves</span>
				<span class="stat-value">{moveCount}</span>
			</span>
			<span class="stat">
				<span class="stat-label">Time</span>
				<span class="stat-value">{formatTime(timer)}</span>
			</span>
			{#if !practice}
				<button class="btn-reset" onclick={() => { game.reset(); moveCount = 0; }} title="Reset puzzle">
					↺
				</button>
			{/if}
		</div>
	</div>

	<!-- Grid Area -->
	<div class="grid-container">
		{#if cells.length > 0}
			<svg
				width="100%"
				height="100%"
				viewBox={VIEWBOX}
				preserveAspectRatio="xMidYMid meet"
				class="pipes-svg"
			>
				<!-- Background grid hint -->
				{#each cells as cell}
					<path
						d={HexGrid.hexPath(0.5)}
						fill="#f5f5f5"
						stroke="#e0e0e0"
						stroke-width="0.01"
						transform="translate({cell.cx}, {cell.cy})"
					/>
				{/each}

				<!-- Active tiles -->
				{#each cells as cell}
					{@const tile = game.tiles[cell.index]}
					{#if tile && tile.value > 0}
						<PipesTile
							value={tile.value}
							rotations={tile.rotations}
							color={tile.color}
							locked={tile.locked}
							solved={game.solved}
							cx={cell.cx}
							cy={cell.cy}
							onClick={() => handleTileClick(cell.index)}
						/>
					{/if}
				{/each}
			</svg>
		{:else}
			<div class="empty-state">No puzzle available</div>
		{/if}
	</div>

	<!-- Instructions -->
	<p class="instructions">
		Tap a tile to rotate it. Connect all pipes into one flowing network.
	</p>

	<!-- Result Modal -->
	<ResultModal
		open={showResult}
		won={won}
		answer="Pipes complete!"
		attempts={moveCount}
		onPlayAgain={handlePlayAgain}
		onClose={handleClose}
	/>
</div>

<style>
	.pipes-game {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		padding: 16px 0;
	}

	.game-header {
		width: 100%;
		text-align: center;
	}

	.game-title {
		margin: 0 0 8px;
		font-family: 'Libre Baskerville', Georgia, serif;
		font-size: 1.25rem;
	}

	.game-stats {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 20px;
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
	}

	.stat-label {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted);
	}

	.stat-value {
		font-size: 1.1rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}

	.btn-reset {
		background: none;
		border: 1px solid var(--color-border);
		border-radius: 6px;
		font-size: 1.2rem;
		padding: 4px 10px;
		cursor: pointer;
		color: var(--color-text-muted);
		transition: background 0.15s;
		line-height: 1;
	}

	.btn-reset:hover {
		background: var(--color-surface);
	}

	:global(.dark) .btn-reset {
		border-color: var(--color-border-dark);
	}

	:global(.dark) .btn-reset:hover {
		background: var(--color-surface-dark);
	}

	.grid-container {
		width: 100%;
		max-width: 460px;
		aspect-ratio: 1.1;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.pipes-svg {
		width: 100%;
		height: 100%;
	}

	:global(.dark) .pipes-svg path[fill="#f5f5f5"] {
		fill: var(--color-surface-dark);
	}

	:global(.dark) .pipes-svg path[stroke="#e0e0e0"] {
		stroke: var(--color-border-dark);
	}

	.empty-state {
		color: var(--color-text-muted);
		font-size: 0.875rem;
	}

	.instructions {
		font-size: 0.8rem;
		color: var(--color-text-muted);
		text-align: center;
		margin: 0;
		max-width: 300px;
	}
</style>
