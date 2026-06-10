<script lang="ts">
	interface Props {
		title: string;
		description: string;
		href: string;
		icon?: string;
		disabled?: boolean;
	}

	let { title, description, href, icon, disabled = false }: Props = $props();
</script>

<a href={disabled ? undefined : href} class="game-card" class:disabled>
	<div class="card-icon">{icon ?? '🧩'}</div>
	<div class="card-body">
		<h3 class="card-title">{title}</h3>
		<p class="card-desc">{description}</p>
	</div>
</a>

<style>
	.game-card {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 16px;
		border-radius: 8px;
		border: 1px solid var(--color-border);
		background: var(--color-bg);
		text-decoration: none;
		color: inherit;
		transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
		cursor: pointer;
	}

	.game-card:hover:not(.disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		border-color: var(--color-text-muted);
	}

	:global(.dark) .game-card {
		border-color: var(--color-border-dark);
		background: var(--color-surface-dark);
	}

	:global(.dark) .game-card:hover:not(.disabled) {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		border-color: var(--color-text-muted);
	}

	.disabled {
		opacity: 0.5;
		cursor: not-allowed;
		pointer-events: none;
	}

	.card-icon {
		font-size: 2rem;
		flex-shrink: 0;
	}

	.card-body {
		flex: 1;
		min-width: 0;
	}

	.card-title {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-weight: 700;
		font-size: 1.125rem;
		margin: 0 0 4px;
	}

	.card-desc {
		font-size: 0.875rem;
		color: var(--color-text-muted);
		margin: 0;
		line-height: 1.4;
	}
</style>
