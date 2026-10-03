"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { isMockMode } from "@/lib/mocks/mode";

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    // Older local runs registered MSW's worker; it is no longer part of the demo.
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          const workers = [registration.active, registration.waiting, registration.installing].filter(Boolean);
          if (workers.some((worker) => worker?.scriptURL.includes("mockServiceWorker.js"))) {
            void registration.unregister();
          }
        }
      }).catch(() => undefined);
    }

    if (isMockMode()) {
      void import("@/lib/mocks/db").then(({ db }) => {
        if (!active) return;
        const auth = useAuthStore.getState();
        if (!auth.token) auth.setToken("groupup-demo-session");
        auth.setUser(db.currentUser);
        setReady(true);
      }).catch((error) => {
        console.error("Could not load the local demo data.", error);
        if (active) setReady(true);
      });
    } else {
      setReady(true);
      void useAuthStore.getState().hydrate();
    }

    return () => { active = false; };
  }, []);

  if (!ready) {
    return (
      <div role="status" aria-live="polite" className="grid min-h-screen place-items-center bg-[#f7f6f4] px-5 text-center">
        <div>
          <span className="instagram-gradient mx-auto grid h-12 w-12 place-items-center rounded-2xl text-lg font-black text-white shadow-lg">G</span>
          <p className="mt-4 text-sm font-bold text-[#383330]">Getting your campus circle ready…</p>
          <p className="mt-1 text-xs text-[#8d8580]">Loading the local demo, no backend needed.</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
