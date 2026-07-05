/* @vitest-environment jsdom */

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { ConsumerLegacyRedirect } from "../App.jsx";

afterEach(cleanup);

function LocationProbe() {
  const location = useLocation();
  return (
    <div data-testid="location-probe">
      {location.pathname}
      {location.search}
      {location.hash}
    </div>
  );
}

describe("ConsumerLegacyRedirect", () => {
  it("preserves search and hash when redirecting legacy reset-password links", async () => {
    render(
      <MemoryRouter initialEntries={["/reset-password?token=abc123#email"]}>
        <Routes>
          <Route path="/reset-password" element={<ConsumerLegacyRedirect nextPath="/account/reset-password" />} />
          <Route path="/account/reset-password" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    );

    expect((await screen.findByTestId("location-probe")).textContent).toBe("/account/reset-password?token=abc123#email");
  });
});
