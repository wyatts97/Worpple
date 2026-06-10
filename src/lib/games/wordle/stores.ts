import { writable } from 'svelte/store';
import type { GameMode } from './enums';
import { LetterStates, Settings } from './game-logic';

export const mode = writable<GameMode>(0);

export const letterStates = writable(new LetterStates());

export const settings = writable(new Settings());
