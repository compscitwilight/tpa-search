import { useState, useEffect } from "react";

import {
  Chart as ChartJS, CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { SearchBox } from "../components/SearchBox";
import { NodeTypeColors } from "../components/SearchResultType";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function HomePage() {
  const [recordsCount, setRecordsCount] = useState<Array<{ entityName: string, count: number }>>();

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/size`)
      .then(async (response) => {
        if (!response.ok) {
          console.warn(`Failed to retrieve database size: ${response.status}`);
          return;
        }

        setRecordsCount(await response.json());
      })
  }, [setRecordsCount])

  return (
    <div className="mt-6">
      <SearchBox />
      <div className="mt-8 text-center">
        <h1 className="text-3xl">The Pony Archive Search</h1>
        <span className="flex flex-wrap items-center gap-1 justify-center">
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

        {recordsCount && <Bar
          className="lg:w-1/2 m-auto mt-8"
          options={{
            animation: false,
            scales: {
              y: {
                grid: {
                  display: true,
                  color: "#999",
                  lineWidth: 1
                }
              }
            }
          }}
          data={{
            labels: recordsCount.map((e) => e.entityName),
            datasets: [
              {
                label: "",
                borderRadius: 0,
                data: recordsCount.map((e) => e.count),
                backgroundColor: recordsCount.map((e) => NodeTypeColors[e.entityName]),
                borderColor: "#000",
                borderWidth: 2
              }
            ]
          }}
        />}
      </div>
    </div>
  )
}