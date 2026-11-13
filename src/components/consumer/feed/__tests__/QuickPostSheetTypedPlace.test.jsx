/* @vitest-environment jsdom */
/**
 * Andre 2026-11-12 (ssus ate:91): a restaurant typed in the Post sheet was lost when Post was tapped
 * without Enter or a suggestion. The typed words now always go with the post.
 */
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

vi.mock("../../../social/MenuplyMediaPicker.jsx", () => ({ default: () => null }));
vi.mock("../../../../lib/consumerCameraCapture.js", () => ({
  inlineCameraSupported: () => false,
  preferInlineCamera: () => false,
}));
vi.mock("../../../../lib/nativeVideoCapture.js", () => ({ normalizeNativeVideoFile: async (f) => f }));
vi.mock("../../../../lib/foodTypesApi.js", () => ({
  searchFoodTypes: async () => [{ name: "Taco" }],
}));
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

async function compose({ place, cancel = false }) {
  const onSubmit = vi.fn(async () => {});
  render(<QuickPostSheet open onClose={() => {}} onSubmit={onSubmit} />);
  const clip = new File(["x"], "clip.mp4", { type: "video/mp4" });
  await act(async () => {
    fireEvent.change(screen.getByTestId("quick-post-upload-input"), { target: { files: [clip] } });
  });
  fireEvent.change(await screen.findByTestId("quick-post-food"), { target: { value: "Taco" } });
  fireEvent.click(screen.getByTestId("quick-post-where-open"));
  fireEvent.change(screen.getByTestId("quick-post-where"), { target: { value: place } });
  // Let the type-ahead answer.
  await act(async () => {
    await new Promise((r) => setTimeout(r, 300));
  });
  if (cancel) fireEvent.click(screen.getByLabelText("Cancel restaurant"));
  await act(async () => {
    fireEvent.click(screen.getByTestId("quick-post-submit"));
  });
  expect(onSubmit).toHaveBeenCalledTimes(1);
  return onSubmit.mock.calls[0][0];
}

beforeEach(() => {
  globalThis.URL.createObjectURL = vi.fn(() => "blob:clip");
  globalThis.URL.revokeObjectURL = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);

describe("Post sheet keeps a typed restaurant", () => {
  it("posts a typed place not on Menuply without Enter or a chip tap", async () => {
    const payload = await compose({ place: "  Noodle   Corner " });
    expect(payload.whereType).toBe("other");
    expect(payload.restaurant).toMatchObject({ restaurant_id: null, restaurant_name: "Noodle Corner", typed_name: "Noodle Corner" });
    expect(payload.items[0]).toMatchObject({ food_name: "Taco", restaurant_id: null });
  });

  it("links an exact Menuply match and keeps the typed words", async () => {
    const payload = await compose({ place: "bossa nova" });
    expect(payload.whereType).toBe("restaurant");
    expect(payload.restaurant).toMatchObject({ restaurant_id: 78946, typed_name: "bossa nova" });
    expect(payload.items[0].restaurant_id).toBe(78946);
  });

  it("Cancel drops what was typed", async () => {
    const payload = await compose({ place: "Somewhere", cancel: true });
    expect(payload.whereType).toBe("other");
    expect(payload.restaurant).toBeNull();
  });
});
