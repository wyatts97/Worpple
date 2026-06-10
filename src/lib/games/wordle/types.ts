import type { GameMode } from './enums';

export type LetterState = '🔳' | '⬛' | '🟨' | '🟩';

export interface WordData {
	/** A list of possible words to guess */
	words: string[];
	/** A list of words that are valid when input by the user but will never get chosen as the word to guess */
	valid: string[];
}

export interface Words extends WordData {
	contains: (word: string) => boolean;
}

export interface GameBoard {
	words: string[];
	state: LetterState[][];
}

export interface RowData {
	length: number;
	guess: number;
}

export interface HardModeData {
	pos: number;
	char: string;
	type: '🟩' | '🟨' | '⬛';
}

export interface Guesses {
	'1': number;
	'2': number;
	'3': number;
	'4': number;
	'5': number;
	'6': number;
	fail: number;
}

export interface Mode {
	name: string;
	unit: number;
	start: number;
	seed: number;
	historical: boolean;
	icon?: string;
	streak?: boolean;
	useTimeZone?: boolean;
}

export interface ModeData {
	default: GameMode;
	modes: Mode[];
}
