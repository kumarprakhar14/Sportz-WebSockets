import {
    pgEnum,
    pgTable,
    serial,
    text,
    integer,
    timestamp,
    varchar,
    jsonb,
    relations,
} from 'drizzle-orm/pg-core';

/**
 * Match Status Enum
 * Represents the current state of a match
 */
export const matchStatusEnum = pgEnum('match_status', [
    'scheduled',
    'live',
    'finished',
]);

/**
 * Matches Table
 * Stores information about sports matches
 */
export const matches = pgTable('matches', {
    id: serial('id').primaryKey(),
    sport: varchar('sport').notNull(),
    homeTeam: varchar('home_team').notNull(),
    awayTeam: varchar('away_team').notNull(),
    status: matchStatusEnum('status').default('scheduled').notNull(),
    startTime: timestamp('start_time').notNull(),
    endTime: timestamp('end_time'),
    homeScore: integer('home_score').default(0).notNull(),
    awayScore: integer('away_score').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Commentary Table
 * Stores real-time commentary and events for matches
 */
export const commentary = pgTable('commentary', {
    id: serial('id').primaryKey(),
    matchId: integer('match_id')
        .references(() => matches.id, { onDelete: 'cascade' })
        .notNull(),
    minute: integer('minute'),
    sequence: integer('sequence'),
    period: integer('period'),
    eventType: varchar('event_type'),
    actor: varchar('actor'),
    team: varchar('team'),
    message: text('message'),
    metadata: jsonb('metadata'),
    tags: text('tags'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Relations
 * Define relationships between tables for better query support
 */
// export const matchesRelations = relations(matches, ({ many }) => ({
//     commentaries: many(commentary),
// }));

// export const commentaryRelations = relations(commentary, ({ one }) => ({
//     match: one(matches, {
//         fields: [commentary.matchId],
//         references: [matches.id],
//     }),
// }));
