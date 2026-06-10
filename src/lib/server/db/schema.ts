import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
	id: text('id').primaryKey(),
	username: text('username').unique(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

export const puzzles = sqliteTable('puzzles', {
	id: text('id').primaryKey(),
	gameType: text('game_type').notNull(),
	publishDate: text('publish_date').notNull(),
	status: text('status', { enum: ['draft', 'approved', 'published'] })
		.notNull()
		.default('draft'),
	content: text('content', { mode: 'json' }).notNull(),
	author: text('author', { enum: ['human', 'ai', 'hybrid'] }).notNull().default('human'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});

export const gameProgress = sqliteTable('game_progress', {
	id: text('id').primaryKey(),
	userId: text('user_id').references(() => users.id),
	sessionId: text('session_id').notNull(),
	gameType: text('game_type').notNull(),
	puzzleId: text('puzzle_id').notNull(),
	state: text('state', { mode: 'json' }).notNull(),
	completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
	score: integer('score').default(0),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
});
