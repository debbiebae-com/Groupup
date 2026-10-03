import { useAuthStore } from "@/lib/store/authStore";
import { isMockMode } from "@/lib/mocks/mode";

type Options = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string | null;
};

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export async function apiFetch<T>(path: string, options: Options = {}): Promise<T> {
  if (isMockMode()) {
    const { demoApiRequest } = await import("@/lib/mocks/localApi");
    return demoApiRequest<T>(path, options);
  }

  const { body, token, headers, ...rest } = options;
  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };
  const authToken = token ?? useAuthStore.getState().token;
  if (authToken) finalHeaders.Authorization = `Bearer ${authToken}`;

  const response = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}
