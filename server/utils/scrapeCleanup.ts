import path from "node:path";
import { prisma } from "./db.js";

async function cleanDisplayNames() {
    const entries = await prisma.node.findMany();
    for (const entry of entries) {
        if (entry.absolutePath === entry.displayName) {
            await prisma.node.update({
                where: { id: entry.id },
                data: { displayName: path.basename(entry.absolutePath) }
            });
            console.log(`fix ${entry.absolutePath}`);
        }
    }

    console.log("Cleaned display names");
}

async function deleteMetadataFiles() {
    const deleted = await prisma.node.deleteMany({
        where: {
            OR: [
                { absolutePath: { endsWith: ".info.json" } },
                { absolutePath: { endsWith: ".description" } }
            ]
        }
    });

    console.log(`Deleted ${deleted.count} entries`);
}

async function run() {
    // await deleteMetadataFiles();
    await cleanDisplayNames();
    process.exit(0);
}

run().catch(console.error);
