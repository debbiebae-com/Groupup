"use client";

import { create } from "zustand";
import type { User } from "@/types/api";
import { isMockMode } from "@/lib/mocks/mode";

type ApiOptions = Omit<RequestInit, "body"> & { body?: unknown };
type ApiError = Error & { status?: number };

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

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  if (isMockMode()) {
    const { demoApiRequest } = await import("@/lib/mocks/localApi");
    return demoApiRequest<T>(path, options);
  }

  const { body, headers, ...rest } = options;
  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: { "Content-Type": "application/json", ...(headers as Record<string, string>) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.error ?? `Request failed with status ${response.status}`) as ApiError;
    error.status = response.status;
    throw error;
  }
  return data as T;
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

  setUser: (user) => set({ user, isVerified: user.verificationStatus === "VERIFIED", tier: user.tier }),

  setToken: (token) => {
    persistToken(token);
    set({ token });
  },

  hydrate: async () => {
    const token = get().token;
    if (!token) return;
    set({ loading: true });
    try {
      const data = await request<{ user: User }>("/auth/me", { headers: { Authorization: `Bearer ${token}` } });
      set({ user: data.user, isVerified: data.user.verificationStatus === "VERIFIED", tier: data.user.tier });
    } catch (error) {
      if ((error as ApiError)?.status === 401) {
        persistToken(null);
        set({ token: null, user: null, isVerified: false, tier: 1 });
      }
    } finally {
      set({ loading: false });
    }
  },

  register: async (email, password, displayName) => {
    set({ loading: true });
    try {
      const data = await request<{ token: string; user: User }>("/auth/register", {
        method: "POST",
        body: { email, password, displayName },
      });
      persistToken(data.token);
      set({ token: data.token, user: data.user, isVerified: data.user.verificationStatus === "VERIFIED", tier: data.user.tier });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Registration failed" };
    } finally {
      set({ loading: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const data = await request<{ token: string; user: User }>("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      persistToken(data.token);
      set({ token: data.token, user: data.user, isVerified: data.user.verificationStatus === "VERIFIED", tier: data.user.tier });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Login failed" };
    } finally {
      set({ loading: false });
    }
  },

  requestVerification: async (email) => {
    set({ loading: true });
    try {
      const data = await request<{ devToken?: string }>("/auth/verify", { method: "POST", body: { email } });
      return { ok: true, devToken: data.devToken };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Verification request failed" };
    } finally {
      set({ loading: false });
    }
  },

  confirmVerification: async (email, token) => {
    set({ loading: true });
    try {
      const data = await request<{ user: User }>("/auth/verify/confirm", { method: "POST", body: { email, token } });
      set({ user: data.user, isVerified: data.user.verificationStatus === "VERIFIED", tier: data.user.tier });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Verification failed" };
    } finally {
      set({ loading: false });
    }
  },

  logout: () => {
    persistToken(null);
    set({ user: null, isVerified: false, token: null, tier: 1, loading: false });
  },
}));
