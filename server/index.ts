import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

import type { SearchQuery } from "./types.ts";
import { prisma } from "./utils/db.js";
import { Prisma } from "./generated/prisma/client.js";
import type { Sql } from "@prisma/client/runtime/client";

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(rateLimit({
    limit: 100
}));

app.get("/api/search", async (request: express.Request<{}, {}, {}, SearchQuery>, response: express.Response) => {
    const { query } = request;
    const { q, skip, type, uploader, beforeDate, afterDate } = query;

    const queryFilter = q ? Prisma.sql`"displayName" % ${q}` : "1";
    const queryOrder = q ? Prisma.sql`ORDER BY similarity("displayName", ${q}) DESC` : Prisma.empty;

    const typeFilter = (type && type !== "All Types") ?
        Prisma.sql`AND "type" = ${type}` : Prisma.empty;

    const uploaderFilter = uploader ?
        Prisma.sql`AND "creator" = ${uploader}` : Prisma.empty;

    let beforeDateFilter: Sql = Prisma.empty;
    let afterDateFilter: Sql = Prisma.empty;

    if (beforeDate) {
        const epoch = Date.parse(beforeDate);
        if (epoch) beforeDateFilter = Prisma.sql`AND "ogDate" < to_timestamp(${epoch / 1000})`;
    }

    if (afterDate) {
        const epoch = Date.parse(afterDate);
        if (epoch) afterDateFilter = Prisma.sql`AND "ogDate" > to_timestamp(${epoch / 1000})`;
    }

    const results = await prisma.$queryRaw`SELECT * FROM "Node"
    WHERE ${queryFilter} ${typeFilter} ${uploaderFilter}
    ${beforeDateFilter} ${afterDateFilter}
    
    ${queryOrder}
    LIMIT 50 OFFSET ${skip || 0};`;
    response.status(200).send({
        results
    });
})

app.listen(PORT, () => {
    console.log(`tpa-search web server is online at :${PORT}`);
});