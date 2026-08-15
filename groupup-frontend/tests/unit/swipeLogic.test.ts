import { describe, it, expect } from "vitest";
import { SwipeSchema } from "@/lib/schemas";

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

describe("MSW swipe handler", () => {
  it("returns a boolean isMatch", async () => {
    const res = await fetch("http://localhost/api/swipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetProfileId: "p_1", action: "LIKE" }),
    });
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(typeof data.isMatch).toBe("boolean");
  });

  it("rejects a swipe without a targetProfileId", async () => {
    const res = await fetch("http://localhost/api/swipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "LIKE" }),
    });
    expect(res.status).toBe(400);
  });
});