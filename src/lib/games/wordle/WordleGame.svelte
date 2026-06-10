<script lang="ts">
	import { onMount } from 'svelte';
	import Board from './Board.svelte';
	import Keyboard from './Keyboard.svelte';
	import {
		GameState,
		Stats,
		LetterStates,
		Settings,
		seededRandomInt,
		modeData,
		words,
		DELAY_INCREMENT,
		COLS,
		ROWS,
		PRAISE,
		failed,
	} from './game-logic';
	import { letterStates, settings } from './stores';
	import { GameMode } from './enums';

	let { practice = false }: { practice?: boolean } = $props();

	// Mode & seed
	let currentMode = $state(GameMode.daily);

	// Derive word based on seed
	let word = $derived(
		words.words[seededRandomInt(0, words.words.length, modeData.modes[currentMode].seed)]
	);

	// Game state (persisted)
	let gameState = $state<GameState>(new GameState(currentMode));
	let stats = $state<Stats>(new Stats(currentMode));

	// Stats store key
	let statsKey = $derived(`wordle-stats-${currentMode}`);
	let stateKey = $derived(`wordle-state-${currentMode}`);

	// UI state
	let showStats = $state(false);
	let showRefresh = $state(false);
	let praizeMsg = $state('');
	let boardComponent: Board | undefined = $state();

	// Load saved state
	function loadState() {
		// Load settings
		const savedSettings = localStorage.getItem('wordle_settings');
		if (savedSettings) {
			settings.set(new Settings(savedSettings));
		}
		settings.subscribe((s) => {
			localStorage.setItem('wordle_settings', JSON.stringify(s));
		});

		const savedState = localStorage.getItem(stateKey);
		if (savedState) {
			const gs = new GameState(currentMode, savedState);
			gameState = gs;
			letterStates.set(new LetterStates(gs.board));
		} else {
			resetGame();
		}

		const savedStats = localStorage.getItem(statsKey);
		if (savedStats) {
			stats = new Stats(savedStats);
		} else {
			stats = new Stats(currentMode);
		}
	}

	function resetGame() {
		const m = modeData.modes[currentMode];
		if (m) {
			m.seed =
				currentMode === GameMode.daily
					? (() => {
							const now = Date.now();
							const offset = new Date().getTimezoneOffset() * 60000;
							return Date.UTC(1970, 0, 1 + Math.floor((now - offset) / 86400000));
						})()
					: m.seed;
		}

		gameState = new GameState(currentMode);
		letterStates.set(new LetterStates());
		showStats = false;
		showRefresh = false;
	}

	// Save state on changes
	$effect(() => {
		if (gameState) {
			localStorage.setItem(stateKey, gameState.toString());
		}
	});

	onMount(() => {
		loadState();
	});

	// Game logic
	let currentGuess = $state('');

	function submitWord() {
		if (gameState.guesses >= ROWS) return;

		if (currentGuess.length !== COLS) {
			boardComponent?.shake(gameState.guesses);
			return;
		}

		if (!words.contains(currentGuess)) {
			boardComponent?.shake(gameState.guesses);
			return;
		}

		if (gameState.guesses > 0) {
			const hm = gameState.checkHardMode();
			if (hm.type !== '⬛') {
				if (hm.type === '🟩') {
					boardComponent?.shake(gameState.guesses);
					return;
				} else if (hm.type === '🟨') {
					boardComponent?.shake(gameState.guesses);
					return;
				}
			}
		}

		// Valid guess - apply to board
		gameState.board.state[gameState.guesses] = gameState.guess(word);
		gameState.guesses++;

		// Update letter states
		const ls = new LetterStates(gameState.board);
		letterStates.set(ls);

		if (gameState.lastWord === word) {
			win();
		} else if (gameState.guesses === ROWS) {
			lose();
		}

		currentGuess = '';
	}

	function win() {
		boardComponent?.bounce(gameState.guesses - 1);
		gameState.active = false;
		setTimeout(() => {
			praizeMsg = PRAISE[gameState.guesses - 1] ?? '';
		}, DELAY_INCREMENT * COLS + DELAY_INCREMENT);
		setTimeout(() => {
			showStats = true;
		}, (DELAY_INCREMENT * ROWS + 800) * 1.4);

		const m = modeData.modes[currentMode];
		if (m) {
			stats.addWin(gameState.guesses, m);
		}
		localStorage.setItem(statsKey, stats.toString());
	}

	function lose() {
		gameState.active = false;
		setTimeout(() => {
			showStats = true;
		}, DELAY_INCREMENT * ROWS + 800);

		const m = modeData.modes[currentMode];
		if (m) {
			stats.addLoss(m);
		}
		localStorage.setItem(statsKey, stats.toString());
	}

	function concede() {
		setTimeout(() => {
			showStats = true;
		}, DELAY_INCREMENT);
		lose();
	}

	function reload() {
		const m = modeData.modes[currentMode];
		if (m) m.historical = false;
		resetGame();
	}

	// Compute stats display
	let statsDisplay = $derived({
		played: stats.played,
		winPercent: stats.played > 0 ? Math.round((1 - stats.guesses.fail / stats.played) * 100) : 0,
		streak: stats.streak ?? 0,
		maxStreak: stats.maxStreak ?? 0,
		distribution: [
			stats.guesses[1],
			stats.guesses[2],
			stats.guesses[3],
			stats.guesses[4],
			stats.guesses[5],
			stats.guesses[6],
		],
	});
</script>

<div class="wordle-game">
	<!-- Header -->
	<div class="header">
		<h1 class="title">Wordle</h1>
		{#if !gameState.active}
			<button class="btn-icon" onclick={reload} title="New game">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
					<path d="M17.65 6.35A7.96 7.96 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/>
				</svg>
			</button>
		{/if}
	</div>

	<!-- Practice mode indicator -->
	{#if practice}
		<div class="mode-badge">Practice</div>
	{/if}

	<!-- Board -->
	<div class="board-area">
		<Board
			bind:this={boardComponent}
			value={gameState.board.words}
			board={gameState.board}
			guesses={gameState.guesses}
		/>
	</div>

	<!-- Keyboard -->
	<Keyboard
			bind:value={currentGuess}
			disabled={!gameState.active}
			onkeystroke={() => {}}
			onsubmitWord={submitWord}
		/>

	<!-- Win/lose message -->
	{#if praizeMsg}
		<div class="praise">{praizeMsg}</div>
	{/if}

	<!-- Stats modal -->
	{#if showStats}
		<div class="overlay" onclick={() => (showStats = false)} onkeydown={() => (showStats = false)}>
			<div class="modal" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
				<button class="close-btn" onclick={() => (showStats = false)}>✕</button>
				<h2>Statistics</h2>
				<div class="stats-row">
					<div class="stat">
						<span class="stat-num">{statsDisplay.played}</span>
						<span class="stat-label">Played</span>
					</div>
					<div class="stat">
						<span class="stat-num">{statsDisplay.winPercent}</span>
						<span class="stat-label">Win %</span>
					</div>
					<div class="stat">
						<span class="stat-num">{statsDisplay.streak}</span>
						<span class="stat-label">Streak</span>
					</div>
					<div class="stat">
						<span class="stat-num">{statsDisplay.maxStreak}</span>
						<span class="stat-label">Max</span>
					</div>
				</div>

				<h2>Guess Distribution</h2>
				<div class="distribution">
					{#each statsDisplay.distribution as count, i}
						{@const total = Math.max(...statsDisplay.distribution, 1)}
						<div class="dist-row">
							<span class="dist-label">{i + 1}</span>
							<div class="dist-bar" style="width: {Math.max(8, (count / total) * 100)}%">
								{count || ''}
							</div>
						</div>
					{/each}
				</div>

				{#if !gameState.active && !failed(gameState)}
					<div class="answer">The word was: <strong>{word.toUpperCase()}</strong></div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Give up button when active -->
	{#if gameState.active}
		<button class="btn-give-up" onclick={concede}>Give Up</button>
	{/if}
</div>

<style>
	.wordle-game {
		display: flex;
		flex-direction: column;
		align-items: center;
		max-width: 500px;
		margin: 0 auto;
		height: 100%;
		gap: 4px;
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		padding: 8px 16px;
		position: relative;
		border-bottom: 1px solid var(--color-border);
	}

	.title {
		font-family: 'Libre Baskerville', Georgia, serif;
		font-weight: 700;
		font-size: 1.5rem;
		margin: 0;
		letter-spacing: 0.05em;
	}

	.btn-icon {
		position: absolute;
		right: 16px;
		background: none;
		border: none;
		cursor: pointer;
		padding: 4px;
		color: var(--color-text);
		opacity: 0.7;
	}

	.btn-icon:hover {
		opacity: 1;
	}

	.mode-badge {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-text-muted);
		padding: 2px 0;
	}

	.board-area {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
	}

	.praise {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-size: 1.5rem;
		font-weight: bold;
		color: var(--color-correct, #6aaa64);
		padding: 12px 24px;
		background: var(--color-bg, #fff);
		border-radius: 8px;
		z-index: 5;
		animation: fadeIn 0.3s ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
		to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
	}

	/* Stats modal */
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 10;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal {
		background: var(--color-bg, #fff);
		border-radius: 8px;
		padding: 24px;
		max-width: 400px;
		width: 90%;
		max-height: 80vh;
		overflow-y: auto;
		position: relative;
	}

	.close-btn {
		position: absolute;
		top: 12px;
		right: 12px;
		background: none;
		border: none;
		font-size: 1.2rem;
		cursor: pointer;
		color: var(--color-text-muted);
	}

	.modal h2 {
		font-family: 'Libre Baskerville', Georgia, serif;
		text-align: center;
		margin: 0 0 16px;
		font-size: 1.1rem;
	}

	.stats-row {
		display: flex;
		justify-content: space-around;
		margin-bottom: 20px;
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
	}

	.stat-num {
		font-size: 1.5rem;
		font-weight: bold;
	}

	.stat-label {
		font-size: 0.7rem;
		text-transform: uppercase;
		color: var(--color-text-muted);
	}

	.distribution {
		margin-bottom: 16px;
	}

	.dist-row {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 4px;
	}

	.dist-label {
		width: 16px;
		font-size: 0.8rem;
		font-weight: bold;
		text-align: right;
	}

	.dist-bar {
		background: var(--color-correct, #6aaa64);
		color: #fff;
		padding: 2px 6px;
		font-size: 0.8rem;
		font-weight: bold;
		border-radius: 2px;
		min-width: 20px;
		text-align: right;
	}

	.answer {
		text-align: center;
		font-size: 0.9rem;
		padding: 8px;
	}

	.btn-give-up {
		background: var(--color-surface, #e0e0e0);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		padding: 6px 16px;
		font-size: 0.8rem;
		cursor: pointer;
		color: var(--color-text);
		margin-bottom: 12px;
	}

	.btn-give-up:hover {
		background: var(--color-absent, #787c7e);
		color: #fff;
	}
</style>
