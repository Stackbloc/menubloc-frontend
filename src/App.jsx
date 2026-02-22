// menubloc-frontend/src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import GrubbidDiscovery from "./pages/GrubbidDiscovery";
import GrubbidSearchResults from "./pages/GrubbidSearchResults";
import RestaurantProfile from "./pages/RestaurantProfile";
import MenuItemProfile from "./pages/MenuItemProfile";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Primary consumer entry */}
        <Route path="/" element={<GrubbidDiscovery />} />

        {/* Search results */}
        <Route path="/search" element={<GrubbidSearchResults />} />

        {/* Restaurant onboarding / profile */}
        <Route path="/restaurant" element={<RestaurantProfile />} />
        <Route path="/restaurant/:id" element={<RestaurantProfile />} />

        {/* Menu item profile */}
        <Route path="/menu-item/:id" element={<MenuItemProfile />} />

        {/* Back-compat routes (if old links exist) */}
        <Route path="/discover" element={<Navigate to="/" replace />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}