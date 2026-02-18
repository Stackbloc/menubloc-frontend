// menubloc-frontend/src/App.jsx

import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import EasyMenuLanding from "./pages/EasyMenuLanding";
import GrubbidHome from "./pages/GrubbidHome";
import GrubbidSearch from "./pages/GrubbidSearch";
import RestaurantProfile from "./pages/RestaurantProfile";

export default function App() {
  const hostname = window.location.hostname;

  const isEasyMenu =
    hostname === "easymenuupload.com" ||
    hostname === "www.easymenuupload.com";

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={isEasyMenu ? <EasyMenuLanding /> : <GrubbidHome />}
        />
        <Route path="/search" element={<GrubbidSearch />} />
        <Route path="/restaurant/:id" element={<RestaurantProfile />} />
      </Routes>
    </BrowserRouter>
  );
}
