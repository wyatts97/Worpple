import {
	EAST, NORTHEAST, NORTHWEST, WEST, SOUTHWEST, SOUTHEAST,
	ALL_DIRECTIONS, type HexCell
} from './types';

const Y_STEP = Math.sqrt(3) / 2;

/**
 * RC_DELTA maps direction → [(dr, dc) for even rows, (dr, dc) for odd rows]
 * Odd rows are offset 0.5 to the right in our axial-like coordinate system.
 */
const RC_DELTA: Record<number, [[number, number], [number, number]]> = {
	[EAST]:       [[0, 1],  [0, 1]],
	[NORTHEAST]:  [[-1, 0], [-1, 1]],
	[NORTHWEST]:  [[-1, -1],[-1, 0]],
	[WEST]:       [[0, -1], [0, -1]],
	[SOUTHWEST]:  [[1, -1], [1, 0]],
	[SOUTHEAST]:  [[1, 0],  [1, 1]]
};

export class HexGrid {
	constructor(
		public width: number,
		public height: number,
		public emptyCells: Set<number> = new Set()
	) {}

	get total(): number {
		return this.width * this.height;
	}

	/** Convert flat index to { row, col } */
	indexToRC(index: number): { row: number; col: number } {
		return { row: Math.floor(index / this.width), col: index % this.width };
	}

	/** Convert { row, col } to flat index; returns -1 if out of bounds or empty */
	rcToIndex(row: number, col: number): number {
		if (row < 0 || row >= this.height || col < 0 || col >= this.width) return -1;
		const index = this.width * row + col;
		if (this.emptyCells.has(index)) return -1;
		return index;
	}

	/** Get all non-empty cell positions with SVG coordinates */
	getCells(): HexCell[] {
		const cells: HexCell[] = [];
		for (let r = 0; r < this.height; r++) {
			for (let c = 0; c < this.width; c++) {
				const index = this.rcToIndex(r, c);
				if (index === -1) continue;
				cells.push({
					index,
					row: r,
					col: c,
					cx: c + (r % 2 === 0 ? 0 : 0.5),
					cy: r * Y_STEP
				});
			}
		}
		return cells;
	}

	/** Find neighbor index in a given direction; returns -1 if none */
	findNeighbor(index: number, direction: number): number {
		const { row, col } = this.indexToRC(index);
		const parity = (row % 2) as 0 | 1;
		const [dr, dc] = RC_DELTA[direction][parity];
		return this.rcToIndex(row + dr, col + dc);
	}

	/** Check if a direction from a tile points to a valid non-empty neighbor */
	hasNeighbor(index: number, direction: number): boolean {
		return this.findNeighbor(index, direction) !== -1;
	}

	// ─── Static SVG Helpers ───

	/**
	 * Returns an SVG path for a regular hexagon centered at origin.
	 * @param radius  Distance from center to a vertex (circumradius)
	 */
	static hexPath(radius: number): string {
		const pts: string[] = [];
		for (let i = 0; i < 6; i++) {
			const angle = (Math.PI / 3) * i - Math.PI / 6;
			pts.push(
				`${(radius * Math.cos(angle)).toFixed(4)} ${(radius * Math.sin(angle)).toFixed(4)}`
			);
		}
		return `M ${pts.join(' L ')} Z`;
	}

	/**
	 * Returns an SVG path for pipe lines inside a hex tile.
	 * Each active direction draws a line from center toward that edge.
	 */
	static pipesPath(tileValue: number, pipeLength: number): string {
		let path = 'M 0 0';
		for (let i = 0; i < 6; i++) {
			const dir = ALL_DIRECTIONS[i];
			if ((tileValue & dir) === 0) continue;
			const angle = (Math.PI / 3) * i;
			const dx = pipeLength * Math.cos(angle);
			const dy = pipeLength * Math.sin(angle);
			path += ` l ${dx.toFixed(4)} ${dy.toFixed(4)} L 0 0`;
		}
		return path;
	}

	/**
	 * Rotate a tile value clockwise by `steps` (each step = 60°).
	 * Direction bits cycle: bit-i → bit-(i+steps mod 6)
	 */
	static rotateValue(value: number, steps: number): number {
		steps = ((steps % 6) + 6) % 6;
		if (steps === 0) return value;
		let result = 0;
		for (let i = 0; i < 6; i++) {
			if ((value & ALL_DIRECTIONS[i]) === 0) continue;
			const newIdx = (i + 6 - steps) % 6;
			result |= ALL_DIRECTIONS[newIdx];
		}
		return result;
	}

	/** Get rotation angle in radians */
	static rotationAngle(rotations: number): number {
		return (Math.PI / 3) * rotations;
	}

	/** Get the direction bitmasks a tile currently points to after rotations */
	static getDirections(value: number, rotations: number): number[] {
		const rotated = HexGrid.rotateValue(value, rotations);
		return ALL_DIRECTIONS.filter((d) => (d & rotated) !== 0);
	}
}
