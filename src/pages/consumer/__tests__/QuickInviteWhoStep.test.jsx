/* @vitest-environment jsdom */

/** Quick Invite step 1 as a checklist (app quick-invite.tsx, 2026-11-13). */
import React, { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import QuickInviteWhoStep from "../QuickInviteWhoStep.jsx";

afterEach(cleanup);

const peers = [
  { id: 31, name: "Maya Lee", avatarUrl: null, favoriteFoods: ["Pancakes", "Tacos", "Ramen"] },
  { id: 32, name: "Jordan Park", avatarUrl: null, favoriteFoods: [] },
];

function Harness({ onNext }) {
  const [checked, setChecked] = useState(new Set());
  const [picked, setPicked] = useState([]);
  const allOn = peers.every((p) => checked.has(p.id));
  return (
    <QuickInviteWhoStep
      peers={peers}
      checked={checked}
      onToggle={(id) => setChecked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; })}
      onToggleAll={() => setChecked(allOn ? new Set() : new Set(peers.map((p) => p.id)))}
      picked={picked}
      onPicked={setPicked}
      signedIn
      count={checked.size + picked.length}
      onNext={onNext}
    />
  );
}

describe("QuickInviteWhoStep", () => {
  it("lists Connects with round checks and a Favs cue; Next is off until someone is checked", () => {
    const onNext = vi.fn();
    render(<Harness onNext={onNext} />);
    expect(screen.getByText("Quick Invite")).toBeTruthy();
    expect(screen.getByTestId("quick-invite-connect-31").textContent).toMatch(/Favs pancakes, tacos/);
    const next = screen.getByTestId("quick-invite-next");
    expect(next.disabled).toBe(true);
    expect(next.textContent).toBe("Next ›");
    fireEvent.click(screen.getByTestId("quick-invite-connect-31"));
    expect(screen.getByTestId("quick-invite-connect-31").getAttribute("aria-checked")).toBe("true");
    expect(next.textContent).toBe("Next (1) ›");
    fireEvent.click(next);
    expect(onNext).toHaveBeenCalled();
  });

  it("Open Invite · All my Connects checks everyone; tapping again clears", () => {
    render(<Harness onNext={() => {}} />);
    const all = screen.getByTestId("quick-invite-all");
    expect(all.textContent).toMatch(/Open Invite/);
    expect(all.textContent).toMatch(/All my Connects/);
    fireEvent.click(all);
    expect(screen.getByTestId("quick-invite-next").textContent).toBe("Next (2) ›");
    expect(all.getAttribute("aria-checked")).toBe("true");
    fireEvent.click(all);
    expect(screen.getByTestId("quick-invite-next").textContent).toBe("Next ›");
  });

  it("Not a Connect? adds a typed name (they get the link from you)", () => {
    render(<Harness onNext={() => {}} />);
    fireEvent.click(screen.getByTestId("quick-invite-not-connect"));
    fireEvent.change(screen.getByTestId("quick-invite-typed-name"), { target: { value: "Rose" } });
    fireEvent.click(screen.getByTestId("quick-invite-who-typed"));
    expect(screen.getByTestId("quick-invite-picked-typed-rose").textContent).toMatch(/You send the link/);
    expect(screen.getByTestId("quick-invite-next").textContent).toBe("Next (1) ›");
  });
});
