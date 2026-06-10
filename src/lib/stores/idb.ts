import { openDB, type IDBPDatabase } from 'idb';

// ─── Schema Types ───

export interface GameProgressValue {
	id: string; // `${gameType}_${puzzleId}`
	gameType: string;
	puzzleId: string;
	state: unknown;
	completed: boolean;
	score: number;
	updatedAt: number;
}

export interface StreakValue {
	id: string; // gameType
	current: number;
	max: number;
	lastPlayedDate: string; // YYYY-MM-DD
}

export interface PreferencesValue {
	id: 'global';
	darkMode: boolean;
	hardMode: boolean;
	animationsEnabled: boolean;
	highContrast: boolean;
}

interface DatabaseSchema {
	'game_progress': {
		key: string;
		value: GameProgressValue;
		indexes: { 'by_game_type': string };
	};
	'streaks': {
		key: string;
		value: StreakValue;
	};
	'preferences': {
		key: string;
		value: PreferencesValue;
	};
}

// ─── Database Singleton ───

let dbPromise: Promise<IDBPDatabase<DatabaseSchema>> | null = null;

function getDb(): Promise<IDBPDatabase<DatabaseSchema>> {
	if (!dbPromise) {
		dbPromise = openDB<DatabaseSchema>('worpple', 1, {
			upgrade(db) {
				if (!db.objectStoreNames.contains('game_progress')) {
					const store = db.createObjectStore('game_progress', { keyPath: 'id' });
					store.createIndex('by_game_type', 'gameType');
				}
				if (!db.objectStoreNames.contains('streaks')) {
					db.createObjectStore('streaks', { keyPath: 'id' });
				}
				if (!db.objectStoreNames.contains('preferences')) {
					db.createObjectStore('preferences', { keyPath: 'id' });
				}
			}
		});
	}
	return dbPromise;
}

// ─── Game Progress ───

export async function saveGameProgress(
	gameType: string,
	puzzleId: string,
	state: unknown,
	completed: boolean,
	score = 0
): Promise<void> {
	try {
		const db = await getDb();
		await db.put('game_progress', {
			id: `${gameType}_${puzzleId}`,
			gameType,
			puzzleId,
			state,
			completed,
			score,
			updatedAt: Date.now()
		});
	} catch {
		// IndexedDB unavailable or quota exceeded
	}
}

export async function loadGameProgress(
	gameType: string,
	puzzleId: string
): Promise<GameProgressValue | undefined> {
	try {
		const db = await getDb();
		return await db.get('game_progress', `${gameType}_${puzzleId}`);
	} catch {
		return undefined;
	}
}

export async function getGameProgressByType(gameType: string): Promise<GameProgressValue[]> {
	try {
		const db = await getDb();
		const index = db.transaction('game_progress').store.index('by_game_type');
		return await index.getAll(gameType);
	} catch {
		return [];
	}
}

// ─── Streaks ───

export async function saveStreak(
	gameType: string,
	data: { current: number; max: number; lastPlayedDate: string }
): Promise<void> {
	try {
		const db = await getDb();
		await db.put('streaks', {
			id: gameType,
			...data
		});
	} catch {
		// IndexedDB unavailable
	}
}

export async function loadStreak(gameType: string): Promise<StreakValue | undefined> {
	try {
		const db = await getDb();
		return await db.get('streaks', gameType);
	} catch {
		return undefined;
	}
}

// ─── Preferences ───

export async function savePreferences(
	prefs: Omit<PreferencesValue, 'id'>
): Promise<void> {
	try {
		const db = await getDb();
		await db.put('preferences', {
			id: 'global',
			...prefs
		});
	} catch {
		// IndexedDB unavailable
	}
}

export async function loadPreferences(): Promise<PreferencesValue | undefined> {
	try {
		const db = await getDb();
		return await db.get('preferences', 'global');
	} catch {
		return undefined;
	}
}
