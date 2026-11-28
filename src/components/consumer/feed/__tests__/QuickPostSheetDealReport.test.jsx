/* @vitest-environment jsdom */
/**
 * Plan 78 (Andre 2026-11-28, video upload contract OK 2026-11-28): web Post → "Report a Deal".
 * Informational use only. The clip posts exactly as before (onSubmit); the report is sent after,
 * with the new post's id, and never undoes the post.
 */
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

const mockUpdate = vi.fn(async () => ({ ok: true }));
const mockApiPost = vi.fn(async () => ({ ok: true, deal_report: { deal_report_id: 9 } }));
vi.mock("../../../../lib/api.js", () => ({ apiPost: (...args) => mockApiPost(...args), apiGet: vi.fn() }));
vi.mock("../../../social/MenuplyMediaPicker.jsx", () => ({ default: () => null }));
vi.mock("../../../../lib/consumerCameraCapture.js", () => ({
  inlineCameraSupported: () => false,
  preferInlineCamera: () => false,
}));
vi.mock("../../../../lib/nativeVideoCapture.js", () => ({ normalizeNativeVideoFile: async (f) => f }));
vi.mock("../../../../lib/foodTypesApi.js", () => ({ searchFoodTypes: async () => [] }));
vi.mock("../../../../lib/consumerApi.js", () => ({ updateWhatIAteToday: (...args) => mockUpdate(...args) }));
vi.mock("../../../../lib/feedVideoCompose.js", () => ({ notifyFeedVideoPosted: vi.fn() }));
vi.mock("../../../../lib/foodActivityApi.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    searchReportPlaces: async ({ type, q }) =>
      type === "restaurant" && /bossa/i.test(q || "")
        ? { results: [{ restaurant_id: 78946, restaurant_name: "Bossa Nova", city: "Los Angeles", state: "CA" }] }
        : { results: [] },
  };
});

import QuickPostSheet from "../QuickPostSheet.jsx";

async function settle(ms = 300) {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });
}

async function withClip() {
  const clip = new File(["x"], "clip.mp4", { type: "video/mp4" });
  await act(async () => {
    fireEvent.change(screen.getByTestId("quick-post-upload-input"), { target: { files: [clip] } });
  });
  await screen.findByTestId("quick-post-where");
}

async function pickHome() {
  fireEvent.click(screen.getByTestId("quick-post-at-home"));
}

async function pickBossa() {
  fireEvent.change(screen.getByTestId("quick-post-where"), { target: { value: "bossa" } });
  await settle();
  fireEvent.click(screen.getByTestId("quick-post-place-78946"));
}

async function post() {
  await act(async () => {
    fireEvent.click(screen.getByTestId("quick-post-submit"));
  });
}

beforeEach(() => {
  mockUpdate.mockClear();
  mockApiPost.mockClear();
  globalThis.URL.createObjectURL = vi.fn(() => "blob:clip");
  globalThis.URL.revokeObjectURL = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);

describe("web Post → Report a Deal", () => {
  it("opened from Deals: ticked; listed restaurant + typed dish; report sent after the post", async () => {
    const onSubmit = vi.fn(async () => ({ id: 905 }));
    render(<QuickPostSheet open canReportDeal initialReportDeal onClose={() => {}} onSubmit={onSubmit} />);
    await withClip();
    expect(screen.getByTestId("quick-post-report-deal").checked).toBe(true);
    expect(screen.getByTestId("quick-post-report-deal-box").textContent).toContain("Add the restaurant above");
    await pickBossa();
    fireEvent.change(screen.getByTestId("quick-post-food"), { target: { value: "Pasta Carbonara" } });
    fireEvent.change(screen.getByTestId("quick-post-report-deal-note"), { target: { value: "Tuesday special, $9" } });
    await post();
    await settle(50);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(mockApiPost).toHaveBeenCalledWith("/api/consumer/deal-reports", {
      clip_id: 905,
      restaurant_id: 78946,
      dish_name: "Pasta Carbonara",
      description: "Tuesday special, $9",
    });
    expect(screen.getByTestId("quick-post-done-deal-report").textContent).toBe("Your deal report is in Deals.");
  });

  it("typed restaurant not on Menuply goes as its name", async () => {
    render(<QuickPostSheet open canReportDeal onClose={() => {}} onSubmit={async () => ({ id: 906 })} />);
    await withClip();
    fireEvent.click(screen.getByTestId("quick-post-report-deal"));
    fireEvent.change(screen.getByTestId("quick-post-where"), { target: { value: "Taco Stand Zed" } });
    await settle();
    await post();
    await settle(50);
    expect(mockApiPost).toHaveBeenCalledWith("/api/consumer/deal-reports", { clip_id: 906, place_name: "Taco Stand Zed" });
  });

  it("a refused report keeps the post and says why", async () => {
    mockApiPost.mockRejectedValueOnce(Object.assign(new Error("Verify your email to report a deal."), { status: 403, code: "email_not_verified" }));
    render(<QuickPostSheet open canReportDeal initialReportDeal onClose={() => {}} onSubmit={async () => ({ id: 907 })} />);
    await withClip();
    await pickBossa();
    await post();
    await settle(50);
    expect(screen.getByTestId("quick-post-done-title")).toBeTruthy();
    expect(screen.getByTestId("quick-post-done-deal-report").textContent).toBe(
      "Your clip posted, but the deal report didn't: Verify your email to report a deal."
    );
  });

  it("no restaurant → no post; unticked or guests → no report", async () => {
    const onSubmit = vi.fn(async () => ({ id: 908 }));
    render(<QuickPostSheet open canReportDeal initialReportDeal onClose={() => {}} onSubmit={onSubmit} />);
    await withClip();
    fireEvent.change(screen.getByTestId("quick-post-food"), { target: { value: "Dodger Dog" } });
    await post();
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("quick-post-report-deal"));
    await post();
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(mockApiPost).not.toHaveBeenCalled();
    cleanup();
    render(<QuickPostSheet open initialReportDeal onClose={() => {}} onSubmit={async () => undefined} />);
    await withClip();
    expect(screen.queryByTestId("quick-post-report-deal")).toBeNull();
  });
});
