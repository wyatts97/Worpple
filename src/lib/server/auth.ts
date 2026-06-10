import { Lucia } from 'lucia';
import { betterSqlite3 } from '@lucia-auth/adapter-sqlite';
import Database from 'better-sqlite3';
import { building } from '$app/environment';

let lucia: Lucia<Record<string, unknown>> | null = null;

export function getAuth() {
	if (building) {
		return null as unknown as Lucia<Record<string, unknown>>;
	}

	if (!lucia) {
		const sqlite = new Database(process.env.DATABASE_URL ?? 'worpple.db');
		sqlite.pragma('journal_mode = WAL');

		const adapter = betterSqlite3(sqlite, {
			user: 'users',
			session: 'sessions'
		});

		lucia = new Lucia(adapter, {
			sessionCookie: {
				attributes: {
					secure: process.env.NODE_ENV === 'production'
				}
			},
			getUserAttributes: (attributes) => {
				return {
					username: attributes.username
				};
			}
		});
	}

	return lucia;
}

// IMPORTANT: Extend Lucia types
declare module 'lucia' {
	interface Register {
		Lucia: ReturnType<typeof getAuth>;
		DatabaseUserAttributes: {
			username: string | null;
		};
	}
}
