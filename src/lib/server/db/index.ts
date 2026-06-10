import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { building } from '$app/environment';

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
	if (building) {
		// Return a mock during build for static generation
		return null as unknown as ReturnType<typeof drizzle<typeof schema>>;
	}

	if (!db) {
		const sqlite = new Database(process.env.DATABASE_URL ?? 'worpple.db');
		sqlite.pragma('journal_mode = WAL');
		sqlite.pragma('foreign_keys = ON');
		db = drizzle(sqlite, { schema });
	}

	return db;
}
