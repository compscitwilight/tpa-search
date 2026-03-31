export default function DownloadPage() {
    return (
        <div className="mt-8 lg:w-1/2 m-auto">
            <h1 className="text-3xl">Download the index</h1>
            <p>
                A publicly available dump of the index used by tpa-search
                is accessible <a
                    className="text-sky-600 underline"
                    target="_blank"
                    href="https://dumps.search.twilight.horse/public.sql.gz"
                >here</a> (112.91 MB).
            </p>

            <h2 className="mt-4 text-2xl">Downloading with a command line (with <code>wget</code>)</h2>
            <pre className="bg-gray-400/50 p-1 my-4 text-lg">
                <code className="text-purple-400">wget</code>
                <code className="text-yellow-700"> https://dumps.search.twilight.horse/public.sql.gz</code>
            </pre>
        </div>
    )
}