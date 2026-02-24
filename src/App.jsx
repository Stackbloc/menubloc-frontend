import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import GrubbidDiscovery from "./pages/GrubbidDiscovery.jsx";
import GrubbidSearchResults from "./pages/GrubbidSearchResults.jsx";
import RestaurantSignup from "./pages/RestaurantSignup.jsx";
import RestaurantPublicPage from "./pages/RestaurantPublicPage.jsx";
import MenuPage from "./pages/MenuPage.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home */}
        <Route path="/" element={<GrubbidDiscovery />} />

        {/* Search */}
        <Route path="/search" element={<GrubbidSearchResults />} />

        {/* ✅ Restaurant onboarding (canonical) */}
        <Route path="/signup" element={<RestaurantSignup />} />

        {/* Public restaurant */}
        <Route path="/r/:slug" element={<RestaurantPublicPage />} />

        {/* Menu */}
        <Route path="/menu/:restaurantId" element={<MenuPage />} />

        {/* Safety */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}