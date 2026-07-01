import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { PlatformIntelligenceShell } from "./intelligenceShared.jsx";
import IntelligenceOverview from "./IntelligenceOverview.jsx";
import IntelligenceSearchDemand from "./IntelligenceSearchDemand.jsx";
import IntelligenceSiteActivity from "./IntelligenceSiteActivity.jsx";
import IntelligenceGeo from "./IntelligenceGeo.jsx";
import IntelligenceMenu from "./IntelligenceMenu.jsx";
import IntelligenceRestaurant from "./IntelligenceRestaurant.jsx";
import IntelligenceMarket from "./IntelligenceMarket.jsx";
import IntelligenceRevenue from "./IntelligenceRevenue.jsx";

export default function OwnerPlatformIntelligence() {
  return (
    <PlatformIntelligenceShell>
      <Routes>
        <Route index element={<IntelligenceOverview />} />
        <Route path="search-demand" element={<IntelligenceSearchDemand />} />
        <Route path="site-activity" element={<IntelligenceSiteActivity />} />
        <Route path="geo" element={<IntelligenceGeo />} />
        <Route path="menu" element={<IntelligenceMenu />} />
        <Route path="restaurant" element={<IntelligenceRestaurant />} />
        <Route path="market" element={<IntelligenceMarket />} />
        <Route path="revenue" element={<IntelligenceRevenue />} />
        <Route path="*" element={<Navigate to="/owner/intelligence" replace />} />
      </Routes>
    </PlatformIntelligenceShell>
  );
}
