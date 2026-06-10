// ─── Direction Bitmask Constants (Hexagonal) ───
// Each direction maps to one of 6 bits for a hex tile.
// Angles are: 0°=right, 60°=NE, 120°=NW, 180°=left, 240°=SW, 300°=SE
export const EAST = 1;
export const NORTHEAST = 2;
export const NORTHWEST = 4;
export const WEST = 8;
export const SOUTHWEST = 16;
export const SOUTHEAST = 32;

export const ALL_DIRECTIONS = [EAST, NORTHEAST, NORTHWEST, WEST, SOUTHWEST, SOUTHEAST] as const;

/** Map direction → its opposite direction */
export const OPPOSITE: Record<number, number> = {
	[EAST]: WEST,
	[WEST]: EAST,
	[NORTHEAST]: SOUTHWEST,
	[SOUTHWEST]: NORTHEAST,
	[NORTHWEST]: SOUTHEAST,
	[SOUTHEAST]: NORTHWEST
};

// ─── Hex Cell ───

export interface HexCell {
	index: number;
	row: number;
	col: number;
	cx: number; // SVG center x
	cy: number; // SVG center y
}

// ─── Pipe Tile State ───

export interface PipeTile {
	value: number; // direction bitmask (which directions this pipe can point)
	rotations: number; // number of 60° rotations applied (0–5)
	locked: boolean;
	color: string;
}

// ─── Component (connected group) ───

export interface Component {
	tiles: Set<number>;
	openEnds: Set<number>; // tiles with unconnected outgoing pipes
	color: string;
}

// ─── Puzzle Definition (pre-generated) ───

export interface PuzzleDef {
	id: string;
	gridWidth: number;
	gridHeight: number;
	emptyCells: number[]; // indices of cells that should be empty
	tileValues: number[]; // initial direction bitmask for each non-empty cell (row-major)
	difficulty: 'easy' | 'medium' | 'hard';
}

// ─── Saved Progress ───

export interface PipesProgress {
	rotations: number[];
	locked: boolean[];
	completed: boolean;
}

// ─── Color Palette ───

/** Distinct colors for pipe components (NYT-inspired pastels) */
export const PIPE_COLORS: string[] = [
	'#6aaa64', // green
	'#c9b458', // yellow
	'#59a5d8', // blue
	'#e8734a', // orange
	'#a463c9', // purple
	'#e84a5f', // red
	'#5bc0be', // teal
	'#f4a261' // amber
];
