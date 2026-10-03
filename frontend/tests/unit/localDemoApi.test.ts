import { afterEach, describe, expect, it, vi } from "vitest";
import { getMessages, getMyGroups, getProfiles } from "@/lib/api";
import { useAuthStore } from "@/lib/store/authStore";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("local demo API", () => {
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
