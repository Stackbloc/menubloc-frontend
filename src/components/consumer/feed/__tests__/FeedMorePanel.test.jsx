/* @vitest-environment jsdom */
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const consumerState = { consumer: null, profile: null, logout: vi.fn() };
vi.mock("../../../../context/ConsumerContext.jsx", () => ({ useConsumer: () => consumerState }));

import FeedMorePanel from "../FeedMorePanel.jsx";

const open = (isAuthenticated) =>
  render(
    <MemoryRouter>
      <FeedMorePanel open onClose={() => {}} isAuthenticated={isAuthenticated} />
    </MemoryRouter>
  );

/** ☰ order = the app's (Andre 2026-11-18). */
describe("FeedMorePanel order", () => {
  it("signed in: Profile card + Events pinned, Connects open first, Sign out last in Account & Settings", () => {
    consumerState.consumer = { id: 1, email: "maya@example.com" };
    consumerState.profile = { display_name: "Maya" };
    open(true);
    expect(screen.getByTestId("feed-more-profile").textContent).toMatch(/Maya.*View profile/);
    expect(screen.getByTestId("feed-more-events").textContent).toMatch(/Parties and get-togethers near you/);
    const heads = screen.getAllByTestId(/^feed-more-section-/).map((n) => n.textContent.replace(/[+−]$/, ""));
    expect(heads).toEqual(["Connects", "Account & Settings", "Help", "Menuply"]);
    expect(screen.getByTestId("feed-more-find-connects")).toBeTruthy();
    expect(screen.queryByTestId("feed-more-logout")).toBeNull();
    fireEvent.click(screen.getByTestId("feed-more-section-account"));
    const rows = screen.getByTestId("feed-more-section-account").nextSibling.querySelectorAll("li");
    expect(rows[rows.length - 1].textContent).toBe("Sign out");
    expect(screen.queryByTestId("feed-more-signup")).toBeNull();
    expect(screen.getByTestId("feed-more-terms")).toBeTruthy();
  });

  it("signed out: Sign in card, no Connects or Account, Help open", () => {
    consumerState.consumer = null;
    consumerState.profile = null;
    open(false);
    expect(screen.getByTestId("feed-more-profile").textContent).toMatch(/Sign in.*Sign in or create an account/);
    expect(screen.getByTestId("feed-more-profile").getAttribute("href")).toMatch(/^\/account\/login/);
    const heads = screen.getAllByTestId(/^feed-more-section-/).map((n) => n.textContent.replace(/[+−]$/, ""));
    expect(heads).toEqual(["Help", "Menuply"]);
    expect(screen.getByTestId("feed-more-feedback")).toBeTruthy();
  });
});
