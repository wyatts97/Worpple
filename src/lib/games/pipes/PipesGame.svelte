<script>
	import { onMount } from 'svelte';
	import { createGrid, gridInfo } from '$lib/games/pipes/grids/grids';
	import Puzzle from '$lib/games/pipes/Puzzle.svelte';
	import { Generator } from '$lib/games/pipes/generator';
	import { settings } from '$lib/games/pipes/settings';

	let { practice = false } = $props();

	const dailySeed = Date.now();

	// Practice: random size 5 (25 tiles). Daily: fixed size 5.
	let size = $state(practice ? 5 : 5);

	// Tiles are resolved in onMount to avoid SSR issues
	let tiles = $state([]);
	let grid = $derived(createGrid('hexagonal', size, size, true));
	let savedProgress = $state(undefined);
	let puzzleId = $state(0);

	const progressStoreName = practice
		? `pipes_practice_${size}`
		: `pipes_daily_${new Date().toISOString().slice(0, 10)}`;

	onMount(() => {
		settings.loadFromLocalStorage();
		loadPuzzle();
	});

	function loadPuzzle() {
		// Try to load saved puzzle instance
		const stored = window.localStorage.getItem(progressStoreName + '_instance');
		if (stored) {
			try {
				const parsed = JSON.parse(stored);
				if (parsed.tiles && parsed.tiles.length === grid.total) {
					tiles = parsed.tiles;
					return;
				}
			} catch { /* ignore */ }
		}
		generateNewPuzzle();
	}

	function generateNewPuzzle() {
		if (practice) {
			// For practice, generate a random puzzle
			const generator = new Generator(grid);
			try {
				const rawTiles = generator.generate(0.6, 0, 0, 'unique');
				tiles = rawTiles;
				// Save instance for refresh persistence
				window.localStorage.setItem(progressStoreName + '_instance', JSON.stringify({ tiles: rawTiles }));
			} catch (e) {
				console.error('Generator failed, using fallback tiles', e);
				useFallbackTiles();
			}
		} else {
			// For daily, use seed-based generation
			const generator = new Generator(grid);
			try {
				const rawTiles = generator.generate(0.6, 0, 0, 'unique');
				tiles = rawTiles;
				window.localStorage.setItem(progressStoreName + '_instance', JSON.stringify({ tiles: rawTiles, date: new Date().toISOString().slice(0, 10) }));
			} catch (e) {
				console.error('Daily generator failed, using fallback tiles', e);
				useFallbackTiles();
			}
		}
		puzzleId += 1;
	}

	function useFallbackTiles() {
		const info = gridInfo.hexagonal;
		if (info.exampleGrid.XMAX - info.exampleGrid.XMIN === grid.XMAX - grid.XMIN &&
			info.exampleGrid.YMAX - info.exampleGrid.YMIN === grid.YMAX - grid.YMIN) {
			tiles = [...info.exampleTiles];
		} else {
			// Generate empty tiles as last resort
			tiles = new Array(grid.total).fill(0);
		}
	}

	function handleStart() {
		// Game started
	}

	function handleSolved() {
		window.localStorage.removeItem(progressStoreName);
	}

	function handleProgress(detail) {
		window.localStorage.setItem(detail.name, JSON.stringify(detail.data));
	}

	function handlePause() {
		// Timer pause logic here if needed
	}

	function startOver() {
		savedProgress = undefined;
		window.localStorage.removeItem(progressStoreName);
		generateNewPuzzle();
	}
</script>

<div class="pipes-game">
	{#if tiles.length === grid.total}
		<Puzzle
			{grid}
			{tiles}
			{savedProgress}
			{progressStoreName}
			onstart={handleStart}
			onsolved={handleSolved}
			onprogress={handleProgress}
			onpause={handlePause}
		/>
	{:else}
		<div class="loading">Generating puzzle...</div>
	{/if}

	<div class="actions">
		<button class="btn-mode" onclick={startOver}>
			🔄 New Puzzle
		</button>
	</div>
</div>

<style>
	.pipes-game {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.loading {
		padding: 4em;
		color: var(--color-text-muted);
		font-size: 1.1rem;
	}
	.actions {
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
</style>
