<script>
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';
	import { settings } from '$lib/games/pipes/settings';
	import { controls } from '$lib/games/pipes/controls';
	import Tile from '$lib/games/pipes/Tile.svelte';
	import EdgeMarks from '$lib/games/pipes/EdgeMarks.svelte';
	import { PipesGame } from '$lib/games/pipes/game';
	import { Solver } from '$lib/games/pipes/solver';

	/** @type {import('$lib/games/pipes/grids/abstractgrid').AbstractGrid}*/
	let { grid, tiles = [], savedProgress = undefined, progressStoreName = '', showSolveButton = false, onstart, onsolved, onprogress, onpause } = $props();

	const myProgressName = progressStoreName;

	let svgWidth = $state(500);
	let svgHeight = $state(500);

	let game = new PipesGame(grid, tiles, savedProgress);
	let innerWidth = $state(500);
	let innerHeight = $state(500);

	// Store refs for template auto-subscription
	const viewBox = game.viewBox;
	const visibleTiles = viewBox.visibleTiles;
	const solved = game.solved;
	let svgEl = $state(null);

	const startOver = () => {
		game.startOver();
	};

	const reportPxPerCell = () => {
		return svgWidth / get(viewBox).width;
	};

	function initialResize(w, h) {
		const s = get(settings);
		const maxPixelWidth = w - 18;
		const maxPixelHeight = s.disableZoomPan ? h : Math.round(0.8 * h);

		const maxGridWidth = grid.XMAX - grid.XMIN;
		const maxGridHeight = grid.YMAX - grid.YMIN;

		const wpx = maxPixelWidth / maxGridWidth;
		const hpx = maxPixelHeight / maxGridHeight;
		let ppc = Math.min(100, wpx, hpx);
		if (!s.disableZoomPan) {
			ppc = Math.max(60, ppc);
		}
		if (grid.wrap || s.disableZoomPan) {
			svgWidth = Math.min(maxPixelWidth, ppc * maxGridWidth);
		} else {
			svgWidth = maxPixelWidth;
		}
		svgHeight = Math.min(maxPixelHeight, ppc * maxGridHeight);
		viewBox.update(box => {
			box.width = svgWidth / ppc;
			box.height = svgHeight / ppc;
			if (box.width > maxGridWidth) {
				box.xmin = (grid.XMAX + grid.XMIN - box.width) * 0.5;
			}
			if (box.height > maxGridHeight) {
				box.ymin = (grid.YMAX + grid.YMIN - box.height) * 0.5;
			}
			return box;
		});
	}

	function resize() {
		const s = get(settings);
		if (s.disableZoomPan) return;
		const ppc = svgWidth / get(viewBox).width;
		const maxPixelWidth = innerWidth - 18;
		const maxPixelHeight = Math.round(0.8 * innerHeight);
		if (grid.wrap) {
			svgWidth = Math.min(maxPixelWidth, ppc * get(viewBox).width);
		} else {
			svgWidth = maxPixelWidth;
		}
		svgHeight = Math.min(maxPixelHeight, ppc * get(viewBox).height);
		viewBox.update(box => {
			box.width = svgWidth / ppc;
			box.height = svgHeight / ppc;
			if (box.width > grid.XMAX - grid.XMIN) {
				box.xmin = (grid.XMAX + grid.XMIN - box.width) * 0.5;
			}
			if (box.height > grid.YMAX - grid.YMIN) {
				box.ymin = (grid.YMAX + grid.YMIN - box.height) * 0.5;
			}
			return box;
		});
	}

	onMount(() => {
		game.initializeBoard();
		initialResize(innerWidth, innerHeight);
		onstart?.();
	});

	// Set up custom 'save' event listener from controls action
	$effect(() => {
		if (!svgEl) return;
		const handler = () => save.soon();
		svgEl.addEventListener('save', handler);
		return () => svgEl.removeEventListener('save', handler);
	});

	// Save progress on destroy
	$effect(() => {
		return () => {
			save.clear();
			if (!get(game.solved)) {
				save.now();
				onpause?.();
			}
		};
	});

	function createThrottle(callback, timeout) {
		let throttleTimer = null;
		const throttle = (cb, t) => {
			if (throttleTimer !== null) return;
			throttleTimer = setTimeout(() => {
				cb();
				throttleTimer = null;
			}, t);
		};
		return {
			now: () => callback(),
			soon: () => throttle(callback, timeout),
			clear: () => {
				if (throttleTimer !== null) {
					clearTimeout(throttleTimer);
					throttleTimer = null;
				}
			}
		};
	}

	function saveProgress() {
		if (get(game.solved)) return;
		const tileStates = game.tileStates.map((tile) => {
			const data = tile.data;
			return {
				rotations: data.rotations,
				locked: data.locked,
				color: data.color,
				edgeMarks: data.edgeMarks
			};
		});
		onprogress?.({
			name: myProgressName,
			data: { tiles: tileStates }
		});
	}

	const save = createThrottle(saveProgress, 3000);

	// Dispatch solved
	$effect(() => {
		if ($solved) {
			onsolved?.();
		}
	});

	function unleashTheSolver() {
		const solver = new Solver(tiles, grid);
		const animationSteps = [];
		try {
			for (let result of solver.solve()) {
				const { step } = result;
				if (step.orientation >= 0) {
					animationSteps.push({ index: step.index, orientation: step.orientation });
				}
			}
		} catch (e) {
			// solver error, ignore
		}
		if (animationSteps.length > 0) {
			// Apply solver solution with delay for visual effect
			let delay = 0;
			for (const { index, orientation } of animationSteps) {
				setTimeout(() => {
					game.setTileOrientation(index, orientation);
				}, delay);
				delay += 50;
			}
		}
	}
</script>

<svelte:window bind:innerWidth bind:innerHeight onresize={resize} />

<div class="puzzle animation-{$settings.animationSpeed}" class:solved={$solved}>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<svg
		bind:this={svgEl}
		width={svgWidth}
		height={svgHeight}
		viewBox="{$viewBox.xmin} {$viewBox.ymin} {$viewBox.width} {$viewBox.height}"
		use:controls={game}
		oncontextmenu={(e) => e.preventDefault()}
	>
		{#each $visibleTiles as visibleTile, i (visibleTile.key)}
			<Tile
				i={visibleTile.index}
				solved={$solved}
				{game}
				cx={visibleTile.x}
				cy={visibleTile.y}
				controlMode={$settings.controlMode}
			/>
		{/each}
		{#if !$solved}
			{#each $visibleTiles as visibleTile, i (visibleTile.key)}
				<EdgeMarks i={visibleTile.index} {game} cx={visibleTile.x} cy={visibleTile.y} />
			{/each}
		{/if}
	</svg>
</div>

{#if showSolveButton}
	<div class="solve-button">
		<button onclick={unleashTheSolver}>🧩 Solve it</button>
	</div>
{/if}

<script module>
	/**
	 * @param {import('$lib/games/pipes/grids/abstractgrid').AbstractGrid} grid
	 * @param {Number[]} tiles
	 * @param {import('$lib/games/pipes/game').Progress|undefined} savedProgress
	 */
	export function createPuzzleGame(grid, tiles, savedProgress) {
		return new PipesGame(grid, tiles, savedProgress);
	}
</script>

<style>
	svg {
		display: block;
		margin: auto;
		border: 1px solid var(--secondary-color);
	}
	.solved :global(.inside) {
		animation-name: win-inside;
		animation-duration: 1.5s;
		animation-timing-function: ease-out;
	}
	.solved :global(.sink) {
		animation-name: win-sink;
		animation-duration: 1.5s;
		animation-timing-function: ease-out;
	}
	@keyframes win-sink {
		50% { fill: white; }
	}
	@keyframes win-inside {
		50% { stroke: white; }
	}
	div.solve-button {
		text-align: center;
		padding: 0.5em;
	}
	button {
		color: var(--text-color);
		display: inline-block;
		min-height: 2em;
	}
</style>
