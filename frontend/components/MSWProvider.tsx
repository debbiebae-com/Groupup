"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";

export function MSWProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const useMock = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";
    if (useMock) {
      import("../lib/mocks/browser").then(async ({ worker }) => {
        await worker.start({ onUnhandledRequest: "bypass" });
        setReady(true);
        useAuthStore.getState().hydrate();
      });
    } else {
      setReady(true);
      useAuthStore.getState().hydrate();
    }
  }, []);

  if (!ready) return null;

  return <>{children}</>;
}