<script>
	import { get } from "svelte/store";

	/** @type {Number} i */
	/** @type {import("./game").PipesGame} game */
	let { i, game, cx = 0, cy = 0, solved = false, controlMode = "rotate_lock" } = $props();

	/** @type {import("./game").StateStore} */
	let state = game.tileStates[i];
	const disconnectStrokeWidthScale = game.disconnectStrokeWidthScale;
	const disconnectStrokeColor = game.disconnectStrokeColor;
	const guideDotRadius = game.grid.GUIDE_DOT_RADIUS;

	let s = $derived.by(() => {
		const val = get(state);
		return {
			tile: val.tile,
			rotations: val.rotations,
			color: val.color,
			locked: val.locked,
			hasDisconnects: val.hasDisconnects,
			isPartOfLoop: val.isPartOfLoop,
			isPartOfIsland: val.isPartOfIsland,
			edgeMarks: val.edgeMarks,
			dws: get(disconnectStrokeWidthScale),
			dsc: get(disconnectStrokeColor)
		};
	});

	let path = $derived(game.grid.getPipesPath(s.tile, i));
	const myDirections = game.grid.getDirections(s.tile, 0, i);
	const isSink = $derived(myDirections.length === 1);
	const [guideX, guideY] = game.grid.getGuideDotPosition(s.tile, i);
	const tile_transform = game.grid.getTileTransformCSS(i) || "";
	const pipeWidth = game.grid.PIPE_WIDTH;

	let bgColor = $derived(s.isPartOfLoop ? (s.locked ? "#f99" : "#fbb") : (s.locked ? "#bbb" : "#ddd"));
	let strokeColor = $derived(s.hasDisconnects ? s.dsc : (s.isPartOfIsland ? "#b55" : "#888"));
	let strokeWidth = $derived(s.hasDisconnects ? game.grid.STROKE_WIDTH * s.dws : game.grid.STROKE_WIDTH);
	let outlineWidth = $derived(2 * strokeWidth + game.grid.PIPE_WIDTH);
	let style = $derived(game.grid.polygon_at(i).style || undefined);
</script>

<g class="tile" transform="translate({cx},{cy})" {style}>
	<path
		d={game.grid.getTilePath(i)}
		stroke="#aaa"
		stroke-width="0.02"
		fill={bgColor}
		style="transform: {tile_transform}"
	/>
	<g
		class="pipe"
		style="transform: {tile_transform} rotate({game.grid.getAngle(s.rotations, i)}rad)"
	>
		<path
			d={path}
			stroke={strokeColor}
			stroke-width={outlineWidth}
			stroke-linejoin="bevel"
			stroke-linecap="round"
		/>
		{#if isSink}
			<circle
				cx="0"
				cy="0"
				r={game.grid.SINK_RADIUS}
				fill={s.color}
				stroke={strokeColor}
				stroke-width={strokeWidth}
				class="sink"
			/>
		{/if}
		<path
			class="inside"
			d={path}
			stroke={s.color}
			stroke-width={pipeWidth}
			stroke-linejoin={game.grid.LINE_JOIN}
			stroke-linecap="round"
		/>
		{#if controlMode === "orient_lock" && !s.locked && !solved}
			<circle
				cx={guideX}
				cy={-guideY}
				fill="orange"
				stroke="white"
				r={guideDotRadius}
				stroke-width="0.01"
			/>
		{/if}
	</g>
</g>

<style>
	:global(.animation-normal) .pipe {
		transition: transform 100ms ease;
	}
	:global(.animation-fast) .pipe {
		transition: transform 30ms ease;
	}
	:global(.animation-instant) .pipe {
		transition: transform 0ms;
	}
</style>
