import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";

import EasyMenuLanding from "./pages/EasyMenuLanding";
import GrubbidHome from "./pages/GrubbidHome";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<GrubbidHome />} />
      </Routes>

      <Analytics />
    </BrowserRouter>
  );
}