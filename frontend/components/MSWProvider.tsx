"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";

export function MSWProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const mockSetting = process.env.NEXT_PUBLIC_USE_MOCK_API;
    const useMock = mockSetting === "true" || (process.env.NODE_ENV === "development" && mockSetting !== "false");

    async function boot() {
      if (useMock) {
        try {
          const { worker } = await import("../lib/mocks/browser");
          await worker.start({ onUnhandledRequest: "bypass" });
          if (!active) return;

          const { db } = await import("../lib/mocks/db");
          const auth = useAuthStore.getState();
          if (!auth.token) auth.setToken("groupup-demo-session");
          auth.setUser(db.currentUser);
          setReady(true);
          void useAuthStore.getState().hydrate();
          return;
        } catch (error) {
          console.error("Could not start the local demo API.", error);
        }
      }

      if (active) {
        setReady(true);
        void useAuthStore.getState().hydrate();
      }
    }

    void boot();
    return () => {
      active = false;
    };
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}
