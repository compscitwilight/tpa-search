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
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/download" element={<Download />} />
      </Routes>
      <footer className="mt-8"></footer>
    </BrowserRouter>
  </StrictMode>,
)
