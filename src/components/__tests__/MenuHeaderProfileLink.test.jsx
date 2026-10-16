/* @vitest-environment jsdom */

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "../../context/LanguageContext.jsx";
import MenuHeader from "../MenuHeader.jsx";

afterEach(cleanup);

function renderHeader(restaurant) {
  render(
    <MemoryRouter>
      <LanguageProvider>
        <MenuHeader restaurant={restaurant} />
      </LanguageProvider>
    </MemoryRouter>
  );
  return screen.getByRole("link", { name: restaurant.name }).getAttribute("href");
}

describe("MenuHeader profile link", () => {
  it("links to the canonical profile when city and state are known", () => {
    expect(
      renderHeader({ id: 67179, slug: "mcdonalds-houston-mo", name: "McDonald's", city: "Houston", state: "MO" })
    ).toBe("/restaurants/missouri/houston/mcdonalds-houston-mo");
  });

  it("keeps the id route when location is missing", () => {
    expect(renderHeader({ id: 67179, slug: "mcdonalds-houston-mo", name: "McDonald's" })).toBe("/restaurants/67179");
  });
});
