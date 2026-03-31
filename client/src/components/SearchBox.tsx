import { useSearchParams } from "react-router-dom";

export function SearchBox() {
    const [searchParams] = useSearchParams();
    const defaultType = searchParams.get("type");
    const defaultQuery = searchParams.get("q");
    const defaultBeforeDate = searchParams.get("beforeDate");
    const defaultAfterDate = searchParams.get("afterDate");

    return (
        <form action="/search" className="my-4 items-center gap-2 mt-6 lg:w-1/2 m-auto" method="GET">
            <div className="flex flex-col gap-2 lg:flex-row w-full">
                <div>
                    <select
                        className="border border-gray-400 p-2 cursor-pointer outline-none"
                        defaultValue={defaultType || "ALl Types"}
                        name="type"
                        required
                    >
                        <option value="All Types">All Types</option>
                        <option value="Image">Images</option>
                        <option value="Video">Videos</option>
                        <option value="Audio">Audio</option>
                        <option value="Text">Text</option>
                        <option value="Compressed">Compressed/Archives</option>
                        <option value="Unknown">Other</option>
                    </select>
                </div>
                <div className="flex-1 flex flex-col lg:flex-row gap-4">
                    <input
                        className="border border-gray-400 grow p-2 outline-none"
                        placeholder="Query"
                        defaultValue={defaultQuery as string}
                        name="q"
                        type="text"
                    />
                    <button className="border border-gray-400 p-2 cursor-pointer" type="submit">Search</button>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div>
                    <label className="text-lg font-bold" htmlFor="created-before">Created before</label>
                    <input id="created-before" name="beforeDate" defaultValue={defaultBeforeDate as string} type="date" />
                </div>
                <div>
                    <label className="text-lg font-bold" htmlFor="created-after">Created after</label>
                    <input id="created-after" name="afterDate" defaultValue={defaultAfterDate as string} type="date" />
                </div>
            </div>
        </form>
    )
}