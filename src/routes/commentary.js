import { Router } from "express";
import { createCommentarySchema, listCommentaryQuerySchema } from "../validation/commentary.js";
import { matchIdParamSchema } from "../validation/matches.js";
import { db } from "../db/db.js";
import { commentary } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";

const MAX_LIMIT = 100;

export const commentaryRouter = Router({ mergeParams: true });

/**
 * GET route to retrieve all commentary entries for a match
 * @route GET /:id/commentary
 * @param {number} id - Match ID (from route params)
 * @query {number} limit - Maximum number of results (default: 100, max: 100)
 * @returns {Object} - Array of commentary entries sorted by createdAt (newest first)
 */
commentaryRouter.get('/', async (req, res) => {
    // Validate route parameters
    const paramsParsed = matchIdParamSchema.safeParse(req.params);

    if (!paramsParsed.success) {
        return res.status(400).json({
            error: "Invalid match ID parameter.",
            details: paramsParsed.error.issues,
        });
    }

    // Validate query parameters
    const queryParsed = listCommentaryQuerySchema.safeParse(req.query);

    if (!queryParsed.success) {
        return res.status(400).json({
            error: "Invalid query parameters.",
            details: queryParsed.error.issues,
        });
    }

    try {
        // Determine limit with safety cap
        const limit = Math.min(queryParsed.data.limit || 100, MAX_LIMIT);

        // Fetch commentaries for the match, ordered by newest first
        const commentaries = await db
            .select()
            .from(commentary)
            .where(eq(commentary.matchId, paramsParsed.data.id))
            .orderBy(desc(commentary.createdAt))
            .limit(limit);

        res.status(200).json({
            data: commentaries,
            count: commentaries.length,
        });
    } catch (error) {
        console.error("Error fetching commentaries:", error);
        return res.status(500).json({
            error: "Failed to fetch commentaries.",
            details: error.message,
        });
    }
});

/**
 * POST route to create a new commentary entry for a match
 * @route POST /:id/commentary
 * @param {number} id - Match ID (from route params)
 * @body {Object} - Commentary data (minute, period, eventType, actor, team, message, etc.)
 * @returns {Object} - Created commentary entry with ID and timestamp
 */
commentaryRouter.post('/', async (req, res) => {
    // Validate route parameters
    const paramsParsed = matchIdParamSchema.safeParse(req.params);

    if (!paramsParsed.success) {
        return res.status(400).json({
            error: "Invalid match ID parameter.",
            details: paramsParsed.error.issues,
        });
    }

    // Validate request body
    const bodyParsed = createCommentarySchema.safeParse(req.body);

    if (!bodyParsed.success) {
        return res.status(400).json({
            error: "Invalid commentary payload.",
            details: bodyParsed.error.issues,
        });
    }

    try {
        // Insert commentary into the database
        const [createdCommentary] = await db
            .insert(commentary)
            .values({
                matchId: paramsParsed.data.id,
                minute: bodyParsed.data.minute,
                sequence: bodyParsed.data.sequence,
                period: bodyParsed.data.period,
                eventType: bodyParsed.data.eventType,
                actor: bodyParsed.data.actor,
                team: bodyParsed.data.team,
                message: bodyParsed.data.message,
                metadata: bodyParsed.data.metadata,
                tags: bodyParsed.data.tags ? JSON.stringify(bodyParsed.data.tags) : null,
            })
            .returning();

            if (res.app.locals.broadcastCommentary) {
                res.app.locals.broadcastCommentary(createdCommentary.matchId, createdCommentary)
            }

        res.status(201).json({ data: createdCommentary });
    } catch (error) {
        console.error("Error creating commentary: ", error);
        return res.status(500).json({
            error: "Failed to create commentary.",
            details: error.message,
        });
    }
});