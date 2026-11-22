/* @vitest-environment jsdom */
/**
 * 2026-11-22: signed out, Add a menu sends you to sign in with next=/menu-capture exactly once, even
 * when opened from inside the site (it used to wrap next twice:
 * /account/login?next=/account/login?next=/menu-capture).
 */
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

vi.mock("../../context/ConsumerContext.jsx", () => ({
  useConsumer: () => ({ isAuthenticated: false, loading: false, consumer: null }),
}));
vi.mock("../../context/LanguageContext.jsx", () => ({ useLanguage: () => ({ t: (k) => k }) }));
vi.mock("../../components/StickyPageHeader.jsx", () => ({ default: () => null }));

import MenuCapturePage from "../MenuCapturePage.jsx";

afterEach(cleanup);

function Login() {
  const loc = useLocation();
  return <p data-testid="login">{loc.search}</p>;
}

describe("Add a menu sign-in redirect", () => {
  it("opened from inside the site, signed out: one next=/menu-capture", () => {
    render(
      <MemoryRouter initialEntries={["/feed/search"]}>
        <Routes>
          <Route path="/feed/search" element={<Link to="/menu-capture">Add a menu</Link>} />
          <Route path="/menu-capture" element={<MenuCapturePage />} />
          <Route path="/account/login" element={<Login />} />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText("Add a menu"));
    expect(screen.getByTestId("login").textContent).toBe("?next=%2Fmenu-capture");
  });

  it("keeps the restaurant in next when there is one", () => {
    render(
      <MemoryRouter initialEntries={["/menu-capture?restaurant_id=55"]}>
        <Routes>
          <Route path="/menu-capture" element={<MenuCapturePage />} />
          <Route path="/account/login" element={<Login />} />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByTestId("login").textContent).toBe(`?next=${encodeURIComponent("/menu-capture?restaurant_id=55")}`);
  });
});
