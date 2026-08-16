import { describe, it, expect, afterEach, vi } from "vitest";
import { useAuthStore } from "@/lib/store/authStore";

const verifiedUser = {
  id: "u_me",
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
  it("hydrate sets the verified user when /auth/me returns ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      okResponse({ user: verifiedUser, token: "mock-jwt" })
    ));
    await useAuthStore.getState().hydrate();
    const s = useAuthStore.getState();
    expect(s.user?.email).toBe("jordan@nationaluniversity.edu");
    expect(s.isVerified).toBe(true);
    expect(s.tier).toBe(3);
  });

  it("hydrate leaves user null when fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    await useAuthStore.getState().hydrate();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it("verifyEmail updates state on success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      okResponse({ user: verifiedUser, token: "mock-jwt" })
    ));
    const result = await useAuthStore.getState().verifyEmail("test@university.edu");
    expect(result.ok).toBe(true);
    expect(useAuthStore.getState().isVerified).toBe(true);
  });

  it("verifyEmail returns an error on a failure response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      errorResponse(400, { error: "Not a .edu email" })
    ));
    const result = await useAuthStore.getState().verifyEmail("test@gmail.com");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Not a .edu email");
  });

  it("logout resets auth state", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      okResponse({ user: verifiedUser, token: "mock-jwt" })
    ));
    await useAuthStore.getState().hydrate();
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().tier).toBe(1);
  });
});