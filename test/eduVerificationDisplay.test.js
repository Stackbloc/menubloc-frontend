/**
 * Frontend unit tests for public .edu badge formatting.
 */

import { describe, expect, it } from "vitest";
import {
  formatEduVerificationBadge,
  getEduVerificationFromConsumer,
} from "../src/lib/eduVerificationDisplay.js";

describe("eduVerificationDisplay", () => {
  it("formats USC badge without email", () => {
    const badge = formatEduVerificationBadge({
      institutionShort: "USC",
      institutionName: "University of Southern California",
    });
    expect(badge).toBe("✓ Verified .edu address — USC");
    expect(badge.includes("@")).toBe(false);
  });

  it("reads verified consumer public fields only", () => {
    const status = getEduVerificationFromConsumer({
      edu_verified: true,
      edu_institution_short: "USC",
      edu_institution_name: "University of Southern California",
      edu_email_domain: "usc.edu",
      edu_email: "secret@usc.edu",
    });
    expect(status.edu_verified).toBe(true);
    expect(status.badge).toBe("✓ Verified .edu address — USC");
    expect(JSON.stringify(status).includes("secret@")).toBe(false);
  });
});
