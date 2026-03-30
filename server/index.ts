import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

import type { SearchQuery } from "./types.ts";
import { prisma } from "./utils/db.ts";

const PORT = 3000;

const app = express();
app.use(cors());
app.use(rateLimit());

app.get("/api/search", async (request: express.Request<{}, {}, {}, SearchQuery>, response: express.Response) => {
    const { query } = request;
    const { q, page } = query;
    const results = await prisma.node.findMany({
        where: {
            OR: [
                { displayName: { contains: q, mode: "insensitive"} },
                { description: { contains: q, mode: "insensitive" } },
                { tags: { has: q } }
            ]
        },
        take: 50,
        skip: 50 * (Math.max(1, Number(page) || 0) - 1)
    })
    console.log(query.q);
    response.status(200).send(results);
})

app.listen(PORT, () => {
    console.log(`tpa-search web server is online at :${PORT}`);
});