/* @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ClipVideoTile } from "../ConnectProfilePage.jsx";

// Andre 2026-11-04: a profile clip tile never shows a blank preview.
describe("ClipVideoTile", () => {
  it("shows the thumbnail when there is one", () => {
    render(<MemoryRouter><ClipVideoTile clip={{ media_url: "https://x/a.mp4", poster_url: "https://x/a.jpg" }} /></MemoryRouter>);
    expect(screen.getByTestId("clip-poster").getAttribute("src")).toContain("a.jpg");
    expect(screen.queryByTestId("clip-first-frame")).toBeNull();
  });
  it("no thumbnail yet: the clip's own first frame", () => {
    render(<MemoryRouter><ClipVideoTile clip={{ media_url: "https://x/a.mp4", poster_url: null }} /></MemoryRouter>);
    const v = screen.getByTestId("clip-first-frame");
    expect(v.getAttribute("src")).toMatch(/a\.mp4#t=0\.5$/);
    expect(v.getAttribute("preload")).toBe("metadata");
  });
  it("a broken thumbnail falls back to the first frame", () => {
    render(<MemoryRouter><ClipVideoTile clip={{ media_url: "https://x/a.mp4", poster_url: "https://x/gone.jpg" }} /></MemoryRouter>);
    fireEvent.error(screen.getByTestId("clip-poster"));
    expect(screen.getByTestId("clip-first-frame")).toBeTruthy();
  });
});
