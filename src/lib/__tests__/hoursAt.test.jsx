// Plan 77 (2026-11-27): web plan hours text matches the app.
import { describe, expect, it } from "vitest";
import { confirmIfClosed, hoursAtLine, parseHoursAt } from "../hoursAt.jsx";

describe("plan hours text", () => {
  const closed = parseHoursAt({ status: "closed", next_open: { date: "2026-11-25", time: "13:00", day: "Wed", label: "1 PM" } });
  it("closed / closing soon / open / unknown", () => {
    expect(hoursAtLine("Klaudette's Kitchen", closed, "2026-11-25")).toBe("Klaudette's Kitchen is closed then · opens 1 PM");
    expect(hoursAtLine("Klaudette's Kitchen", closed, "2026-11-24")).toBe("Klaudette's Kitchen is closed then · opens Wed 1 PM");
    const soon = parseHoursAt({ status: "closing_soon", closes: { date: "2026-11-27", time: "22:00", day: "Fri", label: "10 PM" }, closes_in_minutes: 45 });
    expect(hoursAtLine("K", soon, "2026-11-27")).toBe("K closes at 10 PM, 45 min after your time");
    expect(hoursAtLine("K", parseHoursAt({ status: "open" }), "2026-11-27")).toBeNull();
    expect(hoursAtLine("K", parseHoursAt({ ok: false, error: "Not found" }), "2026-11-27")).toBeNull();
  });
  it("asks only when closed", () => {
    const asked = [];
    expect(confirmIfClosed("K", closed, "2026-11-25", "08:00", "Send anyway", (m) => (asked.push(m), false))).toBe(false);
    expect(asked[0]).toContain("It's closed at 8:00 AM on Wed. It opens 1 PM.");
    expect(confirmIfClosed("K", parseHoursAt({ status: "open" }), "2026-11-25", "08:00", "Send anyway", () => false)).toBe(true);
  });
});
