import { HexGrid } from './hexgrid';
import { ALL_DIRECTIONS, OPPOSITE, type PuzzleDef } from './types';

/**
 * Generate a solvable pipes puzzle using a random spanning tree.
 *
 * Algorithm:
 * 1. Build a spanning tree over the non-empty cells (Prim-like with random picks)
 * 2. For each cell, set tile value = bitmask of directions to tree neighbors
 * 3. Randomly rotate each tile to create the puzzle
 * 4. Store un-rotated values as the solution state
 */
function generatePuzzle(
	grid: HexGrid,
	seed: number
): { tileValues: number[]; solutionRotations: number[] } {
	const cells = grid.getCells();
	const total = grid.total;

	// Seeded PRNG (simple mulberry32)
	let s = seed | 0;
	function next(): number {
		s = (s + 0x6d2b79f5) | 0;
		let t = Math.imul(s ^ (s >>> 15), 1 | s);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	}

	// ── Step 1: Build spanning tree ──
	const visited = new Set<number>();
	const parent = new Map<number, number>();
	const children = new Map<number, number[]>();

	if (cells.length === 0) return { tileValues: [], solutionRotations: [] };

	const startIdx = cells[0].index;
	visited.add(startIdx);
	children.set(startIdx, []);

	// Frontier: edges { from, to, direction }
	type Edge = { from: number; to: number; dir: number };
	const frontier: Edge[] = [];

	for (const dir of ALL_DIRECTIONS) {
		const n = grid.findNeighbor(startIdx, dir);
		if (n !== -1) {
			frontier.push({ from: startIdx, to: n, dir });
		}
	}

	while (visited.size < cells.length && frontier.length > 0) {
		// Pick a random frontier edge
		const idx = Math.floor(next() * frontier.length);
		const edge = frontier[idx];
		frontier.splice(idx, 1);

		if (visited.has(edge.to)) continue;

		visited.add(edge.to);
		parent.set(edge.to, edge.from);
		const childList = children.get(edge.from) || [];
		childList.push(edge.to);
		children.set(edge.from, childList);
		if (!children.has(edge.to)) children.set(edge.to, []);

		// Add new frontier edges from this cell
		for (const dir of ALL_DIRECTIONS) {
			const n = grid.findNeighbor(edge.to, dir);
			if (n !== -1 && !visited.has(n)) {
				frontier.push({ from: edge.to, to: n, dir });
			}
		}
	}

	// ── Step 2: Compute tile values from tree connections ──
	const tileValues = new Array(total).fill(0);
	const solutionRotations = new Array(total).fill(0);

	for (const cell of cells) {
		const idx = cell.index;
		let value = 0;

		// Connection to parent
		if (parent.has(idx)) {
			const p = parent.get(idx)!;
			// Find which direction points from idx to p
			const dirToParent = findDirection(grid, idx, p);
			if (dirToParent !== -1) value |= dirToParent;
		}

		// Connections to children
		const childList = children.get(idx) || [];
		for (const child of childList) {
			const dir = findDirection(grid, idx, child);
			if (dir !== -1) value |= dir;
		}

		tileValues[idx] = value;
	}

	// ── Step 3: Randomly rotate each tile (skip dead-ends with 1 direction — they look the same) ──
	for (const cell of cells) {
		const idx = cell.index;
		const val = tileValues[idx];
		const dirCount = countBits(val);

		// For 1-direction tiles (dead ends), rotation doesn't change appearance
		// For 6-direction tiles (full connection), rotation doesn't change either
		if (dirCount <= 1 || dirCount >= 6) {
			solutionRotations[idx] = 0;
			continue;
		}

		// Rotation should result in a different-looking state
		let attempts = 0;
		let bestRot = 0;
		let bestDist = 0;

		while (attempts < 10) {
			const rot = Math.floor(next() * 5 + 1); // 1..5
			const rotatedVal = HexGrid.rotateValue(val, rot);
			// A good rotation is one where the rotated value ≠ original
			if (rotatedVal !== val) {
				const dist = countBits(rotatedVal ^ val); // hamming-ish distance
				if (dist > bestDist) {
					bestDist = dist;
					bestRot = rot;
				}
			}
			attempts++;
		}

		solutionRotations[idx] = bestRot > 0 ? bestRot : 0;
	}

	return { tileValues, solutionRotations };
}

/** Find the direction from `from` to `to` in the grid */
function findDirection(grid: HexGrid, from: number, to: number): number {
	for (const dir of ALL_DIRECTIONS) {
		if (grid.findNeighbor(from, dir) === to) return dir;
	}
	return -1;
}

/** Count bits set in a number (population count) */
function countBits(n: number): number {
	let count = 0;
	while (n) {
		count += n & 1;
		n >>>= 1;
	}
	return count;
}

// ─── Hexagon Shape Definitions ───

/**
 * Compute empty cells for a hexagon-shaped grid.
 * Creates a hexagon of hexagons with the given cell radius.
 */
function hexagonShape(width: number, height: number): number[] {
	const emptyCells: number[] = [];
	const middleRow = Math.floor(height / 2);

	// Use the same algorithm as hexapipes: erase cells outward from middle row
	// For each row from center: erase from both edges inward

	const eraseEdge = (row: number, columns: number[]) => {
		for (const col of columns) {
			if (col >= 0 && col < width) {
				emptyCells.push(row * width + col);
			}
		}
	};

	// Helper: find neighbor going in a direction (like hexapipes)
	const go = (index: number, dir: number): number => {
		const r = Math.floor(index / width);
		const c = index % width;
		const parity = (r % 2) as 0 | 1;
		// RC_DELTA lookup
		const deltas: Record<number, [[number, number], [number, number]]> = {
			[1]: [[0, 1], [0, 1]],      // EAST
			[2]: [[-1, 0], [-1, 1]],    // NORTHEAST
			[4]: [[-1, -1], [-1, 0]],   // NORTHWEST
			[8]: [[0, -1], [0, -1]],    // WEST
			[16]: [[1, -1], [1, 0]],    // SOUTHWEST
			[32]: [[1, 0], [1, 1]],     // SOUTHEAST
		};
		const [dr, dc] = deltas[dir][parity];
		const nr = r + dr;
		const nc = c + dc;
		if (nr < 0 || nr >= height || nc < 0 || nc >= width) return -1;
		return nr * width + nc;
	};

	const eraseLine = (start: number, dir: number) => {
		let cell = start;
		while (true) {
			const n = go(cell, dir);
			if (n === -1) break;
			emptyCells.push(n);
			cell = n;
		}
	};

	// From the middle row left edge, erase going NORTHEAST and SOUTHEAST
	const leftCell = middleRow * width;
	const rightCell = middleRow * width + width - 1;

	const dirs: Array<[number, number, number]> = [
		[leftCell, 2, 8],   // NORTHEAST, erase WEST
		[rightCell, 4, 1],  // NORTHWEST, erase EAST
		[leftCell, 32, 8],  // SOUTHEAST, erase WEST
		[rightCell, 16, 1], // SOUTHWEST, erase EAST
	];

	for (const [start, shiftDir, eraseDir] of dirs) {
		let cell = start;
		for (let delta = 1; delta <= middleRow; delta++) {
			const next = go(cell, shiftDir);
			if (next === -1) break;
			cell = next;
			eraseLine(cell, eraseDir);
		}

		// Also handle the boundary adjust
		if (start === leftCell && shiftDir === 2) {
			eraseLine(start, 8); // erase west from middle left
		}
	}

	return [...new Set(emptyCells)];
}

// ─── Generated Puzzle Access ───

const SHAPES: Array<{ width: number; height: number }> = [
	{ width: 5, height: 5 }, // 19 tiles — medium
];

let _dailyPuzzle: PuzzleDef | null = null;
let _dailyDate = '';

/**
 * Get the daily puzzle (changes based on date).
 */
export function getDailyPuzzle(): PuzzleDef {
	const today = new Date();
	const dateStr = today.toISOString().slice(0, 10); // YYYY-MM-DD

	if (_dailyPuzzle && _dailyDate === dateStr) return _dailyPuzzle;

	// Use date as seed
	const seed = dateStr.split('-').reduce((acc, s) => acc + parseInt(s, 10), 0);

	const shape = SHAPES[0];
	const grid = new HexGrid(shape.width, shape.height);

	// Compute hexagon empty cells
	const emptyRaw = hexagonShape(shape.width, shape.height);
	const emptySet = new Set(emptyRaw);
	grid.emptyCells = emptySet;

	const { tileValues, solutionRotations } = generatePuzzle(grid, seed);

	// Apply solution rotations to create the puzzle (rotated state = starting state)
	const puzzleValues = tileValues.map((val, i) => {
		if (emptySet.has(i) || val === 0) return 0;
		return HexGrid.rotateValue(val, solutionRotations[i]);
	});

	_dailyPuzzle = {
		id: `pipes-${dateStr}`,
		gridWidth: shape.width,
		gridHeight: shape.height,
		emptyCells: emptyRaw,
		tileValues: puzzleValues,
		difficulty: 'medium'
	};
	_dailyDate = dateStr;

	return _dailyPuzzle;
}

/**
 * Get a practice puzzle (uses a different seed so it's not the daily one).
 */
export function getPracticePuzzle(): PuzzleDef {
	const seed = Date.now();
	const shape = SHAPES[0];
	const grid = new HexGrid(shape.width, shape.height);

	const emptyRaw = hexagonShape(shape.width, shape.height);
	const emptySet = new Set(emptyRaw);
	grid.emptyCells = emptySet;

	const { tileValues, solutionRotations } = generatePuzzle(grid, seed);

	const puzzleValues = tileValues.map((val, i) => {
		if (emptySet.has(i) || val === 0) return 0;
		return HexGrid.rotateValue(val, solutionRotations[i]);
	});

	return {
		id: `pipes-practice-${seed}`,
		gridWidth: shape.width,
		gridHeight: shape.height,
		emptyCells: emptyRaw,
		tileValues: puzzleValues,
		difficulty: 'medium'
	};
}
