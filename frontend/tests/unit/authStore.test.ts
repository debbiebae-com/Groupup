import { describe, it, expect, afterEach, vi } from "vitest";
import { useAuthStore } from "@/lib/store/authStore";

const verifiedUser = {
  id: "u_1",
  email: "jordan@nationaluniversity.edu",
  displayName: "Jordan",
  verificationStatus: "VERIFIED",
  badges: ["verified_student"],
  tier: 3,
};

function okResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body } as Response;
}
function errorResponse(status: number, body: unknown) {
  return { ok: false, status, json: async () => body } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
  useAuthStore.getState().logout();
});

describe("authStore", () => {
  it("login updates state with user and token", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      okResponse({ user: verifiedUser, token: "jwt-token" })
    ));
    const result = await useAuthStore.getState().login("jordan@university.edu", "password123");
    expect(result.ok).toBe(true);
    expect(useAuthStore.getState().user?.email).toBe("jordan@nationaluniversity.edu");
    expect(useAuthStore.getState().isVerified).toBe(true);
    expect(useAuthStore.getState().tier).toBe(3);
  });

  it("login returns an error on failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      errorResponse(401, { error: "Invalid email or password" })
    ));
    const result = await useAuthStore.getState().login("x@y.edu", "wrong");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Invalid email or password");
  });

  it("confirmVerification sets verified state", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      okResponse({ user: verifiedUser })
    ));
    const result = await useAuthStore.getState().confirmVerification("jordan@university.edu", "abc123");
    expect(result.ok).toBe(true);
    expect(useAuthStore.getState().isVerified).toBe(true);
  });

  it("logout resets auth state", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      okResponse({ user: verifiedUser, token: "jwt-token" })
    ));
    await useAuthStore.getState().login("jordan@university.edu", "password123");
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().tier).toBe(1);
  });
});