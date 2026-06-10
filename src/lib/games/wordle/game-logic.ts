import seedRandom from 'seedrandom';
import { GameMode, ms } from './enums';
import type { LetterState, GameBoard, HardModeData, Mode } from './types';
import wordData from './words';

export const ROWS = 6;
export const COLS = 5;
export const DELAY_INCREMENT = 200;

export const PRAISE = ['Genius', 'Magnificent', 'Impressive', 'Splendid', 'Great', 'Phew'];

export const keys = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

/** seeded random number generator */
export function seededRandomInt(min: number, max: number, seed: number): number {
	const rng = seedRandom(`${seed}`);
	return Math.floor(min + (max - min) * rng());
}

/**
 * Return a deterministic number based on the given mode and current or given time.
 */
export function newSeed(mode: GameMode, time?: number): number {
	const now = time ?? Date.now();
	switch (mode) {
		case GameMode.daily:
			return Date.UTC(1970, 0, 1 + Math.floor((now - new Date().getTimezoneOffset() * ms.MINUTE) / ms.DAY));
		case GameMode.hourly:
			return now - (now % ms.HOUR);
		case GameMode.infinite:
			return now - (now % ms.SECOND);
	}
}

export const modeData: {
	default: GameMode;
	modes: Mode[];
} = {
	default: GameMode.daily,
	modes: [
		{
			name: 'Daily',
			unit: ms.DAY,
			start: 1642370400000,
			seed: newSeed(GameMode.daily),
			historical: false,
			streak: true,
			useTimeZone: true,
		},
		{
			name: 'Hourly',
			unit: ms.HOUR,
			start: 1642528800000,
			seed: newSeed(GameMode.hourly),
			historical: false,
			icon: 'm50,7h100v33c0,40 -35,40 -35,60c0,20 35,20 35,60v33h-100v-33c0,-40 35,-40 35,-60c0,-20 -35,-20 -35,-60z',
			streak: true,
		},
		{
			name: 'Infinite',
			unit: ms.SECOND,
			start: 1642428600000,
			seed: newSeed(GameMode.infinite),
			historical: false,
			icon: 'm7,100c0,-50 68,-50 93,0c25,50 93,50 93,0c0,-50 -68,-50 -93,0c-25,50 -93,50 -93,0z',
		},
	],
};

/**
 * Return the word number for the given mode at the time that that mode's seed was set.
 */
export function getWordNumber(mode: GameMode, current?: boolean): number {
	const seed = current ? newSeed(mode) : modeData.modes[mode].seed;
	return Math.round((seed - modeData.modes[mode].start) / modeData.modes[mode].unit) + 1;
}

export function contractNum(n: number): string {
	switch (n % 10) {
		case 1: return `${n}st`;
		case 2: return `${n}nd`;
		case 3: return `${n}rd`;
		default: return `${n}th`;
	}
}

export function timeRemaining(m: Mode): number {
	if (m.useTimeZone) {
		return m.unit - (Date.now() - (m.seed + new Date().getTimezoneOffset() * ms.MINUTE));
	}
	return m.unit - (Date.now() - m.seed);
}

// ──────────────────────────────────────────
// Storable base
// ──────────────────────────────────────────

abstract class Storable {
	toString(): string {
		return JSON.stringify(this);
	}
}

// ──────────────────────────────────────────
// LetterStates
// ──────────────────────────────────────────

export class LetterStates {
	private _map: Record<string, LetterState>;

	constructor(board?: GameBoard) {
		this._map = {};
		// Initialize all letters to default
		for (const c of 'abcdefghijklmnopqrstuvwxyz') {
			this._map[c] = '🔳';
		}

		if (board) {
			for (let row = 0; row < ROWS; ++row) {
				for (let col = 0; col < board.words[row].length; ++col) {
					const char = board.words[row][col];
					const st = board.state[row][col];
					if (this._map[char] === '🔳' || st === '🟩') {
						this._map[char] = st;
					}
				}
			}
		}
	}

	get(letter: string): LetterState {
		return this._map[letter] ?? '🔳';
	}

	update(state: LetterState[], word: string): void {
		state.forEach((e, i) => {
			const ls = this._map[word[i]];
			if (ls === '🔳' || e === '🟩') {
				this._map[word[i]] = e;
			}
		});
	}
}

// ──────────────────────────────────────────
// Settings
// ──────────────────────────────────────────

export class Settings extends Storable {
	hard: boolean[];
	dark: boolean;
	colorblind: boolean;
	tutorial: 0 | 1 | 2 | 3;

	constructor(settings?: string) {
		super();
		this.hard = new Array(modeData.modes.length).fill(false);
		this.dark = true;
		this.colorblind = false;
		this.tutorial = 3;

		if (settings) {
			try {
				const parsed = JSON.parse(settings) as Settings;
				this.hard = parsed.hard;
				this.dark = parsed.dark;
				this.colorblind = parsed.colorblind;
				this.tutorial = parsed.tutorial;
			} catch {
				// use defaults
			}
		}
	}
}

// ──────────────────────────────────────────
// Stats
// ──────────────────────────────────────────

export class Stats extends Storable {
	played: number;
	lastGame: number;
	guesses: Record<1 | 2 | 3 | 4 | 5 | 6 | 'fail', number>;
	streak: number;
	maxStreak: number;
	#hasStreak: boolean;
	#mode: GameMode;

	constructor(param: string | GameMode) {
		super();
		this.played = 0;
		this.lastGame = 0;
		this.guesses = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, fail: 0 };
		this.streak = 0;
		this.maxStreak = 0;
		this.#hasStreak = false;
		this.#mode = typeof param === 'string' ? 0 : param;

		if (typeof param === 'string') {
			this.parse(param);
		} else if (modeData.modes[param]?.streak) {
			this.streak = 0;
			this.maxStreak = 0;
			this.#hasStreak = true;
		}
	}

	get hasStreak(): boolean { return this.#hasStreak; }

	addWin(guesses: number, mode: Mode): void {
		this.guesses[guesses as keyof typeof this.guesses] = (this.guesses[guesses as keyof typeof this.guesses] ?? 0) + 1;
		this.played++;
		if (this.#hasStreak) {
			this.streak = mode.seed - this.lastGame > mode.unit ? 1 : this.streak + 1;
			this.maxStreak = Math.max(this.streak, this.maxStreak);
		}
		this.lastGame = mode.seed;
	}

	addLoss(mode: Mode): void {
		this.guesses.fail++;
		this.played++;
		if (this.#hasStreak) this.streak = 0;
		this.lastGame = mode.seed;
	}

	private parse(str: string): void {
		try {
			const parsed = JSON.parse(str) as Stats;
			this.played = parsed.played ?? 0;
			this.lastGame = parsed.lastGame ?? 0;
			this.guesses = parsed.guesses ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, fail: 0 };
			if (parsed.streak !== undefined) {
				this.streak = parsed.streak;
				this.maxStreak = parsed.maxStreak;
				this.#hasStreak = true;
			}
		} catch {
			// use defaults
		}
	}
}

// ──────────────────────────────────────────
// GameState
// ──────────────────────────────────────────

export class GameState extends Storable {
	active: boolean;
	guesses: number;
	validHard: boolean;
	time: number;
	wordNumber: number;
	board: GameBoard;

	#valid: boolean;
	#mode: GameMode;

	constructor(mode: GameMode, data?: string) {
		super();
		this.#mode = mode;
		this.#valid = false;
		this.active = true;
		this.guesses = 0;
		this.validHard = true;
		this.time = modeData.modes[mode].seed;
		this.wordNumber = getWordNumber(mode);
		this.board = {
			words: Array(ROWS).fill(''),
			state: Array.from({ length: ROWS }, () => Array(COLS).fill('🔳' as LetterState)),
		};

		if (data) {
			this.parse(data);
		}
	}

	get latestWord(): string {
		return this.board.words[this.guesses];
	}

	get lastState(): LetterState[] {
		return this.board.state[this.guesses - 1];
	}

	get lastWord(): string {
		return this.board.words[this.guesses - 1];
	}

	checkHardMode(): HardModeData {
		for (let i = 0; i < COLS; ++i) {
			if (this.board.state[this.guesses - 1][i] === '🟩' && this.board.words[this.guesses - 1][i] !== this.board.words[this.guesses][i]) {
				return { pos: i, char: this.board.words[this.guesses - 1][i], type: '🟩' };
			}
		}
		for (let i = 0; i < COLS; ++i) {
			if (this.board.state[this.guesses - 1][i] === '🟨' && !this.board.words[this.guesses].includes(this.board.words[this.guesses - 1][i])) {
				return { pos: i, char: this.board.words[this.guesses - 1][i], type: '🟨' };
			}
		}
		return { pos: -1, char: '', type: '⬛' };
	}

	guess(word: string): LetterState[] {
		const characters = word.split('');
		const result = Array<LetterState>(COLS).fill('⬛');
		for (let i = 0; i < COLS; ++i) {
			if (characters[i] === this.latestWord.charAt(i)) {
				result[i] = '🟩';
				characters[i] = '$';
			}
		}
		for (let i = 0; i < COLS; ++i) {
			const pos = characters.indexOf(this.latestWord[i]);
			if (result[i] !== '🟩' && pos >= 0) {
				characters[pos] = '$';
				result[i] = '🟨';
			}
		}
		return result;
	}

	private parse(str: string): void {
		try {
			const parsed = JSON.parse(str) as GameState;
			if (parsed.wordNumber !== getWordNumber(this.#mode)) return;
			this.active = parsed.active;
			this.guesses = parsed.guesses;
			this.validHard = parsed.validHard;
			this.time = parsed.time;
			this.wordNumber = parsed.wordNumber;
			this.board = parsed.board;
			this.#valid = true;
		} catch {
			// keep defaults
		}
	}
}

// ──────────────────────────────────────────
// Word dictionary
// ──────────────────────────────────────────

// wordData has { words: string[], valid: string[] }
export const words = {
	words: wordData.words,
	valid: wordData.valid,
	contains: (word: string) => {
		return wordData.words.includes(word) || wordData.valid.includes(word);
	},
};

// ──────────────────────────────────────────
// Row constraint solver (for right-click info)
// ──────────────────────────────────────────

class Tile {
	value = '';
	notSet: Set<string> = new Set();
	not(char: string) {
		this.notSet.add(char);
	}
}

class WordLetterData {
	letterCounts: Map<string, { count: number; exact: boolean }>;
	private notSet: Set<string>;
	word: Tile[];

	constructor() {
		this.notSet = new Set<string>();
		this.letterCounts = new Map();
		this.word = [];
		for (let col = 0; col < COLS; ++col) {
			this.word.push(new Tile());
		}
	}

	confirmCount(char: string) {
		const c = this.letterCounts.get(char);
		if (!c) {
			this.not(char);
		} else {
			c.exact = true;
		}
	}

	setCount(char: string, count: number) {
		const c = this.letterCounts.get(char);
		if (!c) {
			this.letterCounts.set(char, { count, exact: false });
		} else {
			c.count = count;
		}
	}

	not(char: string) {
		this.notSet.add(char);
	}

	inGlobalNotList(char: string) {
		return this.notSet.has(char);
	}

	lettersNotAt(pos: number) {
		return new Set([...this.notSet, ...this.word[pos].notSet]);
	}
}

function countOccurrences<T>(arr: T[], val: T): number {
	return arr.reduce((count, v) => v === val ? count + 1 : count, 0);
}

export function getRowData(n: number, board: GameBoard): (word: string) => boolean {
	const wd = new WordLetterData();
	for (let row = 0; row < n; ++row) {
		const rowLetterCount = new Map<string, number>();
		const blackLetters = new Set<string>();
		for (let col = 0; col < COLS; ++col) {
			const state = board.state[row][col];
			const char = board.words[row][col];
			if (state === '⬛') {
				blackLetters.add(char);
				if (!wd.inGlobalNotList(char)) {
					wd.word[col].not(char);
				}
				continue;
			}
			rowLetterCount.set(char, (rowLetterCount.get(char) || 0) + 1);
			if (state === '🟩') {
				wd.word[col].value = char;
			} else {
				wd.word[col].not(char);
			}
		}
		for (const [char, count] of rowLetterCount) {
			wd.setCount(char, count);
		}
		for (const char of blackLetters) {
			wd.confirmCount(char);
		}
	}

	let exp = '';
	for (let pos = 0; pos < wd.word.length; ++pos) {
		exp += wd.word[pos].value
			? wd.word[pos].value
			: `[^${[...wd.lettersNotAt(pos)].join('')}]`;
	}
	return (word: string) => {
		if (new RegExp(exp).test(word)) {
			const chars = word.split('');
			for (const letter of wd.letterCounts.keys()) {
				const occurrences = countOccurrences(chars, letter);
				const { count, exact } = wd.letterCounts.get(letter)!;
				if (!occurrences || (exact && occurrences !== count)) return false;
			}
			return true;
		}
		return false;
	};
}

export function failed(s: GameState): boolean {
	return !(s.active || (s.guesses > 0 && s.board.state[s.guesses - 1].join('') === '🟩'.repeat(COLS)));
}
