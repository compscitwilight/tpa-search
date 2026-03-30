import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import "./index.css";

import Home from "./pages/home.tsx";
import Search from "./pages/search.tsx";
import Download from "./pages/download.tsx";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <div className="bg-black text-white py-4 lg:px-16">
        <a className="text-2xl text-nowrap" href="/">The Pony Archive Search</a>
      </div>
      <form action="/search" className="flex flex-col lg:flex-row items-center gap-2 mt-6 lg:w-1/2 m-auto" method="GET">
        <div className="flex-1">
          <select className="border border-gray-400 p-2 cursor-pointer outline-none" name="type">
            <option>All Types</option>
            <option value="Image">Images</option>
            <option value="Video">Videos</option>
            <option value="Audio">Audio</option>
            <option value="Text">Text</option>
            <option value="Compressed">Compressed/Archives</option>
            <option value="Unknown">Other</option>
          </select>
        </div>
        <div className="flex flex-col lg:flex-row gap-4">
          <input className="border border-gray-400 p-2 outline-none" placeholder="Query" name="q" type="text" required />
          <button className="border border-gray-400 p-2 cursor-pointer" type="submit">Search</button>
        </div>
      </form>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/download" element={<Download />} />
      </Routes>
      <footer className="mt-8"></footer>
    </BrowserRouter>
  </StrictMode>,
)
