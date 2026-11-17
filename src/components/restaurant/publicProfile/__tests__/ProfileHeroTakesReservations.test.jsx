/**
 * Reservations, finishing Phase 4 (2026-11-17): "Takes reservations" after Est. on the restaurant
 * page, only when the restaurant switched it on and the diner has the reservations flag.
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ProfileHero from "../ProfileHero.jsx";
import { FLAGS_OFF, parseFeatureFlags } from "../../../../hooks/useConsumerFeatureFlags.js";

const hero = (props) =>
  render(
    <MemoryRouter>
      <ProfileHero name="Casa Verde" profileType="restaurant" venueLabel="Taqueria" establishedLabel="Est. 1998" {...props} />
    </MemoryRouter>
  );

describe("Takes reservations", () => {
  it("the flag is read and is off by default", () => {
    expect(FLAGS_OFF.reservations).toBe(false);
    expect(parseFeatureFlags({ flags: { reservations: true } }).reservations).toBe(true);
    expect(parseFeatureFlags({ flags: {} }).reservations).toBe(false);
  });

  it("shows after Est. when on", () => {
    hero({ takesReservations: true });
    expect(screen.getByTestId("profile-hero-takes-reservations").textContent).toBe(" · Takes reservations");
  });

  it("is hidden when off", () => {
    hero({ takesReservations: false });
    expect(screen.queryByTestId("profile-hero-takes-reservations")).toBeNull();
  });
});
