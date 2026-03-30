import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export default function SearchPage() {
    const [searchParams] = useSearchParams();
    const [results, setResults] = useState<Array<any>>();
    const [error, setError] = useState<string>();
    
    const [page, setPage] = useState<number>(1);
    const [pages, setPages] = useState<number>(1);
    const [isNextPage, setIsNextPage] = useState<boolean>();

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/search?${searchParams.toString()}`, { method: "GET" })
            .then(async (response) => {
                console.log(response.ok)
                const json = await response.json();
                if (!response.ok)
                    setError(json.message || "An unknown error occurred");
                else {
                    setResults(json.results);
                    setPage(json.currentPage)
                    setPages(json.pages);
                    setIsNextPage(json.isNextPage);
                }
            })
            .catch(() => setError("A network error occurred."))
    }, [])

    return (
        <div className="mt-8">
            {error && <p className="text-center text-red-500 text-lg">{error}</p>}
            {(results && results.length > 0) && <div className="grid">

            </div>}
            {results?.length === 0 && <p>No results found.</p>}
        </div>
    )
}