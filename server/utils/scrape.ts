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

function extractMusicArchiveMetadata(absolutePath: string) {
    const result: { artist?: string, album?: string } = {};
    const albumMatch = absolutePath.match(/\/Albums\/([^/]+)\/([^/]+)\/?$/);
    if (albumMatch) {
        result.artist = albumMatch[1];
        result.album = albumMatch[2];
    }
    return result;
}

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
        let tags: string[] = [];
        let categories: string[] = [];
        let description: string | undefined;
        let genre: string | undefined;
        let uploadDate: Date | undefined;

        let uploader: string | undefined;
        let uploaderUrl: string | undefined;

        const infoResponse = await fetch(new URL(infoPath, BASE_URL).href);
        if (infoResponse.ok) {
            const infoJson = await infoResponse.json();
            if (infoJson.description) description = infoJson.description;
            if (infoJson.tags) tags = infoJson.tags;
            if (infoJson.title) displayName = infoJson.title;
            if (infoJson.genre) genre = infoJson.genre;

            const rawDate = infoJson.upload_date as string | undefined;
            if (rawDate) {
                const formattedDate = rawDate.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
                uploadDate = new Date(formattedDate);
            }

            if (infoJson.uploader) {
                uploader = infoJson.uploader;
                uploaderUrl = infoJson.uploader_url;
            }
        }

        if (filePath.startsWith("/archive/EqBeatsAudio")) {
            const extensionlessName = filePath.replace(ExtRegex, "");
            const parts = extensionlessName.split("%20-%20");
            console.log(parts);
            if (parts.length > 1)
                uploader = parts[parts.length - 1]?.trim();
        }

        if (filePath.startsWith("/archive/ponymusicarchive")) {
            const { artist, album } = extractMusicArchiveMetadata(filePath);
            if (artist) {
                uploader = artist;
                console.log(`Pony Music Archive - Artist: ${artist}, Album: ${album}`);
            }
        }

        // upsert uploader
        if (uploader) await prisma.uploader.upsert({
            where: { name: uploader },
            update: {},
            create: {
                name: uploader as string,
                url: uploaderUrl
            }
        });

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

        const data = {
            displayName,
            type,
            absolutePath: filePath,
            creator: uploader,
            tags,
            categories,
            description,
            genre,
            ogDate: uploadDate || new Date(modified),
            ...(size ? { ogSize: bytes.parse(size) } : {}),
            ...(thumbnailUrl ? { thumbnailUrl } : {})
        }

        await prisma.node.upsert({
            where: { absolutePath: filePath },
            create: data,
            update: data
        });

        if (thumbnailUrl) console.log(`thumbnail included for ${filePath}`);
        console.log(`Scraped ${filePath}`);
    } catch (error) {
        console.warn(`ERROR: Failed to store associated metadata for ${filePath}.`);
        console.warn(`MESSAGE: ${(error as Error).message}`);
    }
}

/**
 * Entry point for scraping a specified directory, rescursively scrapes subdirectories by default.
 * @param directoryUrl 
 */
async function scrapeDirectory(directoryUrl: URL, skipUntil?: string, skipDirs: Set<string> = new Set()) {
    try {
        const directoryResponse = await fetch(directoryUrl);
        if (!directoryResponse.ok) {
            console.warn(`Failed to retrieve directory contents for ${directoryUrl.pathname}`);
            console.warn(`Status code ${directoryResponse.status} (${directoryResponse.statusText})`);
            return;
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

                if (skipUntil && absPath !== skipUntil && !absPath.startsWith(skipUntil + "/")) {
                    console.log(`Skipping directory ${absPath}`);
                    continue;
                }

                if (skipDirs.has(absPath)) {
                    console.log(`Skipping directory ${absPath}`);
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
    } catch (error) {
        console.log(`Directory traverse error: ${(error as Error).message}`);
    }
}

async function startScape() {
    const rootURL = new URL(BASE_URL);
    await scrapeDirectory(rootURL, "/archive/ponymusicarchive", new Set([
        // "/archive/youtube/UC7B-gDZEuFo_okuuaG4LTkA"
    ]));
}

await startScape();