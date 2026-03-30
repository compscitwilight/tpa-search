import * as cheerio from "cheerio";
import * as path from "node:path";
import bytes from "bytes";
import { prisma } from "./db.ts";
import { NodeType } from "../generated/prisma/enums.ts";

const BASE_URL = "https://theponyarchive.com/archive/";

const TypeMap = {
    "/icons/folder.gif": "Directory",
    "/icons/text.gif": NodeType.Text,
    "/icons/layout.gif": NodeType.Text, // soon: document
    "/icons/sound2.gif": NodeType.Audio,
    "/icons/movie.gif": NodeType.Video,
    "/icons/image2.gif": NodeType.Image,
    "/icons/compressed.gif": NodeType.Compressed,
    "/icons/unknown.gif": NodeType.Unknown
} as { [src: string]: NodeType | "Directory" };
const ExtRegex = /\.[^.]+$/;

/**
 * Takes a given file path, attempts to locate the corresponding *.descrption and *.info.json files on TPA,
 * then adds the file as a node to the database.
 * @param path The **absolute** file path
 * @param type The NodeType (determined by @see TypeMap )
 */
async function gatherMetadata(
    filePath: string,
    type: NodeType,
    modified: string,
    size?: string
) {
    try {
        const infoPath = filePath.replace(ExtRegex, ".info.json");
        let displayName: string = path.basename(filePath);
        let tags = new Array<string>();
        let categories = new Array<string>();
        let description: string | undefined;
        let genre: string | undefined;

        const infoResponse = await fetch(new URL(infoPath, BASE_URL).href);
        if (infoResponse.ok) {
            const infoJson = await infoResponse.json();
            if (infoJson.description) description = infoJson.description;
            if (infoJson.tags) tags = infoJson.tags;
            if (infoJson.title) displayName = infoJson.title;
            if (infoJson.genre) genre = infoJson.genre;
        }

        let thumbnailUrl: string | undefined;
        const thumbnailUrls = [
            // works with basically every YT video on TPA
            filePath.replace(ExtRegex, ".jpg"),

            // for entries in /archive/soundcloud
            filePath.replace(ExtRegex, "_t500x500.jpg")
        ];

        for (const pattern of thumbnailUrls) {
            const url = new URL(pattern, BASE_URL).href;
            const thumbnailResponse = await fetch(url);
            if (thumbnailResponse.ok) {
                thumbnailUrl = url;
                break;
            }
        }

        const existingRecord = await prisma.node.findUnique({ where: { absolutePath: filePath } });
        const data = {
            displayName,
            type,
            absolutePath: filePath,
            tags,
            categories,
            description,
            genre,
            ogDate: new Date(modified),
            ...(size ? { ogSize: bytes.parse(size) } : {}),
            ...(thumbnailUrl ? { thumbnailUrl } : {})
        }

        if (thumbnailUrl) console.log(`thumbnail included for ${filePath}`);

        if (!existingRecord) {
            await prisma.node.create({ data });
            console.log(`scraped ${filePath}`);
            if (displayName !== filePath) console.log(`aka ${displayName}`);
        } else {
            console.log(`${filePath} has already been scraped`);
            await prisma.node.update({
                where: { id: existingRecord.id },
                data
            })
        }
        console.log();
    } catch (error) {
        console.warn(`ERROR: Failed to store associated metadata for ${filePath}.`);
        console.warn(`MESSAGE: ${(error as Error).message}`);
    }
}

/**
 * Entry point for scraping a specified directory, rescursively scrapes subdirectories by default.
 * @param directoryUrl 
 */
async function scrapeDirectory(directoryUrl: URL, skipUntil?: string) {
    const directoryResponse = await fetch(directoryUrl);
    if (!directoryResponse.ok) {
        console.warn(`Failed to retrieve directory contents for ${directoryUrl.pathname}`);
        console.warn(`Status code ${directoryResponse.status} (${directoryResponse.statusText})`);
        process.exit(1);
    }

    const body = await directoryResponse.text();
    const $ = cheerio.load(body);

    const rows = $("tr");
    // skip 2 rows + parent directory row
    const listItemRows = rows.slice(3);

    function sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    for (const el of listItemRows.toArray()) {
        await sleep(5);
        const listItemContext = $(el);

        const fileIcon = listItemContext.find('td[valign="top"]').find("img");
        const fileHref = listItemContext.find('td a').attr("href");

        const rightAligned = listItemContext.find('td[align="right"]');
        const fileModified = rightAligned.eq(0).text().trim();
        const fileSize = rightAligned.eq(1).text().trim();

        const imgSrc = fileIcon.attr("src");
        if (imgSrc && fileHref) {
            const absPath = path.join(directoryUrl.pathname, fileHref);
            const nodeType = TypeMap[imgSrc];
            // console.log(absPath);
            if (!nodeType) {
                console.warn(`An icon ${imgSrc} for ${absPath} was not found in TypeMap.`);
                continue;
            }

            if (skipUntil && absPath !== skipUntil && !absPath.startsWith(skipUntil)) {
                console.log(`Skipping ${absPath}`);
                continue;
            }

            if (absPath.endsWith(".description") || absPath.endsWith(".info.json")) {
                console.warn(`Skipping ${absPath} as it is a metadata file.`);
                continue;
            }

            const newSkipUntil = skipUntil && absPath.startsWith(skipUntil) ? undefined : skipUntil;

            if (nodeType === "Directory") {
                // directoryUrl.pathname = path.join(directoryUrl.pathname, fileHref);
                const nextUrl = new URL(fileHref, directoryUrl.href);
                await scrapeDirectory(nextUrl, newSkipUntil);
            } else gatherMetadata(absPath, nodeType, fileModified, fileSize !== "-" ? fileSize : undefined);
        }
    }
}

async function startScape() {
    const rootURL = new URL(BASE_URL);
    await scrapeDirectory(rootURL, "/archive/tamers");
}

await startScape();