/* @vitest-environment jsdom */

import React from "react";
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LanguageProvider } from "../../context/LanguageContext.jsx";
import { ConsumerProvider } from "../../context/ConsumerContext.jsx";
import { OrderCartProvider } from "../../context/OrderCartContext.jsx";
import { OwnerProvider } from "../../context/OwnerContext.jsx";
import { CrmProvider } from "../../context/CrmContext.jsx";
import { OperatorProvider } from "../../context/OperatorContext.jsx";
import { VenueProvider } from "../../context/VenueContext.jsx";
import { DistributorProvider } from "../../context/DistributorContext.jsx";
import { CartProvider } from "../../context/CartContext.jsx";
import PublicMenuPage from "../PublicMenuPage.jsx";

// The public menu page's restaurant-name/logo links must point at the canonical profile
// (/restaurants/{state}/{city}/{slug}); the legacy /restaurants/{slug} form 301s.

// jsdom lacks these browser APIs; the page only uses them for layout/visibility.
class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}
globalThis.ResizeObserver ||= NoopObserver;
globalThis.IntersectionObserver ||= NoopObserver;
window.matchMedia ||= () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
window.scrollTo = () => {};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Same provider stack as App.jsx.
function AppProviders({ children }) {
  return (
    <ConsumerProvider>
      <OwnerProvider>
        <CrmProvider>
          <OperatorProvider>
            <VenueProvider>
              <DistributorProvider>
                <CartProvider>
                  <LanguageProvider>
                    <OrderCartProvider>{children}</OrderCartProvider>
                  </LanguageProvider>
                </CartProvider>
              </DistributorProvider>
            </VenueProvider>
          </OperatorProvider>
        </CrmProvider>
      </OwnerProvider>
    </ConsumerProvider>
  );
}

function menuPayload(overrides = {}) {
  return {
    ok: true,
    restaurant_id: "67179",
    restaurant_name: "McDonald's",
    name: "McDonald's",
    slug: "mcdonalds-houston-mo-37-314-91-959",
    city: "Houston",
    state: "MO",
    category: "QSR",
    menus: [{ id: 1, name: "Menu", is_currently_active: true }],
    selected_menu_id: 1,
    sections: [
      { id: 10, name: "Burgers", items: [{ id: 100, name: "Big Mac", price: 5.99 }] },
    ],
    ...overrides,
  };
}

async function profileHrefs(payload) {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
    const href = String(url);
    if (/\/public\/restaurants\/67179\/menu/.test(href)) {
      return new Response(JSON.stringify(payload), { status: 200 });
    }
    return new Response("{}", { status: 200 });
  });
  render(
    <MemoryRouter initialEntries={["/public/restaurants/67179/menu"]}>
      <AppProviders>
        <Routes>
          <Route path="/public/restaurants/:id/menu" element={<PublicMenuPage />} />
        </Routes>
      </AppProviders>
    </MemoryRouter>
  );
  let hrefs = [];
  await waitFor(() => {
    hrefs = [...document.querySelectorAll("a[href]")]
      .map((a) => a.getAttribute("href").split("?")[0])
      .filter((h) => h.startsWith("/restaurants/") && !h.includes("/menu"));
    expect(hrefs.length).toBeGreaterThan(0);
  });
  return hrefs;
}

describe("PublicMenuPage profile links", () => {
  it("link to the canonical profile when the payload has city/state", async () => {
    const hrefs = await profileHrefs(menuPayload());
    expect(new Set(hrefs)).toEqual(
      new Set(["/restaurants/missouri/houston/mcdonalds-houston-mo-37-314-91-959"])
    );
  });

  it("keep the legacy slug link when the payload has no location", async () => {
    const hrefs = await profileHrefs(menuPayload({ city: null, state: null }));
    expect(new Set(hrefs)).toEqual(new Set(["/restaurants/mcdonalds-houston-mo-37-314-91-959"]));
  });
});
