import { loadStreak, saveStreak } from './idb';

function createStreakStore() {
	let current = $state(0);
	let max = $state(0);
	let lastPlayedDate = $state<string | null>(null);
	let currentGameType = $state<string>('');

	async function load(gameType: string) {
		currentGameType = gameType;
		const stored = await loadStreak(gameType);
		if (stored) {
			current = stored.current;
			max = stored.max;
			lastPlayedDate = stored.lastPlayedDate;
		} else {
			current = 0;
			max = 0;
			lastPlayedDate = null;
		}
	}

	async function recordPlay(gameType: string) {
		const today = new Date().toISOString().split('T')[0];
		await load(gameType);

		if (lastPlayedDate === today) {
			// Already played today, no streak change
			return;
		}

		const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

		if (lastPlayedDate === yesterday) {
			// Consecutive day: increment streak
			current += 1;
		} else if (lastPlayedDate !== today) {
			// Gap or first play: start new streak
			current = 1;
		}

		if (current > max) {
			max = current;
		}

		lastPlayedDate = today;

		await saveStreak(gameType, {
			current,
			max,
			lastPlayedDate: today
		});
	}

	async function reset(gameType: string) {
		current = 0;
		lastPlayedDate = null;
		await saveStreak(gameType, { current: 0, max, lastPlayedDate: '' });
	}

	return {
		get current() { return current; },
		get max() { return max; },
		get lastPlayedDate() { return lastPlayedDate; },
		load,
		recordPlay,
		reset
	};
}

export const streakStore = createStreakStore();
