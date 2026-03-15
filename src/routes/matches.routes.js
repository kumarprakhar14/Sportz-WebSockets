import { Router } from "express";
import { createMatchSchema, listMatchesQuerySchema } from "../validation/matches.js";
import { db } from "../db/db.js";
import { getMatchStatus } from "../utils/match-status.js";
import { matches } from "../db/schema.js";
import { desc } from "drizzle-orm";
import z from "zod";

export const matchRouter = Router();

const MAX_LIMIT = 100

matchRouter.get("/", async (req, res) => {
    const parsed = listMatchesQuerySchema.safeParse(req.query)

    if (!parsed.success)
        return res.status(400).json({ error: "Invalid query.", details: parsed.error.issues })

    const limit = Math.min(parsed.data.limit ?? 50, MAX_LIMIT)

    // NOTES:
    // The symbol ?? in JavaScript is the nullish coalescing operator. 
    // It is a logical operator that returns its right-hand side 
    // operand when its left-hand side operand is null or undefined, 
    // and otherwise returns its left-hand side operand.
    
    // This operator provides a concise way to handle default 
    // values for properties that might be missing or set to 
    // null/undefined, without falling back to other "falsy" 
    // values like 0 or '' (empty string), which the logical OR operator (||) would. 

    try {
        const data = await db
            .select()
            .from(matches)
            .orderBy(desc(matches.createdAt))
            .limit(limit)

            res.json({ data })

    } catch (e) {
        res.status(500).json({ error: "Failed to list matches.", details: e.message })
    }
})

matchRouter.post("/", async (req, res) => {
    const parsed = createMatchSchema.safeParse(req.body)

    if(!parsed.success) 
        return res.status(400).json({ error: "Invalid payload.", details: parsed.error.issues})

    const { startTime, endTime, homeScore, awayScore } = parsed.data

    const status = getMatchStatus(startTime, endTime);
        if (!status) {
            return res.status(400).json({ error: "Invalid date values for status calculation." });
        }

    try {
        const [event] = await db.insert(matches).values({
            ...parsed.data,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            homeScore: homeScore ?? 0,
            awayScore: awayScore ?? 0,
            status,
        }).returning()

        // if broadcastMatchCreated(event) function throws error
        // handle it in its own try-catch
        if (res.app.locals.broadcastMatchCreated) {
            try {
                const broadcastResult = res.app.locals.broadcastMatchCreated(event);
                if (broadcastResult && typeof broadcastResult.catch === 'function') {
                    broadcastResult.catch((err) => {
                        console.error("Failed to broadcast match created event:", err);
                    });
                }
            } catch (err) {
                console.error("Failed to broadcast match created event:", err);
            }
        }

        res.status(201).json({ data: event })
    } catch (e) {
        res.status(500).json({ error: "Failed to create match.", details: e.message })
    }
})