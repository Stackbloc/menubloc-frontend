/* @vitest-environment jsdom */

import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DinerSupportDialog } from "../DiscoveryDrawer.jsx";

const SUPPORT_REASONS = [
  "Incorrect menu or restaurant information",
  "Account or sign-in help",
  "Problem with Menuply search or recommendations",
  "Accessibility issue",
  "Privacy or safety concern",
  "Technical problem",
  "Other",
];

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("diner support dialog", () => {
  it("shows diner reasons and directs restaurant order issues to the restaurant", () => {
    render(<DinerSupportDialog open onClose={() => {}} />);

    expect(screen.getByText(/Food quality, order, delivery, refund, and billing issues/)).toBeTruthy();
    for (const reason of SUPPORT_REASONS) {
      expect(screen.getByRole("option", { name: reason })).toBeTruthy();
    }
  });

  it("submits a support contact request through the existing contact endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<DinerSupportDialog open onClose={() => {}} initialName="Andre Barber" initialEmail="andre@example.com" />);
    fireEvent.change(screen.getByLabelText("Contact reason"), { target: { value: "Technical problem" } });
    fireEvent.change(screen.getByLabelText("Message"), { target: { value: "The diner menu does not load." } });
    fireEvent.click(screen.getByRole("button", { name: "Send to Menuply Support" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, request] = fetchMock.mock.calls[0];
    const body = JSON.parse(request.body);
    expect(url).toContain("/api/contact");
    expect(body.topic).toBe("support");
    expect(body.subject).toBe("Diner support: Technical problem");
    expect(screen.getByText(/Your message was sent to Menuply Support/)).toBeTruthy();
  });
});
