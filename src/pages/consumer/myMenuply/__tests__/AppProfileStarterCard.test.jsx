/* @vitest-environment jsdom */

import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../../../lib/consumerApi.js", () => ({
  getLikedMenuItems: vi.fn(() => Promise.resolve({ likes: [1, 2, 3] })),
  listConsumerProfileMedia: vi.fn(() => Promise.resolve({ items: [1] })),
}));
vi.mock("../../../../components/share/ShareModal.jsx", () => ({
  default: () => <div data-testid="share-modal" />,
}));

import { AppProfileStarterCard, FoundingFoodieBadge } from "../AppProfileCards.jsx";
import { markSetup } from "../../../../lib/profileSetupMarks.js";

function renderCard(avatarUrl = "a.jpg") {
  return render(
    <MemoryRouter>
      <FoundingFoodieBadge />
      <AppProfileStarterCard avatarUrl={avatarUrl} />
    </MemoryRouter>
  );
}

describe("Set up your profile (web)", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(cleanup);

  it("has five steps: invite friends is step 4, invite out (or deals) step 5", async () => {
    renderCard();
    expect(await screen.findByText("3 of 5 done")).toBeTruthy();
    expect(screen.getByTestId("profile-starter-out").getAttribute("href")).toBe("/account/invite-to-eat");
    expect(screen.getByTestId("profile-starter-out-alt").getAttribute("href")).toBe("/feed/deals");
    fireEvent.click(screen.getByTestId("profile-starter-friends"));
    expect(screen.getByTestId("share-modal")).toBeTruthy();
    expect(await screen.findByText("4 of 5 done")).toBeTruthy();
  });

  it("all five done: the reward once, then the Founding Foodie badge", async () => {
    markSetup("friends");
    markSetup("out");
    renderCard();
    expect(await screen.findByTestId("profile-setup-reward")).toBeTruthy();
    expect(screen.queryByTestId("profile-founding-foodie")).toBeNull();
    act(() => fireEvent.click(screen.getByTestId("profile-setup-reward-done")));
    expect(screen.queryByTestId("profile-setup-reward")).toBeNull();
    expect(screen.getByTestId("profile-founding-foodie")).toBeTruthy();
    cleanup();
    renderCard();
    await act(() => Promise.resolve());
    expect(screen.queryByTestId("profile-setup-reward")).toBeNull();
    expect(screen.getByTestId("profile-founding-foodie")).toBeTruthy();
  });
});
