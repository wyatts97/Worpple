import { HexGrid } from './hexgrid';
import {
	type PipeTile, type Component, type PuzzleDef, type PipesProgress,
	ALL_DIRECTIONS, OPPOSITE, PIPE_COLORS
} from './types';

/**
 * Solver: given a solved tile layout, trace connections via flood-fill.
 * Returns the set of tile indices that are reachable and mutually connected.
 */
function traceComponent(
	grid: HexGrid,
	tiles: PipeTile[],
	startIndex: number
): { tiles: Set<number>; openEnds: Set<number> } {
	const component = new Set<number>();
	const openEnds = new Set<number>();
	const stack = [startIndex];

	while (stack.length > 0) {
		const idx = stack.pop()!;
		if (component.has(idx)) continue;
		component.add(idx);

		const directions = HexGrid.getDirections(tiles[idx].value, tiles[idx].rotations);
		let hasConnection = false;

		for (const dir of directions) {
			const neighbor = grid.findNeighbor(idx, dir);
			if (neighbor === -1) {
				// Points outside the grid → disconnect
				openEnds.add(idx);
				continue;
			}
			const neighborDirs = HexGrid.getDirections(tiles[neighbor].value, tiles[neighbor].rotations);
			// Check mutual connection
			if (neighborDirs.includes(OPPOSITE[dir])) {
				hasConnection = true;
				if (!component.has(neighbor)) {
					stack.push(neighbor);
				}
			} else {
				// Points to neighbor but neighbor doesn't point back → disconnect
				openEnds.add(idx);
			}
		}

		if (!hasConnection && directions.length > 0) {
			// All directions pointed outside or to non-mutual tiles
			openEnds.add(idx);
		}
	}

	return { tiles: component, openEnds };
}

/**
 * Assign a consistent color to each component.
 */
function assignComponentColors(components: Map<number, Component>): void {
	let colorIdx = 0;
	const seen = new Set<Component>();
	for (const component of components.values()) {
		if (seen.has(component)) continue;
		seen.add(component);
		component.color = PIPE_COLORS[colorIdx % PIPE_COLORS.length];
		colorIdx++;
	}
}

/**
 * Core game logic for Pipes.
 * Uses Svelte 5 runes for reactive state.
 */
export class PipesGame {
	readonly grid: HexGrid;

	tiles: PipeTile[] = $state([]);
	solved = $state(false);

	/** Map tile-index → component it belongs to */
	components = $state(new Map<number, Component>());
	connections = new Map<number, Set<number>>();

	/** Index of the first non-empty tile (used as starting point for solve check) */
	private firstTileIndex = 0;

	constructor(puzzle: PuzzleDef) {
		this.grid = new HexGrid(puzzle.gridWidth, puzzle.gridHeight, new Set(puzzle.emptyCells));

		// Find first non-empty index
		while (this.grid.emptyCells.has(this.firstTileIndex)) {
			this.firstTileIndex++;
		}

		// Initialize tiles from puzzle
		this.tiles = puzzle.tileValues.map((value) => ({
			value,
			rotations: 0,
			locked: false,
			color: '#ffffff'
		}));

		this.initializeBoard();
	}

	/** Full board initialization / re-initialization */
	private initializeBoard(): void {
		this.connections.clear();
		this.solved = false;

		for (let i = 0; i < this.tiles.length; i++) {
			if (this.grid.emptyCells.has(i)) continue;
			const dirs = HexGrid.getDirections(this.tiles[i].value, this.tiles[i].rotations);
			const conns = new Set<number>();
			for (const d of dirs) {
				const n = this.grid.findNeighbor(i, d);
				if (n !== -1) conns.add(n);
			}
			this.connections.set(i, conns);
		}

		this.rebuildComponents();
	}

	/** Rebuild component groups from the current connection graph */
	private rebuildComponents(): void {
		const visited = new Set<number>();
		const componentMap = new Map<number, Component>();
		const empty = new Set<number>();

		for (let i = 0; i < this.tiles.length; i++) {
			if (this.grid.emptyCells.has(i)) continue;
			if (visited.has(i)) continue;

			// BFS from this tile through mutual connections
			const compTiles = new Set<number>();
			const compOpenEnds = new Set<number>();
			const queue = [i];

			while (queue.length > 0) {
				const idx = queue.shift()!;
				if (visited.has(idx)) continue;
				visited.add(idx);
				compTiles.add(idx);

				const myConns = this.connections.get(idx) ?? empty;
				const dirs = HexGrid.getDirections(this.tiles[idx].value, this.tiles[idx].rotations);

				let hasMutual = false;
				for (const d of dirs) {
					const n = this.grid.findNeighbor(idx, d);
					if (n === -1) {
						compOpenEnds.add(idx);
						continue;
					}
					const neighborConns = this.connections.get(n) ?? empty;
					if (neighborConns.has(idx) && myConns.has(n)) {
						hasMutual = true;
						if (!visited.has(n)) queue.push(n);
					} else if (myConns.has(n)) {
						// Points to neighbor but no mutual connection
						compOpenEnds.add(idx);
					}
				}

				// If no mutual connections found, it's potentially an open end
				if (!hasMutual && dirs.length > 0) {
					// Check if all connections are outside
					const allOutside = dirs.every((d) => this.grid.findNeighbor(idx, d) === -1);
					if (!allOutside) {
						// Has some connections but none mutual
					}
				}
			}

			const component: Component = {
				tiles: compTiles,
				openEnds: compOpenEnds,
				color: '#ffffff'
			};

			for (const t of compTiles) {
				componentMap.set(t, component);
			}
		}

		assignComponentColors(componentMap);

		// Apply colors to tiles
		for (const [idx, comp] of componentMap) {
			this.tiles[idx].color = comp.color;
		}

		this.components = componentMap;
	}

	/** Rotate tile at index by 60° clockwise. Returns true if rotation occurred. */
	rotateTile(index: number): boolean {
		if (this.solved) return false;
		if (index < 0 || index >= this.tiles.length) return false;
		if (this.grid.emptyCells.has(index)) return false;

		const tile = this.tiles[index];
		if (tile.locked) return false;

		// Advance rotation by 1 step (60°)
		tile.rotations = (tile.rotations + 1) % 6;

		// Rebuild the entire connection graph
		this.initializeBoard();

		// Check win condition
		if (this.checkSolved()) {
			this.solved = true;
		}

		return true;
	}

	/** Lock/unlock a tile */
	toggleLock(index: number): void {
		if (index < 0 || index >= this.tiles.length) return;
		if (this.grid.emptyCells.has(index)) return;
		if (this.solved) return;
		this.tiles[index].locked = !this.tiles[index].locked;
	}

	/**
	 * Verify the puzzle is solved:
	 * 1. All tiles belong to a single component
	 * 2. No open ends (disconnects)
	 * 3. No loops (using DFS that detects cycles)
	 */
	private checkSolved(): boolean {
		const nonEmpty: number[] = [];
		for (let i = 0; i < this.tiles.length; i++) {
			if (!this.grid.emptyCells.has(i)) nonEmpty.push(i);
		}
		if (nonEmpty.length === 0) return false;

		// Check 1: all in one component
		const firstComp = this.components.get(nonEmpty[0]);
		if (!firstComp) return false;
		if (firstComp.tiles.size < nonEmpty.length) return false;

		// Check 2: no open ends
		if (firstComp.openEnds.size > 0) return false;

		// Check 3: no loops — perform DFS from first tile, ensure no revisits
		const visited = new Set<number>();
		const stack: Array<{ idx: number; parent: number }> = [
			{ idx: nonEmpty[0], parent: -1 }
		];

		while (stack.length > 0) {
			const { idx, parent } = stack.pop()!;
			if (visited.has(idx)) {
				// Cycle detected → not a valid solution
				return false;
			}
			visited.add(idx);

			const myDirs = HexGrid.getDirections(this.tiles[idx].value, this.tiles[idx].rotations);
			for (const d of myDirs) {
				const n = this.grid.findNeighbor(idx, d);
				if (n === -1) {
					// Points outside → disconnect
					return false;
				}
				if (n === parent) continue;

				// Check mutual connection
				const neighborDirs = HexGrid.getDirections(this.tiles[n].value, this.tiles[n].rotations);
				if (neighborDirs.includes(OPPOSITE[d])) {
					stack.push({ idx: n, parent: idx });
				} else {
					// Non-mutual connection → disconnect
					return false;
				}
			}
		}

		// Must have visited every non-empty tile
		return visited.size === nonEmpty.length;
	}

	/** Reset all tiles to initial state */
	reset(): void {
		for (const tile of this.tiles) {
			tile.rotations = 0;
			tile.locked = false;
		}
		this.initializeBoard();
	}

	/** Serialize current progress for persistence */
	serialize(): PipesProgress {
		return {
			rotations: this.tiles.map((t) => t.rotations),
			locked: this.tiles.map((t) => t.locked),
			completed: this.solved
		};
	}

	/** Restore progress from saved data */
	deserialize(progress: PipesProgress): void {
		for (let i = 0; i < this.tiles.length; i++) {
			if (i < progress.rotations.length) {
				this.tiles[i].rotations = progress.rotations[i];
			}
			if (i < progress.locked.length) {
				this.tiles[i].locked = progress.locked[i];
			}
		}
		this.initializeBoard();
		if (progress.completed) {
			this.solved = this.checkSolved();
		}
	}
}
