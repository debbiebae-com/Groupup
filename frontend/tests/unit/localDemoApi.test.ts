import { afterEach, describe, expect, it, vi } from "vitest";
import { getMessages, getMyGroups, getProfiles } from "@/lib/api";
import { useAuthStore } from "@/lib/store/authStore";
import { clearLocalDemoMode, enableLocalDemoMode, isMockMode } from "@/lib/mocks/mode";

afterEach(() => {
  clearLocalDemoMode();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("local demo API", () => {
  it("lets the demo button force local mode even when backend mode is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCK_API", "false");
    clearLocalDemoMode();
    expect(isMockMode()).toBe(false);

    enableLocalDemoMode();
    expect(isMockMode()).toBe(true);
  });

  it("uses local login after the demo action even when backend mode is configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCK_API", "false");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    enableLocalDemoMode();

    const result = await useAuthStore.getState().login("jordan@nationaluniversity.edu", "groupup-demo");

    expect(result.ok).toBe(true);
    expect(useAuthStore.getState().user?.displayName).toBe("Jordan Lee");
    expect(fetch).not.toHaveBeenCalled();
    useAuthStore.getState().logout();
  });

  it("loads seeded profiles, groups and messages without making a network request", async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCK_API", "true");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);

    const [profiles, groups, messages] = await Promise.all([
      getProfiles(),
      getMyGroups(),
      getMessages("g_1"),
    ]);

    expect(profiles.profiles).toHaveLength(12);
    expect(profiles.profiles.every((profile) => profile.avatarUrl?.startsWith("/images/demo/"))).toBe(true);
    expect(groups.groups.map((group) => group.name)).toEqual(["Campus West 3BR", "The Sunday Reset"]);
    expect(messages.messages).toHaveLength(3);

    const login = await useAuthStore.getState().login("jordan@nationaluniversity.edu", "groupup-demo");
    expect(login.ok).toBe(true);
    expect(useAuthStore.getState().user?.displayName).toBe("Jordan Lee");
    expect(useAuthStore.getState().token).toBe("groupup-demo-session");
    expect(fetch).not.toHaveBeenCalled();
  });
});
