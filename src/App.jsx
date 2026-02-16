import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import GrubbidHome from "./pages/GrubbidHome";
import GrubbidSearch from "./pages/GrubbidSearch";
import RestaurantProfile from "./RestaurantProfile";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GrubbidHome />} />
        <Route path="/search" element={<GrubbidSearch />} />
        <Route path="/restaurant" element={<RestaurantProfile />} />
      </Routes>
    </BrowserRouter>
  );
}
