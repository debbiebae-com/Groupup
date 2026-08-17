"use client";

import { create } from "zustand";
import type { User } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";
const TOKEN_KEY = "groupup_token";

function persistToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

interface AuthState {
  user: User | null;
  isVerified: boolean;
  token: string | null;
  loading: boolean;
  tier: 1 | 2 | 3;
  setUser: (user: User) => void;
  setToken: (token: string | null) => void;
  hydrate: () => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<{ ok: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  requestVerification: (email: string) => Promise<{ ok: boolean; devToken?: string; error?: string }>;
  confirmVerification: (email: string, token: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isVerified: false,
  token: readToken(),
  loading: false,
  tier: 1,

  setUser: (user) =>
    set({ user, isVerified: user.verificationStatus === "VERIFIED", tier: user.tier }),

  setToken: (token) => {
    persistToken(token);
    set({ token });
  },

  hydrate: async () => {
    const token = get().token;
    if (!token) return;
    set({ loading: true });
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        set({
          user: data.user,
          isVerified: data.user.verificationStatus === "VERIFIED",
          tier: data.user.tier,
        });
      } else if (res.status === 401) {
        persistToken(null);
        set({ token: null, user: null, isVerified: false, tier: 1 });
      }
    } catch {
      // network error — keep current state
    } finally {
      set({ loading: false });
    }
  },

  register: async (email, password, displayName) => {
    set({ loading: true });
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, displayName }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        set({ loading: false });
        return { ok: false, error: data?.error ?? "Registration failed" };
      }
      persistToken(data.token);
      set({
        token: data.token,
        user: data.user,
        isVerified: data.user.verificationStatus === "VERIFIED",
        tier: data.user.tier,
        loading: false,
      });
      return { ok: true };
    } catch {
      set({ loading: false });
      return { ok: false, error: "Network error" };
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        set({ loading: false });
        return { ok: false, error: data?.error ?? "Login failed" };
      }
      persistToken(data.token);
      set({
        token: data.token,
        user: data.user,
        isVerified: data.user.verificationStatus === "VERIFIED",
        tier: data.user.tier,
        loading: false,
      });
      return { ok: true };
    } catch {
      set({ loading: false });
      return { ok: false, error: "Network error" };
    }
  },

  requestVerification: async (email) => {
    set({ loading: true });
    try {
      const res = await fetch(`${API_URL}/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => null);
      set({ loading: false });
      if (!res.ok) return { ok: false, error: data?.error ?? "Verification request failed" };
      return { ok: true, devToken: data.devToken };
    } catch {
      set({ loading: false });
      return { ok: false, error: "Network error" };
    }
  },

  confirmVerification: async (email, token) => {
    set({ loading: true });
    try {
      const res = await fetch(`${API_URL}/auth/verify/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        set({ loading: false });
        return { ok: false, error: data?.error ?? "Verification failed" };
      }
      set({
        user: data.user,
        isVerified: data.user.verificationStatus === "VERIFIED",
        tier: data.user.tier,
        loading: false,
      });
      return { ok: true };
    } catch {
      set({ loading: false });
      return { ok: false, error: "Network error" };
    }
  },

  logout: () => {
    persistToken(null);
    set({ user: null, isVerified: false, token: null, tier: 1 });
  },
}));