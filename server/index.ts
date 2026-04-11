import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

import type { SearchQuery } from "./types.ts";
import { prisma } from "./utils/db.js";
import { Prisma, type Node } from "./generated/prisma/client.js";

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(rateLimit({
    limit: 100
}));

app.get("/api/search", async (request: express.Request<{}, {}, {}, SearchQuery>, response: express.Response) => {
    const { query } = request;
    const { q, skip, type, uploader, beforeDate, afterDate } = query;

    let whereConditions: Array<Prisma.Sql> = new Array<Prisma.Sql>();
    if (type && type !== "All Types")
        whereConditions.push(Prisma.sql`"type" = ${type}`);
    if (uploader) whereConditions.push(Prisma.sql`"creator" = ${uploader}`);
    if (beforeDate) {
        const epoch = Date.parse(beforeDate);
        if (epoch) whereConditions.push(Prisma.sql`"ogDate" < to_timestamp(${epoch / 1000})`);
    }

    if (afterDate) {
        const epoch = Date.parse(afterDate);
        if (epoch) whereConditions.push(Prisma.sql`"ogDate" > to_timestamp(${epoch / 1000})`);
    }

    const baseFilter = whereConditions.length > 0
        ? Prisma.sql`WHERE ${Prisma.join(whereConditions, " AND ")}`
        : Prisma.sql`WHERE 1=1`;

    let results: Array<Node> = new Array<Node>();
    if (q) {
        results = await prisma.$queryRaw<Array<Node>>`
            WITH RANKED AS (
                SELECT *,
                similarity("displayName", ${q}) as sim
                FROM "Node"
                ${baseFilter}
                AND "displayName" % ${q}
                ORDER BY sim DESC
                LIMIT 500
            )
            SELECT id, type, "displayName", "absolutePath", description, creator, genre, tags, categories, "thumbnailUrl", "ogSize", "ogDate", "scrapedAt"
            FROM ranked
            ORDER BY sim DESC
            LIMIT 50 OFFSET ${skip || 0}
        `;
    } else {
        results = await prisma.$queryRaw<Array<Node>>`
            SELECT * FROM "Node"
            ${baseFilter}
            ORDER BY "ogDate" DESC
            LIMIT 50 OFFSET ${skip || 0}
        `
    }

    for (const res of results)
        try {
            res.displayName = decodeURI(res.displayName);
        } catch (e) {
            console.warn(`an error occurred while decoding display name for ${res.displayName}: ${e}`);
        }

    response.status(200).send({
        results
    });
})

app.listen(PORT, () => {
    console.log(`tpa-search web server is online at :${PORT}`);
});