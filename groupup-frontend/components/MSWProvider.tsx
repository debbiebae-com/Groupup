"use client";

import { useEffect, useState } from "react";

export function MSWProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_USE_MOCK_API === "true") {
      import("../lib/mocks/browser").then(async ({ worker }) => {
        await worker.start({ onUnhandledRequest: "bypass" });
        setReady(true);
      });
    } else {
      setReady(true);
    }
  }, []);

  if (!ready && process.env.NODE_ENV === "development") return null;

  return <>{children}</>;
}
