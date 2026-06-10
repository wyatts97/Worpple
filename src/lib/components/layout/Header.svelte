<script lang="ts">
	import { Sun, Moon } from '@lucide/svelte';

	let { streak = 0 }: { streak?: number } = $props();

	let darkMode = $state(false);

	function toggleTheme() {
		darkMode = !darkMode;
		document.documentElement.classList.toggle('dark', darkMode);
	}

	function mounted(node: HTMLElement) {
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		darkMode = prefersDark;
		document.documentElement.classList.toggle('dark', darkMode);
	}
</script>

<header use:mounted class="header">
	<div class="header-inner">
		<span class="logo">Worpple</span>
		<div class="header-actions">
			<button
				class="icon-btn"
				onclick={toggleTheme}
				aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
			>
				{#if darkMode}
					<Sun size={20} />
				{:else}
					<Moon size={20} />
				{/if}
			</button>
		</div>
	</div>
</header>

<style>
	.header {
		height: 48px;
		border-bottom: 1px solid var(--color-border);
		display: flex;
		align-items: center;
		background-color: var(--color-bg);
	}

	:global(.dark) .header {
		border-bottom-color: var(--color-border-dark);
		background-color: var(--color-bg-dark);
	}

	.header-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		max-width: 500px;
		margin: 0 auto;
		padding: 0 16px;
	}

	.logo {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-weight: 700;
		font-size: 1.25rem;
		color: var(--color-text);
		cursor: pointer;
	}

	:global(.dark) .logo {
		color: var(--color-text-dark);
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border: none;
		border-radius: 8px;
		background: transparent;
		color: var(--color-text-muted);
		cursor: pointer;
		transition: background 0.15s, color 0.15s;
	}

	.icon-btn:hover {
		background: var(--color-surface);
		color: var(--color-text);
	}

	:global(.dark) .icon-btn:hover {
		background: var(--color-surface-dark);
		color: var(--color-text-dark);
	}
</style>
