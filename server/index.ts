import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { performance } from "node:perf_hooks";

import type { SearchQuery } from "./types.ts";
import { prisma } from "./utils/db.js";
import { Prisma, type Node } from "./generated/prisma/client.js";

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(rateLimit({
    limit: 100
}));

type ResultNode = Node & { sim: number };

app.get("/api/search", async (request: express.Request<{}, {}, {}, SearchQuery>, response: express.Response) => {
    const { query } = request;
    const { q, skip, type, uploader, beforeDate, afterDate, fuzzy } = query;
    const start = performance.now();

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


    // plan test
//     const plan = await prisma.$queryRaw`
//     EXPLAIN ANALYZE
//     WITH ranked AS (
//         SELECT *, 
//             similarity("displayName", ${q}) as sim
//         FROM "Node"
//         WHERE "displayName" % ${q}
//         ORDER BY sim DESC
//         LIMIT 500
//     )
//     SELECT * FROM ranked
//     LIMIT 50;
// `;
//     console.log(JSON.stringify(plan, null, 2));

    if (fuzzy) console.log("using similarity search");
    else console.log("using ILIKE search");

    let results: Array<ResultNode> = new Array<ResultNode>();
    const searchStart = performance.now();
    // console.log("search start now");
    if (q) {
        results = await prisma.$queryRaw<Array<ResultNode>>`
            WITH RANKED AS (
                SELECT *,
                similarity("displayName", ${q}) as sim
                FROM "Node"
                ${baseFilter}
                AND "displayName" ${fuzzy ? Prisma.sql`% ${q}` : Prisma.sql`ILIKE ${q + "%"}`}
                ORDER BY sim DESC
                LIMIT 500
            )
            SELECT * FROM ranked
            ORDER BY sim DESC
            LIMIT 50 OFFSET ${skip || 0}
        `;
    } else {
        results = await prisma.$queryRaw<Array<ResultNode>>`
            SELECT * FROM "Node"
            ${baseFilter}
            ORDER BY "ogDate" DESC
            LIMIT 50 OFFSET ${skip || 0}
        `
    }
    const searchEnd = performance.now();
    console.log(`search complete in ${Math.round(searchEnd - searchStart)}ms`);

    for (const res of results)
        try {
            res.displayName = decodeURI(res.displayName);
        } catch (e) {
            console.warn(`an error occurred while decoding display name for ${res.displayName}: ${e}`);
        }

    const end = performance.now();
    const latencyMs = Math.round(end - start);

    response.status(200).send({
        results,
        latencyMs
    });
})

app.get("/api/size", async (_, response: express.Response) => {
    const sizeData = await prisma.recordsCount.findMany();
    response.status(200).send(sizeData);
})

app.listen(PORT, () => {
    console.log(`tpa-search web server is online at :${PORT}`);
});