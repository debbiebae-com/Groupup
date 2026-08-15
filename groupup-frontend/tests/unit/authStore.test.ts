import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "@/lib/store/authStore";

describe("authStore", () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it("hydrates the verified mock user from /api/auth/me", async () => {
    await useAuthStore.getState().hydrate();
    const s = useAuthStore.getState();
    expect(s.user?.email).toBe("jordan@nationaluniversity.edu");
    expect(s.isVerified).toBe(true);
    expect(s.tier).toBe(3);
  });

  it("verifyEmail accepts a .edu address and updates state", async () => {
    const result = await useAuthStore.getState().verifyEmail("test@university.edu");
    expect(result.ok).toBe(true);
    expect(useAuthStore.getState().isVerified).toBe(true);
  });

  it("verifyEmail rejects a non-.edu address", async () => {
    const result = await useAuthStore.getState().verifyEmail("test@gmail.com");
    expect(result.ok).toBe(false);
  });

  it("logout resets auth state", async () => {
    await useAuthStore.getState().hydrate();
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isVerified).toBe(false);
    expect(useAuthStore.getState().tier).toBe(1);
  });
});