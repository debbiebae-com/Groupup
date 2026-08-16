import { describe, it, expect, afterEach, vi } from "vitest";
import { SwipeSchema } from "@/lib/schemas";
import { sendSwipe } from "@/lib/api/swipe";

afterEach(() => vi.unstubAllGlobals());

describe("SwipeSchema validation", () => {
  it("accepts a valid LIKE payload", () => {
    expect(() =>
      SwipeSchema.parse({ targetProfileId: "p_1", action: "LIKE" })
    ).not.toThrow();
  });

  it("accepts a valid PASS payload", () => {
    expect(() =>
      SwipeSchema.parse({ targetProfileId: "p_1", action: "PASS" })
    ).not.toThrow();
  });

  it("rejects an invalid action", () => {
    expect(() =>
      SwipeSchema.parse({ targetProfileId: "p_1", action: "MAYBE" })
    ).toThrow();
  });

  it("rejects a missing targetProfileId", () => {
    expect(() => SwipeSchema.parse({ action: "LIKE" })).toThrow();
  });
});

describe("sendSwipe service", () => {
  it("returns isMatch from the response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ isMatch: true, matchId: "match_1" }),
    } as Response));

    const res = await sendSwipe({ targetProfileId: "p_1", action: "LIKE" });
    expect(res.isMatch).toBe(true);
    expect(res.matchId).toBe("match_1");
  });

  it("throws on an error response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: "Invalid payload" }),
    } as Response));

    await expect(
      sendSwipe({ targetProfileId: "p_1", action: "LIKE" })
    ).rejects.toThrow();
  });
});