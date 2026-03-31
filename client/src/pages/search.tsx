import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import { SearchBox } from "../components/SearchBox";
import { SearchResult } from "../components/SearchResult";

function Loading() {
    return (
        <p className="text-center text-lg">Loading...</p>
    )
}

export default function SearchPage() {
    const [searchParams] = useSearchParams();
    const [results, setResults] = useState<Array<any>>([]);

    const [loading, setLoading] = useState<boolean>(true);
    const [showLoadMore, setShowLoadMore] = useState<boolean>(true);
    const [depth, setDepth] = useState<number>(0);
    const [error, setError] = useState<string>();

    useEffect(() => {
        setLoading(true);
        searchParams.set("skip", String(depth * 50));
        fetch(`${import.meta.env.VITE_API_URL}/api/search?${searchParams.toString()}`, { method: "GET" })
            .then(async (response) => {
                setLoading(false);
                console.log(response.ok)
                const json = await response.json();
                if (!response.ok)
                    setError(json.message || "An unknown error occurred");
                else {
                    setResults(r => [...r, ...json.results]);
                    if (json.results.length === 0 || json.results.length < 50) setShowLoadMore(false);
                    // setDepth(depth => depth + 1);
                }
            })
            .catch(() => setError("A network error occurred."))
    }, [searchParams, depth]);

    return (
        <div className="mt-8">
            <SearchBox />
            {(results && results.length > 0) && <div className="grid gap-4 lg:w-3/4 m-auto">
                {results.map((res: any, index: number) =>
                    <SearchResult key={index} data={res} />
                )}
                {(!loading && showLoadMore) && <button onMouseDown={() => setDepth(depth => depth + 1)}
                    className="text-center border border-gray-400 rounded-md p-1 cursor-pointer">Load More</button>}
            </div>}
            {loading && <Loading />}
            {error && <p className="text-center text-red-500 text-lg">{error}</p>}
            {(!loading && results?.length === 0) && <p className="text-center text-lg">No results found.</p>}
        </div>
    )
}