import { HexaGrid } from '$lib/games/pipes/grids/hexagrid';

/**
 * Creates a grid of a specified type
 * @param {string} kind
 * @param {Number} width
 * @param {Number} height
 * @param {boolean} wrap
 * @param {Number[]|undefined} tiles
 * @returns {import('$lib/games/pipes/grids/abstractgrid').AbstractGrid}
 */
export function createGrid(kind, width, height, wrap, tiles = undefined) {
	if (kind === 'hexagonal') {
		return new HexaGrid(width, height, wrap, tiles);
	}
	throw `Unknown grid kind ${kind}`;
}

export const gridInfo = {
	hexagonal: {
		title: 'Hexagonal',
		url: 'hexagonal',
		wrap: true,
		exampleGrid: new HexaGrid(3, 3, false),
		exampleTiles: [32, 34, 32, 50, 56, 8, 12, 20, 16],
		sizes: [5, 7, 10, 15, 20, 30, 40]
	}
};
