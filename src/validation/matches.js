import { z } from 'zod';

/**
 * Query validation for listing matches with pagination
 */
export const listMatchesQuerySchema = z.object({
    limit: z.coerce
        .number()
        .int()
        .positive()
        .max(100)
        .optional(),
});

/**
 * Match status constants
 */
export const MATCH_STATUS = {
    SCHEDULED: 'scheduled',
    LIVE: 'live',
    FINISHED: 'finished',
};

/**
 * Route parameter validation for match ID
 */
export const matchIdParamSchema = z.object({
    id: z.coerce
        .number()
        .int()
        .positive(),
});

/**
 * ISO date string validation helper
 */
const isValidISODate = (value) => {
    if (typeof value !== 'string') return false;
    const date = new Date(value);
    return date instanceof Date && !isNaN(date.getTime()) && value === date.toISOString();
};

/**
 * Schema for creating a new match
 */
export const createMatchSchema = z
    .object({
        sport: z
            .string()
            .min(1, 'Sport must be a non-empty string'),
        homeTeam: z
            .string()
            .min(1, 'Home team must be a non-empty string'),
        awayTeam: z
            .string()
            .min(1, 'Away team must be a non-empty string'),
        startTime: z
            .string()
            .refine(
                isValidISODate,
                'Start time must be a valid ISO date string'
            ),
        endTime: z
            .string()
            .refine(
                isValidISODate,
                'End time must be a valid ISO date string'
            ),
        homeScore: z.coerce
            .number()
            .int()
            .nonnegative()
            .optional(),
        awayScore: z.coerce
            .number()
            .int()
            .nonnegative()
            .optional(),
    })
    .superRefine((data, ctx) => {
        const startTime = new Date(data.startTime);
        const endTime = new Date(data.endTime);

        if (endTime <= startTime) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'End time must be chronologically after start time',
                path: ['endTime'],
            });
        }
    });

/**
 * Schema for updating match scores
 */
export const updateScoreSchema = z.object({
    homeScore: z.coerce
        .number()
        .int()
        .nonnegative(),
    awayScore: z.coerce
        .number()
        .int()
        .nonnegative(),
});
