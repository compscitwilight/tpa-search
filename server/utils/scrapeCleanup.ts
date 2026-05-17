import path, { format } from "node:path";
import { prisma } from "./db.js";
import { BASE_URL, ExtRegex } from "./scrape.js";

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

async function repairQuickchive() {
    const broken = await prisma.node.findMany({
        where: {
            AND: [
                { absolutePath: { startsWith: "/archive/quickchive" } },
                { uploader: null }
            ]
        }
    });

    for (const node of broken) {
        try {
            const infoJsonPath = node.absolutePath.replace(ExtRegex, ".info.json");
            const infoResponse = await fetch(new URL(infoJsonPath, BASE_URL).href);
            if (infoResponse.ok) {
                const json = await infoResponse.json();
                let creator: string | undefined;
                let creatorUrl: string | undefined;
                let ogDate: Date | undefined;
                if (json.uploader) creator = json.uploader;
                if (json.uploader_url) creatorUrl = json.uploader_url;
                if (json.upload_date) {
                    const formattedDate = json.upload_date.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
                    ogDate = new Date(formattedDate);
                }

                if (creator) await prisma.uploader.upsert({
                    where: { name: creator },
                    update: {},
                    create: {
                        name: creator as string,
                        url: creatorUrl
                    }
                })

                await prisma.node.update({
                    where: { id: node.id },
                    data: {
                        creator,
                        ogDate,
                        // ...(creator && {
                            // uploader: {
                                // connect: { name: creator }
                            // }
                        // })
                    }
                });
                console.log(`updated ${node.absolutePath}`);
            }
        } catch (e) {
            console.log(`failed to repair node: ${e}`);
            continue;
        }
    }
}

async function run() {
    // await deleteMetadataFiles();
    // await cleanDisplayNames();
    await repairQuickchive();
    process.exit(0);
}

run().catch(console.error);
