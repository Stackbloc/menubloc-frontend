/* @vitest-environment jsdom */

/** "Ask for review" under a CK moderation block (plan 73 PM1b, 2026-11-23). */
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ apiPost: vi.fn(async () => ({ ok: true, appeal: { id: 1, already: false } })) }));
vi.mock("../../lib/api.js", async (orig) => ({ ...(await orig()), ...api }));

import AskForReview from "../AskForReview.jsx";
import { isAppealableCode } from "../../lib/ckAppealsApi.js";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("isAppealableCode", () => {
  it("CK blocks on the Wall and My Vibe are appealable", () => {
    for (const c of ["wall_threat", "wall_hateful", "wall_no_links", "custom_vibe_hateful", "custom_vibe_no_contact"]) {
      expect(isAppealableCode(c)).toBe(true);
    }
  });
  it("form errors and other errors are not", () => {
    for (const c of ["wall_empty", "wall_too_long", "custom_vibe_too_long", "wall_invalid_size", "wall_slow_down", "not_signed_in", "", null]) {
      expect(isAppealableCode(c)).toBe(false);
    }
  });
});

describe("AskForReview", () => {
  it("one tap sends the exact text to CK and says it stays off", async () => {
    render(<AskForReview surface="wall" code="wall_hateful" text="flame retardant demo" size="small" />);
    fireEvent.click(screen.getByTestId("ask-for-review"));
    await waitFor(() => expect(screen.getByTestId("ask-for-review-sent")).toBeTruthy());
    expect(api.apiPost).toHaveBeenCalledWith("/api/ck/moderation/appeals", {
      surface: "wall", text: "flame retardant demo", size: "small", caption: false, message: null,
    });
    expect(screen.getByTestId("ask-for-review-sent").textContent).toMatch(/stays off/);
  });
  it("hidden for guests, form errors and empty text", () => {
    const { container: a } = render(<AskForReview signedIn={false} surface="wall" code="wall_threat" text="x" />);
    const { container: b } = render(<AskForReview surface="wall" code="wall_too_long" text="x" />);
    const { container: c } = render(<AskForReview surface="vibe" code="custom_vibe_threat" text="  " />);
    expect(a.innerHTML + b.innerHTML + c.innerHTML).toBe("");
  });
  it("a failed send shows why and can be tried again", async () => {
    api.apiPost.mockRejectedValueOnce(Object.assign(new Error("Appeals aren't open yet."), { status: 503 }));
    render(<AskForReview surface="vibe" code="custom_vibe_threat" text="go away" />);
    fireEvent.click(screen.getByTestId("ask-for-review"));
    await waitFor(() => expect(screen.getByText("Appeals aren't open yet.")).toBeTruthy());
    expect(screen.getByTestId("ask-for-review").disabled).toBe(false);
  });
});
