import { z } from 'zod';

/**
 * Query validation for listing commentary with pagination
 */
export const listCommentaryQuerySchema = z.object({
    limit: z.coerce
        .number()
        .int()
        .positive()
        .max(100)
        .optional(),
});

/**
 * Schema for creating a new commentary entry
 */
export const createCommentarySchema = z.object({
    minute: z
        .number()
        .int()
        .nonnegative('Minute must be a non-negative integer'),
    sequence: z
        .number()
        .int()
        .nonnegative('Sequence must be a non-negative integer')
        .optional(),
    period: z
        .string()
        .min(1, 'Period must be a non-empty string'),
    eventType: z
        .string()
        .min(1, 'Event type must be a non-empty string'),
    actor: z
        .string()
        .min(1, 'Actor must be a non-empty string'),
    team: z
        .string()
        .min(1, 'Team must be a non-empty string'),
    message: z
        .string()
        .min(1, 'Message must be a non-empty string'),
    metadata: z
        .record(z.string(), z.any())
        .optional(),
    tags: z
        .array(z.string())
        .optional(),
});
