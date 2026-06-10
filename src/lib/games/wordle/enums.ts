export enum GameMode {
	daily,
	hourly,
	infinite,
}

export const ms = {
	SECOND: 1000,
	MINUTE: 1000 * 60,
	HOUR: 1000 * 60 * 60,
	DAY: 1000 * 60 * 60 * 24,
} as const;
