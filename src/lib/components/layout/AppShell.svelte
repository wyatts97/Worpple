<script lang="ts">
	import Header from './Header.svelte';

	let { children }: { children: import('svelte').Snippet } = $props();
</script>

<div class="app-shell">
	<Header />
	<main class="main-content">
		{@render children()}
	</main>
</div>

<style>
	.main-content {
		flex: 1;
		padding: 0 16px;
		max-width: 500px;
		margin: 0 auto;
		width: 100%;
		box-sizing: border-box;
	}
</style>
