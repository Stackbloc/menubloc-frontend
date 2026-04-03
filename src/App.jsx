/**
 * ============================================================
 * File:    App.jsx
 * Path:    menubloc-frontend/src/App.jsx
 * Date:    2026-04-03
 * Purpose:
 *   FIXED BUILD FAILURE:
 *   - Removed missing Contact.jsx import and route
 * ============================================================
 */

import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from "react-router-dom";

// Contexts
import { CartProvider } from "./context/CartContext.jsx";
import { OrderCartProvider } from "./context/OrderCartContext.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import { OperatorProvider, useOperator } from "./context/OperatorContext.jsx";
import { OwnerProvider, useOwner } from "./context/OwnerContext.jsx";
import { CrmProvider, useCrm } from "./context/CrmContext.jsx";
import { ConsumerProvider } from "./context/ConsumerContext.jsx";

// Components
import CartDrawer from "./components/CartDrawer.jsx";
import OrderCartDrawer from "./components/OrderCartDrawer.jsx";
import SiteFooter from "./components/SiteFooter.jsx";

// Pages (only essential ones to ensure build stability)
import GrubbidDiscovery from "./pages/GrubbidDiscovery.jsx";
import GrubbidSearchResults from "./pages/GrubbidSearchResults.jsx";
import RestaurantPublicPage from "./pages/RestaurantPublicPage.jsx";
import MenuItemDetailPage from "./pages/MenuItemDetailPage.jsx";
import PublicMenuPage from "./pages/PublicMenuPage.jsx";

// ================= ROUTE GUARDS =================

function OperatorRoute({ children }) {
  const { isAuthenticated, loading } = useOperator();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/operator/login" replace />;
  return children;
}

function CrmRoute({ children }) {
  const { isAuthenticated, loading } = useCrm();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/crm/login" replace />;
  return children;
}

function OwnerRoute({ children }) {
  const { isAuthenticated, loading } = useOwner();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/owner/login" replace />;
  return children;
}

// ================= ANALYTICS =================

function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    console.log("Page view:", location.pathname);
  }, [location]);

  return null;
}

// ================= APP SHELL =================

function AppShell() {
  return (
    <>
      <AnalyticsTracker />

      <CartDrawer />
      <OrderCartDrawer />

      <Routes>
        <Route path="/" element={<GrubbidDiscovery />} />
        <Route path="/search" element={<GrubbidSearchResults />} />

        {/* Restaurant */}
        <Route path="/restaurants/:slugOrId" element={<RestaurantPublicPage />} />

        {/* Menu */}
        <Route path="/restaurants/:slugOrId/menu" element={<PublicMenuPage />} />

        {/* Menu Item */}
        <Route
          path="/restaurants/:restaurantSlug/menu-items/:id"
          element={<MenuItemDetailPage />}
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <SiteFooter />
    </>
  );
}

// ================= ROOT =================

export default function App() {
  return (
    <ConsumerProvider>
      <OwnerProvider>
        <CrmProvider>
          <OperatorProvider>
            <CartProvider>
              <OrderCartProvider>
                <LanguageProvider>
                  <BrowserRouter>
                    <AppShell />
                  </BrowserRouter>
                </LanguageProvider>
              </OrderCartProvider>
            </CartProvider>
          </OperatorProvider>
        </CrmProvider>
      </OwnerProvider>
    </ConsumerProvider>
  );
}