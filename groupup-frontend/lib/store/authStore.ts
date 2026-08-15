"use client";

import { create } from "zustand";
import type { User } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

interface AuthState {
  user: User | null;
  isVerified: boolean;
  token: string | null;
  loading: boolean;
  tier: 1 | 2 | 3;
  setUser: (user: User) => void;
  setToken: (token: string | null) => void;
  verifyEmail: (email: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isVerified: false,
  token: null,
  loading: false,
  tier: 1,

  setUser: (user) =>
    set({
      user,
      isVerified: user.verificationStatus === "VERIFIED",
      tier: user.tier,
    }),

  setToken: (token) => set({ token }),

  verifyEmail: async (email) => {
    set({ loading: true });
    try {
      const res = await fetch(`${API_URL}/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        set({ loading: false });
        return { ok: false, error: err?.error ?? "Verification failed" };
      }
      const data = await res.json();
      set({
        user: data.user,
        isVerified: data.user.verificationStatus === "VERIFIED",
        tier: data.user.tier,
        token: data.token,
        loading: false,
      });
      return { ok: true };
    } catch {
      set({ loading: false });
      return { ok: false, error: "Network error" };
    }
  },

  logout: () => set({ user: null, isVerified: false, token: null, tier: 1 }),
}));
