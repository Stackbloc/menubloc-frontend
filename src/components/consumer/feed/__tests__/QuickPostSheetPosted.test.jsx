/* @vitest-environment jsdom */
/**
 * Andre 2026-11-14 Post redesign (web = app): Capture Your Clip → Tag Your Clip → Posted! with an
 * optional "I Paid $" and Edit Tags on the live post. Posted! says only where the clip really went.
 */
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

const mockUpdate = vi.fn(async () => ({ ok: true }));
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
  await screen.findByTestId("quick-post-where-open");
}

async function pickHome() {
  fireEvent.click(screen.getByTestId("quick-post-at-home"));
}

async function pickBossa() {
  fireEvent.click(screen.getByTestId("quick-post-where-open"));
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
  globalThis.URL.createObjectURL = vi.fn(() => "blob:clip");
  globalThis.URL.revokeObjectURL = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);

describe("Post sheet redesign (Andre 2026-11-14)", () => {
  it("Capture Your Clip: the record tip, no Posting about pills; then Tag Your Clip", async () => {
    render(<QuickPostSheet open onClose={() => {}} onSubmit={async () => null} />);
    expect(screen.getByTestId("quick-post-title").textContent).toBe("Capture Your Clip");
    expect(screen.getByTestId("quick-post-tip").textContent).toBe("📷 Record up to 90 seconds.Close-ups in good light look best.");
    expect(screen.queryByText("Posting about")).toBeNull();
    expect(screen.getByTestId("quick-post-logo").textContent).toBe("Menuply");
    await withClip();
    expect(screen.getByTestId("quick-post-title").textContent).toBe("Tag Your Clip");
    // Where first: Restaurant / Home, no "What food" box until one is picked.
    expect(screen.queryByTestId("quick-post-food")).toBeNull();
    await pickHome();
    expect(screen.getByTestId("quick-post-food")).toBeTruthy();
  });

  it("Posted! says the Feed and the restaurant's page, never the Wall; Done saves the price", async () => {
    const onClose = vi.fn();
    render(<QuickPostSheet open onClose={onClose} onSubmit={async () => ({ id: 901 })} />);
    await withClip();
    await pickBossa();
    fireEvent.change(screen.getByTestId("quick-post-food"), { target: { value: "Caesar Salad" } });
    await post();
    expect(screen.getByTestId("quick-post-done-title").textContent).toBe("Posted!");
    expect(screen.getByTestId("quick-post-done-where").textContent).toBe("Your clip is in the Feed and on Bossa Nova's page.");
    expect(screen.queryByText(/Wall/)).toBeNull();
    expect(screen.getByTestId("quick-post-done-place").textContent).toBe("Bossa Nova");
    expect(screen.getByTestId("quick-post-done-food").textContent).toBe("Caesar Salad");
    // A bad price says so and nothing is saved.
    fireEvent.change(screen.getByTestId("quick-post-price-input"), { target: { value: "12.5.0" } });
    await act(async () => fireEvent.click(screen.getByTestId("quick-post-done-button")));
    expect(screen.getByTestId("quick-post-error").textContent).toBe("Enter a price like 12.50 (up to $1,000).");
    expect(mockUpdate).not.toHaveBeenCalled();
    fireEvent.change(screen.getByTestId("quick-post-price-input"), { target: { value: "$12.50" } });
    fireEvent.click(screen.getByTestId("quick-post-price-show"));
    await act(async () => fireEvent.click(screen.getByTestId("quick-post-done-button")));
    expect(mockUpdate).toHaveBeenCalledWith(901, { price_paid_cents: 1250, show_price: false });
    expect(onClose).toHaveBeenCalled();
  });

  it("Home: only the Feed; Done with no price saves nothing and closes", async () => {
    const onClose = vi.fn();
    render(<QuickPostSheet open onClose={onClose} onSubmit={async () => ({ id: 902 })} />);
    await withClip();
    await pickHome();
    fireEvent.change(screen.getByTestId("quick-post-food"), { target: { value: "Dodger Dog" } });
    await post();
    expect(screen.getByTestId("quick-post-done-where").textContent).toBe("Your clip is in the Feed.");
    await act(async () => fireEvent.click(screen.getByTestId("quick-post-done-button")));
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("Edit Tags: Save changes the live post (no second post), ‹ goes back unsaved", async () => {
    const onSubmit = vi.fn(async () => ({ id: 903 }));
    render(<QuickPostSheet open onClose={() => {}} onSubmit={onSubmit} />);
    await withClip();
    await pickHome();
    fireEvent.change(screen.getByTestId("quick-post-food"), { target: { value: "Dodger Dog" } });
    await post();
    fireEvent.click(screen.getByTestId("quick-post-edit-tags"));
    expect(screen.getByTestId("quick-post-title").textContent).toBe("Edit Tags");
    fireEvent.click(screen.getByTestId("quick-post-edit-back"));
    expect(screen.getByTestId("quick-post-done-title")).toBeTruthy();
    expect(mockUpdate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("quick-post-edit-tags"));
    expect(screen.getByTestId("quick-post-submit").textContent).toBe("Save");
    fireEvent.click(screen.getByTestId("quick-post-place-chosen"));
    await pickBossa();
    await post();
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith(903, expect.objectContaining({ where_type: "restaurant", restaurant_id: 78946, food_name: "Dodger Dog", menu_item_id: null, is_recommend: false }));
    expect(screen.getByTestId("quick-post-done-where").textContent).toBe("Your clip is in the Feed and on Bossa Nova's page.");
  });

  it("guests (no post id back) never see Posted!", async () => {
    render(<QuickPostSheet open onClose={() => {}} onSubmit={async () => undefined} />);
    await withClip();
    await pickHome();
    fireEvent.change(screen.getByTestId("quick-post-food"), { target: { value: "Dodger Dog" } });
    await post();
    expect(screen.queryByTestId("quick-post-done")).toBeNull();
  });
});
