<script lang="ts">
	import { HexGrid } from './hexgrid';

	interface Props {
		value: number;
		rotations: number;
		color: string;
		locked: boolean;
		solved: boolean;
		cx: number;
		cy: number;
		onClick?: () => void;
	}

	let {
		value,
		rotations,
		color,
		locked,
		solved,
		cx,
		cy,
		onClick = () => {}
	}: Props = $props();

	// Hex geometry constants
	const HEX_RADIUS = 0.5;
	const PIPE_RADIUS = 0.35;
	const OUTLINE_WIDTH = 0.12;
	const PIPE_WIDTH = 0.08;

	const hexPath = HexGrid.hexPath(HEX_RADIUS);
	const pipePath = $derived(HexGrid.pipesPath(value, PIPE_RADIUS));
	const rotationDeg = $derived((HexGrid.rotationAngle(rotations) * 180) / Math.PI);

	// Determine tile background and stroke based on state
	const bgColor = $derived(
		solved ? color : locked ? '#bbbbbb' : '#e0e0e0'
	);

	const strokeColor = '#999999';
</script>

<g
	class="pipes-tile"
	class:locked
	class:solved
	transform="translate({cx}, {cy})"
	onclick={onClick}
	role="button"
	tabindex="0"
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') onClick();
	}}
>
	<!-- Hexagon background -->
	<path
		d={hexPath}
		fill={bgColor}
		stroke={strokeColor}
		stroke-width="0.02"
		stroke-linejoin="round"
	/>

	<!-- Rotating pipe group -->
	<g
		class="pipe-group"
		style="transform: rotate({rotationDeg}deg)"
	>
		<!-- Pipe outline (wider stroke for visual depth) -->
		<path
			d={pipePath}
			fill="none"
			stroke="#888888"
			stroke-width={OUTLINE_WIDTH}
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
		<!-- Pipe fill (color) -->
		<path
			d={pipePath}
			fill="none"
			stroke={color}
			stroke-width={PIPE_WIDTH}
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</g>

	<!-- Lock indicator -->
	{#if locked}
		<circle
			cx="0"
			cy="0"
			r="0.05"
			fill="#666666"
			opacity="0.6"
		/>
	{/if}
</g>

<style>
	.pipes-tile {
		cursor: pointer;
		transition: opacity 0.15s;
	}

	.pipes-tile:hover {
		opacity: 0.85;
	}

	.pipes-tile.locked {
		cursor: default;
		opacity: 0.7;
	}

	.pipes-tile:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
		border-radius: 4px;
	}

	:global(.dark) .pipes-tile .pipe-group {
		/* In dark mode, pipes maintain their colors */
	}

	:global(.dark) .pipes-tile path[fill="#e0e0e0"] {
		fill: var(--color-surface-dark);
	}

	.pipe-group {
		transition: transform 0.15s ease;
	}
</style>
