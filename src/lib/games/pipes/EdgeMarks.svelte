<script>
	import { get } from 'svelte/store';

	let { i, game, cx = 0, cy = 0 } = $props();

	const tileStore = game.tileStates[i];
	const tile_transform = game.grid.getTileTransformCSS(i) || '';
	const width = game.grid.EDGEMARK_WIDTH;

	let marks = $state([]);
	let reflected = $state([]);

	$effect(() => {
		const marksData = get(tileStore).edgeMarks;
		const vm = [];
		const rm = [];
		marksData.forEach((edgeState, index) => {
			if (edgeState === 'none' || edgeState === 'empty') return;
			const direction = game.grid.EDGEMARK_DIRECTIONS[index];
			const edgeMarkLine = game.grid.getEdgemarkLine(direction, edgeState === 'wall', i);
			const { x1, y1, x2, y2 } = edgeMarkLine;
			const mark = { x1, y1, x2, y2, state: edgeState, direction };
			vm.push(mark);
			if (game.grid.BEND_EDGEMARKS && edgeState === 'conn') {
				const { neighbour } = game.grid.find_neighbour(i, direction);
				const oppositeDirection = game.grid.OPPOSITE.get(direction) || 0;
				const line = game.grid.getEdgemarkLine(oppositeDirection, false, neighbour);
				const oppositeMark = {
					cx: cx + (edgeMarkLine.grid_x2 - line.grid_x2),
					cy: cy + (edgeMarkLine.grid_y2 - line.grid_y2),
					transform: game.grid.getTileTransformCSS(neighbour) || '',
					mark: { x1: line.x1, x2: line.x2, y1: line.y1, y2: line.y2, state: edgeState, direction: oppositeDirection }
				};
				rm.push(oppositeMark);
			}
		});
		marks = vm;
		reflected = rm;
	});
</script>

<g class="edgemarks" style="transform: translate({cx}px,{cy}px) {tile_transform}">
	{#each marks as { x1, y1, x2, y2, state: markState, direction } (direction)}
		<line
			class="mark"
			class:wall={markState === 'wall'}
			{x1}
			{y1}
			{x2}
			{y2}
			stroke="green"
			stroke-width={width}
		/>
	{/each}
</g>

{#each reflected as { cx: rcx, cy: rcy, mark, transform } (mark.direction)}
	<g class="edgemarks" style="transform: translate({rcx}px,{rcy}px) {transform}">
		<line
			class="mark"
			class:wall={mark.state === 'wall'}
			x1={mark.x1}
			y1={mark.y1}
			x2={mark.x2}
			y2={mark.y2}
			stroke="green"
			stroke-width={width}
		/>
	</g>
{/each}

<style>
	.mark {
		transform-origin: center;
		transform-box: fill-box;
		transition: transform 100ms;
	}
	.wall {
		stroke: #ff3e00;
		transform: rotate(90deg);
	}
</style>
