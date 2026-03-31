import { ErrorBoundary } from "react-error-boundary";
import { SearchResultType } from "./SearchResultType";

export function SearchResult({ data }: {
    data: {
        id: string,
        type: string,
        displayName: string,
        absolutePath: string,
        description: string,
        creator?: string,
        tags: Array<string>,
        thumbnailUrl?: string,

        ogDate: string,
        ogSize?: number
    }
}) {
    return (
        <ErrorBoundary fallback={<p>Something went wrong.</p>}>
            <div className="flex flex-col lg:flex-row border border-gray-400/50 rounded-md p-2">
                <div className="grid gap-4 flex-1">
                    <div>
                        <div className="flex items-center gap-4">
                            <h1 className="text-lg font-bold">{data.displayName}</h1>
                            <SearchResultType type={data.type} />
                        </div>
                        <a className="text-sky-600 underline text-wrap" target="_blank" href={`https://theponyarchive.com${data.absolutePath}`}>
                            {data.absolutePath}
                        </a>
                    </div>
                    <div>
                        <div className="flex gap-1 items-center">
                            <b>Upload date:</b>
                            <p>{new Date(Date.parse(data.ogDate)).toDateString()}</p>
                        </div>
                        <div className="flex gap-1">
                            <b>Tags:</b>
                            <p>{data.tags.length > 0 ? data.tags.join(", ") : "none"}</p>
                        </div>
                        {data.creator && <div className="flex gap-1">
                            <b>Creator:</b>
                            <a className="text-sky-600 underline" href={`/search?uploader=${data.creator}`}>{data.creator}</a>
                        </div>}
                    </div>
                </div>
                {data.thumbnailUrl && <img className="w-[256px] object-fit order-first lg:order-last" src={data.thumbnailUrl} />}
            </div>
        </ErrorBoundary>
    )
}