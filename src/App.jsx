// menubloc-frontend/src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";

import EasyMenuLanding from "./pages/EasyMenuLanding";
import GrubbidHome from "./pages/GrubbidHome";
import GrubbidSearch from "./pages/GrubbidSearch";
import RestaurantProfile from "./pages/RestaurantProfile";
import Signup from "./pages/Signup";

export default function App() {
  const hostname = window.location.hostname;

  const isEasyMenu =
    hostname === "easymenuupload.com" || hostname === "www.easymenuupload.com";

  return (
    <BrowserRouter>
      <Routes>
        {/* Root route depends on domain */}
        <Route path="/" element={isEasyMenu ? <EasyMenuLanding /> : <GrubbidHome />} />

        {/* Keep the rest of Grubbid routes available on both domains */}
        <Route path="/search" element={<GrubbidSearch />} />

        {/* Restaurant profile route (use whichever your app expects) */}
        <Route path="/restaurant/:id" element={<RestaurantProfile />} />

        {/* If you still use signup */}
        <Route path="/signup" element={<Signup />} />

        {/* Optional: simple fallback */}
        <Route path="*" element={isEasyMenu ? <EasyMenuLanding /> : <GrubbidHome />} />
      </Routes>
      <Analytics />
    </BrowserRouter>
  );
}
