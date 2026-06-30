import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MenuUploadCompletionNextSteps, {
  buildOperatorLoginResumeState,
} from "../MenuUploadCompletionNextSteps.jsx";

describe("MenuUploadCompletionNextSteps", () => {
  it("routes signup sign-in through operator login with Menu Lab destination", () => {
    render(
      <MemoryRouter>
        <MenuUploadCompletionNextSteps
          isOperatorFlow={false}
          restaurantId={42}
          email="owner@example.com"
          restaurantName="Test Bistro"
        />
      </MemoryRouter>
    );

    const signIn = screen.getByRole("link", { name: "Sign in to My Account" });
    expect(signIn.getAttribute("href")).toBe("/operator/login");
    expect(buildOperatorLoginResumeState({
      email: "owner@example.com",
      restaurantId: 42,
      restaurantName: "Test Bistro",
    })).toEqual({
      email: "owner@example.com",
      nextPath: "/operator/menulab",
      restaurant_id: 42,
      restaurant_name: "Test Bistro",
    });

    const preview = screen.getByRole("link", { name: "Preview your menu" });
    expect(preview.getAttribute("href")).toBe("/public/restaurants/42/menu");
  });

  it("links operator flow directly to Menu Lab", () => {
    render(
      <MemoryRouter>
        <MenuUploadCompletionNextSteps isOperatorFlow restaurantId={42} />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: "Back to Menu Lab" }).getAttribute("href")).toBe(
      "/operator/menulab"
    );
  });
});
