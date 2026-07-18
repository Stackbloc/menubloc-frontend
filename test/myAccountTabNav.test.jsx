/**
 * @vitest-environment jsdom
 *
 * Verifies My Account tab navigation: local panel state + URL via navigate/Link pattern.
 */
import React, { useEffect, useState } from "react";
import { describe, it, expect } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useNavigate, useSearchParams, Link } from "react-router-dom";

function normalizeTab(raw) {
  const id = String(raw || "").toLowerCase();
  return ["profile", "menu", "settings", "password"].includes(id) ? id : "profile";
}

function myAccountHref(tabId) {
  return `/operator/my-account?tab=${normalizeTab(tabId)}`;
}

/** Mirrors OperatorMyAccount selectTab pattern (local state + navigate). */
function Page() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlTab = normalizeTab(searchParams.get("tab"));
  const [tab, setTab] = useState(urlTab);

  useEffect(() => {
    setTab(urlTab);
  }, [urlTab]);

  function selectTab(nextTab) {
    const normalized = normalizeTab(nextTab);
    setTab(normalized);
    navigate(myAccountHref(normalized), { replace: true });
  }

  return (
    <div>
      <div data-testid="active-tab">{tab}</div>
      {["menu", "settings", "password"].map((id) => (
        <Link
          key={id}
          to={myAccountHref(id)}
          replace
          onClick={(event) => {
            event.preventDefault();
            selectTab(id);
          }}
        >
          {id}
        </Link>
      ))}
      {tab === "menu" ? <div data-testid="panel-menu">Menu panel</div> : null}
      {tab === "settings" ? <div data-testid="panel-settings">Settings panel</div> : null}
      {tab === "password" ? <div data-testid="panel-password">Password panel</div> : null}
    </div>
  );
}

function App({ initial = "/operator/my-account" }) {
  return (
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route path="/operator/my-account" element={<Page />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("My Account tab navigation", () => {
  it("switches Menu / Settings / Password panels via selectTab", async () => {
    render(<App />);
    expect(screen.getByTestId("active-tab").textContent).toBe("profile");

    await act(async () => {
      screen.getByText("menu").click();
    });
    await waitFor(() => {
      expect(screen.getByTestId("active-tab").textContent).toBe("menu");
      expect(screen.getByTestId("panel-menu")).toBeTruthy();
    });

    await act(async () => {
      screen.getByText("settings").click();
    });
    await waitFor(() => {
      expect(screen.getByTestId("active-tab").textContent).toBe("settings");
      expect(screen.getByTestId("panel-settings")).toBeTruthy();
    });

    await act(async () => {
      screen.getByText("password").click();
    });
    await waitFor(() => {
      expect(screen.getByTestId("active-tab").textContent).toBe("password");
      expect(screen.getByTestId("panel-password")).toBeTruthy();
    });
  });

  it("hydrates from URL tab=settings", () => {
    render(<App initial="/operator/my-account?tab=settings" />);
    expect(screen.getByTestId("active-tab").textContent).toBe("settings");
    expect(screen.getByTestId("panel-settings")).toBeTruthy();
  });
});
