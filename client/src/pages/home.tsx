export default function HomePage() {
  return (
    <div className="mt-6">
      <div className="text-center">
        <h1 className="text-3xl">The Pony Archive Search</h1>
        <span className="flex items-center gap-1 justify-center">
          <p>The unofficial open-source search engine for </p>
          <a className="text-sky-600 underline" href="https://theponyarchive.com" target="_blank">The Pony Archive</a>.
        </span>
        <div className="grid px-4 lg:grid-cols-2 gap-8 mt-4 lg:w-1/2 m-auto">
          <a
            href="https://github.com/compscitwilight/tpa-search"
            target="_blank"
            className="border border-gray-400/50 p-2 rounded-md"
          >View on GitHub</a>
          <a href="/download" className="border border-gray-400/50 p-2 rounded-md">Download the index</a>
        </div>
      </div>
    </div>
  )
}