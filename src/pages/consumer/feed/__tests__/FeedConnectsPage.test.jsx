/* @vitest-environment jsdom */

/**
 * Connects page (Andre 2026-11-01): Connect Summary color-coded, nothing-on Connects under
 * "No activities planned", Pending Connects + Find Connects in one box below.
 */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const removeConnection = vi.fn(async () => ({ ok: true }));
const peer = (id, name, vibe) => ({
  id,
  display_name: name,
  current_vibe: vibe || "open_for_suggestions",
  current_vibe_meta: vibe ? { label: "Open for lunch", expires_at: new Date(Date.now() + 3600e3).toISOString() } : { label: "Open for suggestions" },
});
vi.mock("../../../../context/ConsumerContext.jsx", () => ({ useConsumer: () => ({ isAuthenticated: true, loading: false }) }));
vi.mock("../../../../lib/useFeedShellDesktop.js", () => ({ useFeedShellDesktop: () => false }));
vi.mock("../../myMenuply/ConnectsNowSection.jsx", () => ({ default: () => null }));
vi.mock("../../../../lib/consumerApi.js", () => ({
  listConnections: async () => ({
    accepted: [{ id: 1, peer: peer(30, "Abe") }, { id: 2, peer: peer(31, "Zed", "open_for_lunch") }],
    pending_incoming: [{ id: 3, peer: peer(40, "Chloe N.") }],
    pending_outgoing: [{ id: 4, peer: peer(41, "Aisha J.") }],
  }),
  acceptConnection: vi.fn(),
  declineConnection: vi.fn(),
  removeConnection: (...a) => removeConnection(...a),
}));

const { default: FeedConnectsPage } = await import("../FeedConnectsPage.jsx");

describe("FeedConnectsPage", () => {
  it("summary first (active colored, idle grouped), pending box below", async () => {
    render(
      <MemoryRouter>
        <FeedConnectsPage />
      </MemoryRouter>
    );
    expect(await screen.findByText("Connect Summary · 2")).toBeTruthy();
    expect(screen.getByTestId("connect-31-line").textContent).toMatch(/^Open for lunch · /);
    expect(screen.getByTestId("connect-31-line").style.color).toBe("rgb(217, 119, 6)");
    expect(screen.getByText("No activities planned · 1")).toBeTruthy();
    expect(screen.getByTestId("connects-idle").contains(screen.getByTestId("connect-30"))).toBe(true);
    const list = screen.getByTestId("connects-list");
    const pending = screen.getByTestId("connects-pending");
    expect(list.compareDocumentPosition(pending) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText("Pending Connects · 2")).toBeTruthy();
    expect(pending.contains(screen.getByTestId("profile-find-diners"))).toBe(true);
    expect(screen.queryByText(/Sent and waiting/)).toBeNull();
    fireEvent.click(screen.getByLabelText("Cancel request to Aisha J."));
    await waitFor(() => expect(screen.queryByTestId("connect-sent-41")).toBeNull());
    expect(removeConnection).toHaveBeenCalledWith(4);
  });
});
