import { describe, expect, it } from "vitest";
import { YOU_PICK_PLACE, buildEatInviteMessageDraft } from "../eatInviteShareCopy.js";

describe("You pick the place share copy (mig 0432)", () => {
  it("never says 'at You pick the place'", () => {
    const text = buildEatInviteMessageDraft({ restaurantName: YOU_PICK_PLACE, seedCode: "LDL", dateLabel: "Sat", timeLabel: "12:00 PM" });
    expect(text).not.toMatch(/at You pick/);
    expect(text).toMatch(/Let's do lunch Sat at 12:00 PM\. You pick the place\./);
  });
  it("a set place still reads 'at <place>'", () => {
    expect(buildEatInviteMessageDraft({ restaurantName: "Sweetgreen", seedCode: "LDL" })).toMatch(/Let's do lunch at Sweetgreen\./);
  });
});
