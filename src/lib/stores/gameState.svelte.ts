import { saveGameProgress, loadGameProgress } from './idb';

export function createGameStateStore<T extends Record<string, unknown>>(
	gameType: string,
	puzzleId: string
) {
	let state = $state<T>({} as T);
	let completed = $state(false);
	let score = $state(0);
	let loaded = $state(false);

	let saveTimeout: ReturnType<typeof setTimeout> | null = null;

	function scheduleSave() {
		if (saveTimeout) clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => {
			saveGameProgress(gameType, puzzleId, state, completed, score);
		}, 300);
	}

	async function load() {
		const stored = await loadGameProgress(gameType, puzzleId);
		if (stored) {
			state = stored.state as T;
			completed = stored.completed;
			score = stored.score;
		}
		loaded = true;
	}

	async function save() {
		await saveGameProgress(gameType, puzzleId, state, completed, score);
	}

	function reset(initialState: T) {
		state = initialState;
		completed = false;
		score = 0;
	}

	$effect(() => {
		// Auto-save when state changes
		const _s = state;
		const _c = completed;
		const _sc = score;
		if (loaded) {
			scheduleSave();
		}
	});

	return {
		get state() { return state; },
		set state(v: T) { state = v; },
		get completed() { return completed; },
		set completed(v: boolean) { completed = v; },
		get score() { return score; },
		set score(v: number) { score = v; },
		get loaded() { return loaded; },
		load,
		save,
		reset
	};
}
